// ChatService
//
// Orchestrates one notebook-scoped chat turn end-to-end. Per the 2026-08-10
// Spec Change Log amendment, this does NOT construct a shikigami Agent or
// wire reasoningManager/memoryManager -- it calls
// VectorStoreMemoryStrategy.retrieveChunks, GroundedAnswerReasoningStrategy's
// prompt builders, and LlmAdapter.streamComplete directly, forwarding tokens
// to the caller via an async generator that the route adapts into an HTTP
// stream.

import {
  NOT_IN_SOURCES_ANSWER,
  FAILED_CONTENT_MARKER,
  isFailedContent,
  stripFailedMarker,
} from '../../templates/GroundedAnswerReasoningStrategy';
import { NotebookSession } from '../../templates/NotebookSession';
import type { ChatMessage } from '../../shared-kernel/types';
import type { ScoredChunk } from '../../ports/VectorStore';

// Re-exported for backward compatibility -- these are now defined alongside
// GroundedAnswerReasoningStrategy.buildHistory (which needs to strip the
// marker from prior turns) to avoid a templates <-> contexts circular import.
export { FAILED_CONTENT_MARKER, isFailedContent, stripFailedMarker };

// Narrow structural interfaces for the collaborators ChatService actually
// calls -- concrete NeonRepository/VectorStoreMemoryStrategy/
// GroundedAnswerReasoningStrategy/LlmAdapter instances satisfy these, and
// tests can supply lightweight fakes without extending the real classes.

export interface ChatRepo {
  createChatMessage(
    notebookId: string,
    userId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
  ): Promise<unknown>;
  findRecentChatMessages(notebookId: string, limit: number): Promise<ChatMessage[]>;
}

export interface ChatMemory {
  retrieveChunks(query: string): Promise<ScoredChunk[]>;
}

export interface ChatReasoning {
  buildSystemPrompt(): string;
  buildUserPrompt(params: {
    history: ChatMessage[];
    chunks: ScoredChunk[];
    message: string;
  }): string;
}

export interface ChatLlm {
  streamComplete(
    systemPrompt: string,
    userPrompt: string,
    signal?: AbortSignal,
  ): Promise<AsyncIterable<string>>;
}

export const HISTORY_WINDOW = 7;

export interface ChatTurnEvent {
  type: 'meta' | 'token' | 'done' | 'error';
  token?: string;
  fullText?: string;
  message?: string;
  /** Emitted once, as the first event, on the 'meta' event -- the id of the
   * persisted (or reused, on retry) user chat_messages row for this turn, so
   * callers can thread it back to the client for a later retry. */
  userMessageId?: string;
}

export class ChatService {
  constructor(
    private readonly repo: ChatRepo,
    private readonly memory: ChatMemory,
    private readonly reasoning: ChatReasoning,
    private readonly llm: ChatLlm,
  ) {}

  /**
   * Runs one turn for notebookId/userId: loads the last HISTORY_WINDOW turns
   * (fetched BEFORE the current user message is persisted, so it never
   * double-counts against its own history window), persists (or, on retry,
   * reuses) the user message, retrieves grounded context exactly once, and
   * yields ChatTurnEvents as the answer streams in. Persists the assistant
   * message (or a failed-marked one) before the generator ends.
   *
   * `retryOfMessageId`, when set, identifies the already-persisted user
   * `chat_messages` row for a previously-failed turn being retried -- no new
   * user row is inserted (avoiding a duplicate that would pollute the AD-9
   * sliding history window), and that row is excluded from the fetched
   * history since it is this turn's own current question, not prior context.
   */
  async *ask(
    userId: string,
    notebookId: string,
    message: string,
    signal?: AbortSignal,
    retryOfMessageId?: string,
  ): AsyncGenerator<ChatTurnEvent> {
    const recent = await this.repo.findRecentChatMessages(
      notebookId,
      HISTORY_WINDOW,
    );
    const historySource = retryOfMessageId
      ? recent.filter((m) => m.id !== retryOfMessageId)
      : recent;

    const session = new NotebookSession(notebookId);
    await session.setTurns(historySource);
    const history = await session.getTurns();

    let userMessageId: string;
    if (retryOfMessageId) {
      userMessageId = retryOfMessageId;
    } else {
      const userRow = (await this.repo.createChatMessage(
        notebookId,
        userId,
        'user',
        message,
      )) as { id: string };
      userMessageId = userRow.id;
    }

    yield { type: 'meta', userMessageId };

    let chunks: ScoredChunk[];
    try {
      chunks = await this.memory.retrieveChunks(message);
    } catch (err) {
      // Fold-in fix: a retrieval failure must persist a failed-marked
      // assistant row too, exactly like an LLM-call failure, so the turn
      // never leaves history with no assistant message at all.
      await this.repo.createChatMessage(
        notebookId,
        userId,
        'assistant',
        FAILED_CONTENT_MARKER,
      );
      const errMessage =
        err instanceof Error ? err.message : 'Retrieval failed';
      yield { type: 'error', message: errMessage };
      return;
    }

    if (chunks.length === 0) {
      await this.repo.createChatMessage(
        notebookId,
        userId,
        'assistant',
        NOT_IN_SOURCES_ANSWER,
      );
      yield { type: 'token', token: NOT_IN_SOURCES_ANSWER };
      yield { type: 'done', fullText: NOT_IN_SOURCES_ANSWER };
      return;
    }

    const systemPrompt = this.reasoning.buildSystemPrompt();
    const userPrompt = this.reasoning.buildUserPrompt({
      history,
      chunks,
      message,
    });

    let assembled = '';
    try {
      const stream = await this.llm.streamComplete(
        systemPrompt,
        userPrompt,
        signal,
      );
      for await (const token of stream) {
        assembled += token;
        yield { type: 'token', token };
      }
      await this.repo.createChatMessage(
        notebookId,
        userId,
        'assistant',
        assembled,
      );
      yield { type: 'done', fullText: assembled };
    } catch (err) {
      const failedContent = FAILED_CONTENT_MARKER + assembled;
      await this.repo.createChatMessage(
        notebookId,
        userId,
        'assistant',
        failedContent,
      );
      const errMessage =
        err instanceof Error ? err.message : 'LLM request failed';
      yield { type: 'error', message: errMessage };
    }
  }
}

export type { ChatMessage };
