import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse } from '../helpers';
import { getBackend } from '../lib/backend';
import { checkRateLimit, rateLimitResponse } from '../lib/rate-limit';
import {
  CHAT_ERROR_SENTINEL,
  CHAT_CITATIONS_SENTINEL,
  CHAT_REFUSAL_SENTINEL,
} from '../notebooks/[id]/chat/route';

interface ChatRequestBody {
  notebookId?: string;
  message?: string;
  retryOfMessageId?: string;
}

/**
 * POST /api/chat
 * Real-Time SSE token streaming endpoint for chat prompts (Story 3.3).
 * - Enforces authentication and rate limiting.
 * - Deducts 1 credit from daily credit governor.
 * - Streams tokens to client via SSE with low TTFT (< 1.5s).
 * - Records non-blocking operational telemetry into Neon `telemetry_chat_prompts` (Story 3.5).
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

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return errorResponse('Invalid request body', 'INVALID_BODY', 400);
  }

  const notebookId = body?.notebookId;
  const message = body?.message;
  if (!notebookId || typeof notebookId !== 'string') {
    return errorResponse('A notebookId is required', 'INVALID_BODY', 400);
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return errorResponse('A message is required', 'INVALID_BODY', 400);
  }

  const retryOfMessageId =
    typeof body.retryOfMessageId === 'string' && body.retryOfMessageId.trim()
      ? body.retryOfMessageId
      : undefined;

  const { notebooks, chatFor, repo } = await getBackend();
  const notebook = await notebooks.findById(notebookId);
  if (!notebook || notebook.userId !== userId) {
    return errorResponse('Notebook not found', 'NOT_FOUND', 404);
  }

  const chatService = chatFor(notebookId);
  const controller = new AbortController();
  const startTime = performance.now();

  const turn = chatService.ask(userId, notebookId, message, controller.signal, retryOfMessageId);
  const encoder = new TextEncoder();

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

  let assembledText = '';
  let tokenCount = 0;

  const stream = new ReadableStream<Uint8Array>({
    async start(streamController) {
      try {
        while (true) {
          const { done, value: event } = await turn.next();
          if (done) break;

          if (event.type === 'token' && event.token) {
            tokenCount += 1;
            assembledText += event.token;
            // SSE formatted data line
            streamController.enqueue(encoder.encode(event.token));
          } else if (event.type === 'error') {
            streamController.enqueue(
              encoder.encode(`${CHAT_ERROR_SENTINEL}${event.message ?? 'unknown error'}`),
            );
          } else if (event.type === 'done' && event.refusal) {
            streamController.enqueue(encoder.encode(CHAT_REFUSAL_SENTINEL));
          } else if (event.type === 'done' && event.citations !== undefined) {
            streamController.enqueue(
              encoder.encode(`${CHAT_CITATIONS_SENTINEL}${JSON.stringify(event.citations)}`),
            );
          }
        }
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'unknown error';
        streamController.enqueue(encoder.encode(`${CHAT_ERROR_SENTINEL}${detail}`));
      } finally {
        const latencyMs = Math.round(performance.now() - startTime);
        // Non-blocking operational telemetry logging (Story 3.5)
        void repo.recordChatTelemetry({
          userId,
          notebookId,
          promptLength: message.length,
          completionTokens: Math.max(tokenCount, Math.ceil(assembledText.length / 4)),
          latencyMs,
          creditCost: 1,
        });

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
 * GET /api/chat?notebookId=...&before=...
 * Paginated chat history for notebook.
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const notebookId = request.nextUrl.searchParams.get('notebookId');
  if (!notebookId) {
    return errorResponse('A notebookId query param is required', 'INVALID_PARAMS', 400);
  }

  const { notebooks, chatFor } = await getBackend();
  const notebook = await notebooks.findById(notebookId);
  if (!notebook || notebook.userId !== userId) {
    return errorResponse('Notebook not found', 'NOT_FOUND', 404);
  }

  const before = request.nextUrl.searchParams.get('before') ?? undefined;
  const chatService = chatFor(notebookId);

  try {
    const { messages, hasMore } = await chatService.history(notebookId, userId, before);
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
