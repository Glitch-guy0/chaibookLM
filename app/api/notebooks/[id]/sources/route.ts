import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse, serializeSource } from '../../../helpers';
import { getBackend } from '../../../lib/backend';
import { checkRateLimit, rateLimitResponse } from '../../../lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function deriveTitle(content: string, fallback: string): string {
  const firstLine = content
    .split('\n')
    .map((l) => l.trim().replace(/^#{1,6}\s+/, ''))
    .find(Boolean);
  if (!firstLine) return fallback;
  return firstLine.length > 80 ? firstLine.slice(0, 80) : firstLine;
}

/**
 * GET /api/notebooks/[id]/sources
 * List all sources in a notebook owned by the authenticated user.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { id } = await context.params;
  const { notebooks, sources } = await getBackend();
  const notebook = await notebooks.findById(id);
  if (!notebook || notebook.userId !== userId) {
    return errorResponse('Notebook not found', 'NOT_FOUND', 404);
  }

  const list = await sources.listByNotebook(id);
  return NextResponse.json({ sources: list.map(serializeSource) });
}

/**
 * POST /api/notebooks/[id]/sources
 * Create a Text or Web source in a notebook owned by the authenticated user.
 * Rejects empty text and malformed URLs inline; blocks limit violations with
 * 409. Returns 201 with the queued source and enqueues ingestion.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const rateLimit = checkRateLimit();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  const { id } = await context.params;
  const { notebooks, sources } = await getBackend();
  const notebook = await notebooks.findById(id);
  if (!notebook || notebook.userId !== userId) {
    return errorResponse('Notebook not found', 'NOT_FOUND', 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body', 'INVALID_BODY', 400);
  }

  const b = body as {
    type?: unknown;
    content?: unknown;
    url?: unknown;
    title?: unknown;
  };

  const type = b.type;
  if (
    type !== 'text' &&
    type !== 'web' &&
    type !== 'pdf' &&
    type !== 'transcript' &&
    type !== 'youtube'
  ) {
    return errorResponse('Invalid source type', 'INVALID_BODY', 400);
  }

  let content: string;
  let title: string | undefined;
  if (type === 'text' || type === 'pdf' || type === 'transcript') {
    content = typeof b.content === 'string' ? b.content : '';
    if (!content.trim()) {
      return errorResponse(`${type} content is required`, 'INVALID_BODY', 400);
    }
    const defaultTitle = type === 'pdf' ? 'PDF Document' : type === 'transcript' ? 'Transcript' : 'Text source';
    title =
      typeof b.title === 'string' && b.title.trim()
        ? b.title.trim()
        : deriveTitle(content, defaultTitle);
  } else {
    // web or youtube
    const raw = typeof b.url === 'string' ? b.url.trim() : '';
    if (!raw) {
      return errorResponse('A URL is required', 'INVALID_URL', 400);
    }
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return errorResponse('Please enter a valid URL', 'INVALID_URL', 400);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return errorResponse('Please enter a valid URL', 'INVALID_URL', 400);
    }
    if (type === 'youtube') {
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      if (host !== 'youtube.com' && host !== 'youtu.be') {
        return errorResponse('Please enter a valid YouTube URL', 'INVALID_URL', 400);
      }
    }
    content = raw;
    title =
      typeof b.title === 'string' && b.title.trim() ? b.title.trim() : raw;
  }

  let result;
  try {
    result = await sources.create({
      notebookId: id,
      userId,
      type,
      title: title ?? 'Untitled',
      content,
    });
  } catch {
    return errorResponse('Could not create the source', 'INTERNAL_ERROR', 500);
  }

  if (!result.ok) {
    return NextResponse.json(
      {
        error: { message: result.reason, code: 'SOURCE_CAP_EXCEEDED' },
        count: result.count,
        cap: result.cap,
      },
      { status: 409 },
    );
  }

  // Dispatch Inngest ingestion event asynchronously (non-blocking)
  try {
    const { inngest } = await import('../../../inngest/client');
    void inngest.send({
      name: 'source.ingest',
      data: {
        sourceId: result.source.id,
        notebookId: id,
        userId,
        type,
      },
    }).catch(() => {});
  } catch {
    // Non-blocking fallback
  }

  return NextResponse.json(
    { source: serializeSource(result.source) },
    { status: 201 },
  );
}
