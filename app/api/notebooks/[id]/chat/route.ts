import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse } from '../../../helpers';
import { getBackend } from '../../../lib/backend';

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
