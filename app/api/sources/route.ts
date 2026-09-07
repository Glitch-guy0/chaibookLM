import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse, serializeSource } from '../helpers';
import { getBackend } from '../lib/backend';
import { checkRateLimit, rateLimitResponse } from '../lib/rate-limit';

function deriveTitle(content: string, fallback: string): string {
  const firstLine = content
    .split('\n')
    .map((l) => l.trim().replace(/^#{1,6}\s+/, ''))
    .find(Boolean);
  if (!firstLine) return fallback;
  return firstLine.length > 80 ? firstLine.slice(0, 80) : firstLine;
}

/**
 * POST /api/sources
 * Creates a source in a notebook across 5 modalities: text, web, pdf, transcript, youtube.
 * Returns HTTP 201 with status 'queued' and dispatches Inngest event in < 200ms.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const rateLimit = checkRateLimit();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body', 'INVALID_BODY', 400);
  }

  const b = body as {
    notebookId?: unknown;
    type?: unknown;
    content?: unknown;
    url?: unknown;
    title?: unknown;
  };

  const notebookId = typeof b.notebookId === 'string' ? b.notebookId.trim() : '';
  if (!notebookId) {
    return errorResponse('Notebook ID is required', 'INVALID_BODY', 400);
  }

  const { notebooks, sources } = await getBackend();
  const notebook = await notebooks.findById(notebookId);
  if (!notebook || notebook.userId !== userId) {
    return errorResponse('Notebook not found', 'NOT_FOUND', 404);
  }

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
      notebookId,
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
    const { inngest } = await import('../inngest/client');
    void inngest.send({
      name: 'source.ingest',
      data: {
        sourceId: result.source.id,
        notebookId,
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
