import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse } from '../../../helpers';
import { getBackend } from '../../../lib/backend';
import { checkRateLimit, rateLimitResponse } from '../../../lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/notebooks/[id]/search-fetch
 * Approves a fetch-on-refusal: runs a web search for `{query}` and creates a
 * Web Source per result through FetchOnRefusalService, awaiting ingestion to
 * settle before responding. Auth + ownership mirror the sources route. Only
 * ever called from the "Find related web pages" button click -- the model
 * never invokes web search itself.
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
  const { notebooks, fetchOnRefusal } = await getBackend();
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
  const query = (body as { query?: unknown })?.query;
  if (typeof query !== 'string' || !query.trim()) {
    return errorResponse('A query is required', 'INVALID_BODY', 400);
  }

  const result = await fetchOnRefusal.approve(id, userId, query.trim());

  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason });
  }

  return NextResponse.json({ ok: true, added: result.added });
}
