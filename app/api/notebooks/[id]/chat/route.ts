import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse } from '../../../helpers';
import { getBackend } from '../../../lib/backend';
import { checkRateLimit, rateLimitResponse } from '../../../lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Fixed printable-ASCII marker written to the stream body when the LLM call
 * fails mid-answer. A normal escaped TypeScript string literal -- never a
 * literal control byte pasted into source, which would make tooling treat
 * the file as binary (see Spec Change Log fold-in fix).
 */
export const CHAT_ERROR_SENTINEL = 'CHAT_ERROR:';

/**
 * Fixed printable-ASCII marker written to the stream body, after the answer
 * content and before the stream closes, only on a successful (non-refusal,
 * non-error) completion -- mirrors CHAT_ERROR_SENTINEL's design so the
 * client's existing tail-buffering sentinel scan can be extended to also
 * recognize this one. Payload is `JSON.stringify(citations)` (a
 * CitationSnapshot[], possibly empty).
 */
export const CHAT_CITATIONS_SENTINEL = 'CHAT_CITATIONS:';

/**
 * Fixed printable-ASCII marker written to the stream body, after the answer
 * content and before the stream closes, only when the turn's `done` event
 * carries `refusal: true` -- mirrors CHAT_CITATIONS_SENTINEL's design.
 * Detected on the client via the same tail-buffered sentinel scan, never by
 * string-matching the answer content against NOT_IN_SOURCES_ANSWER.
 */
export const CHAT_REFUSAL_SENTINEL = 'CHAT_REFUSAL:';

/**
 * POST /api/notebooks/[id]/chat
 * Streams a grounded answer to `{message}` as chunked `text/plain`. Auth +
 * ownership follow the same convention as the sources route. The
 * ReadableStream's cancel() aborts the in-flight LLM call via AbortController
 * so a client disconnect doesn't keep burning tokens server-side.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  // Runs after the (cheap) auth check but before any notebook lookup or LLM
  // call, so an authenticated-but-rejected request still costs nothing
  // beyond a counter increment, without letting anonymous requests consume
  // the shared budget (see spec-5-5 Spec Change Log).
  const rateLimit = checkRateLimit();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  const { id } = await context.params;
  const { notebooks, chatFor } = await getBackend();
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
  const message = (body as { message?: unknown })?.message;
  if (typeof message !== 'string' || !message.trim()) {
    return errorResponse('A message is required', 'INVALID_BODY', 400);
  }
  const retryOfMessageIdRaw = (body as { retryOfMessageId?: unknown })?.retryOfMessageId;
  const retryOfMessageId =
    typeof retryOfMessageIdRaw === 'string' && retryOfMessageIdRaw.trim()
      ? retryOfMessageIdRaw
      : undefined;

  const chatService = chatFor(id);
  const controller = new AbortController();
  const turn = chatService.ask(userId, id, message, controller.signal, retryOfMessageId);

  const encoder = new TextEncoder();

  // The turn's first event is always a 'meta' event carrying the persisted
  // (or reused, on retry) user message id. Consume it up front so it can be
  // surfaced as a response header before the streamed body begins -- headers
  // can no longer be set once the ReadableStream has started emitting.
  let userMessageId: string | undefined;
  try {
    const first = await turn.next();
    if (!first.done && first.value.type === 'meta') {
      userMessageId = first.value.userMessageId;
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'unknown error';
    return errorResponse(detail, 'CHAT_FAILED', 500);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(streamController) {
      try {
        while (true) {
          const { done, value: event } = await turn.next();
          if (done) break;
          if (event.type === 'token' && event.token) {
            streamController.enqueue(encoder.encode(event.token));
          } else if (event.type === 'error') {
            streamController.enqueue(
              encoder.encode(`${CHAT_ERROR_SENTINEL}${event.message ?? 'unknown error'}`),
            );
          } else if (event.type === 'done' && event.refusal) {
            // Explicit refusal marker -- never inferred by string-matching
            // fullText against NOT_IN_SOURCES_ANSWER, on either side.
            streamController.enqueue(encoder.encode(CHAT_REFUSAL_SENTINEL));
          } else if (event.type === 'done' && event.citations !== undefined) {
            // Only a successful, non-refusal completion carries `citations`
            // on its 'done' event (ChatService leaves it undefined on the
            // refusal/error paths) -- so this trailer is never sent for
            // those, consistent with zero-citations-on-refusal.
            streamController.enqueue(
              encoder.encode(`${CHAT_CITATIONS_SENTINEL}${JSON.stringify(event.citations)}`),
            );
          }
        }
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'unknown error';
        streamController.enqueue(encoder.encode(`${CHAT_ERROR_SENTINEL}${detail}`));
      } finally {
        streamController.close();
      }
    },
    cancel() {
      controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(userMessageId ? { 'X-Chat-User-Message-Id': userMessageId } : {}),
    },
  });
}

/**
 * GET /api/notebooks/[id]/chat?before=<messageId>
 * Paginated read of persisted chat history (Story 4.5) -- auth + ownership
 * mirror the POST handler above. With no `before`, returns the most recent
 * HISTORY_WINDOW messages; with `before` (a previously-returned message id),
 * returns the next-older page. Always oldest-first, ready for the client to
 * render/prepend directly.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { id } = await context.params;
  const { notebooks, chatFor } = await getBackend();
  const notebook = await notebooks.findById(id);
  if (!notebook || notebook.userId !== userId) {
    return errorResponse('Notebook not found', 'NOT_FOUND', 404);
  }

  const before = request.nextUrl.searchParams.get('before') ?? undefined;

  const chatService = chatFor(id);
  try {
    const { messages, hasMore } = await chatService.history(id, userId, before);
    return Response.json({
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations,
        createdAt: m.createdAt,
      })),
      hasMore,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'unknown error';
    return errorResponse(detail, 'CHAT_HISTORY_FAILED', 500);
  }
}
