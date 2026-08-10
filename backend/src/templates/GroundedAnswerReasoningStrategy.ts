// GroundedAnswerReasoningStrategy
//
// Amended per the 2026-08-10 review-loopback (see spec Spec Change Log): the
// installed shikigami Agent only invokes a registered `reasoningManager` on
// a memory-miss, and always calls the LLM itself with a flattened,
// content-only context on a memory-hit -- so a strategy registered as a
// shikigami `ReasoningStrategy` would never run on this story's grounded
// (memory-hit) path. This class is therefore a PLAIN HELPER, called directly
// by ChatService for every grounded turn -- it is not registered with any
// shikigami `reasoningManager` and does not implement `IBaseReasoningStrategy`.
//
// It only builds prompt text; it never calls the LLM itself.

import type { ScoredChunk } from '../ports/VectorStore';
import type { ChatMessage } from '../shared-kernel/types';

export const NOT_IN_SOURCES_ANSWER = 'Not in your sources.';

/**
 * Fold-in fix: a failed assistant turn must still persist a row so history
 * and retry survive reload, but chat_messages has no status column and the
 * spec forbids a new migration. We encode failure via a fixed printable
 * content prefix (a normal string literal, never a raw control byte) and
 * expose it through isFailedContent/stripFailedMarker so callers never
 * hand-roll the convention. The marker includes a uuid-like suffix (not just
 * plain "[[failed]]") to make collision with genuine model output that
 * happens to start with the same literal text vanishingly unlikely.
 *
 * Lives here (not in contexts/chat) so GroundedAnswerReasoningStrategy.buildHistory
 * can strip it from prior assistant turns without importing from contexts/chat,
 * which would create a templates <-> contexts circular import. contexts/chat
 * re-exports these for backward-compatible external use.
 */
export const FAILED_CONTENT_MARKER = '[[CHAT_FAILED_TURN_8f2e1c9a4b7d]]';

export function isFailedContent(content: string): boolean {
  return content.startsWith(FAILED_CONTENT_MARKER);
}

export function stripFailedMarker(content: string): string {
  return isFailedContent(content)
    ? content.slice(FAILED_CONTENT_MARKER.length)
    : content;
}

export class GroundedAnswerReasoningStrategy {
  /**
   * System prompt instructing the model to answer only from the supplied
   * context and to cite using `[[chunkId]]` markers for chunks that are
   * actually present in that context -- never fabricated ids, never general
   * knowledge.
   */
  buildSystemPrompt(): string {
    return [
      'You are a grounded question-answering assistant for a notebook of user-provided sources.',
      'Answer only using the information in the CONTEXT block below. Do not use any outside or general knowledge.',
      'If the context does not contain enough information to answer, say so plainly -- do not guess.',
      'Each context chunk is tagged with an id like [chunkId] at the start of its text.',
      'When you use information from a chunk, cite it inline immediately after the relevant sentence using the exact marker [[chunkId]], using only chunk ids that appear in the CONTEXT block.',
      'Never invent a chunk id that is not present in the CONTEXT block. Never cite when you have not used that chunk.',
      'Format your answer as markdown.',
    ].join('\n');
  }

  /** Formats retrieved chunks as `[chunkId] text` blocks, one per line/paragraph. */
  buildContext(chunks: ScoredChunk[]): string {
    return chunks.map((c) => `[${c.chunkId}] ${c.text}`).join('\n\n');
  }

  /**
   * Formats the last-N chat turns as a simple transcript for prompt history.
   * Strips the failed-content marker from prior assistant turns first, so a
   * previously-failed turn's internal marker never leaks verbatim into the
   * next prompt. Labels `system`-role messages as `System` rather than
   * falling through to `User` (dead path today -- ChatService never inserts
   * system-role messages -- but the mapping should still be correct).
   */
  buildHistory(turns: ChatMessage[]): string {
    return turns
      .map((t) => {
        const label =
          t.role === 'assistant' ? 'Assistant' : t.role === 'system' ? 'System' : 'User';
        const content = t.role === 'assistant' ? stripFailedMarker(t.content) : t.content;
        return `${label}: ${content}`;
      })
      .join('\n');
  }

  /** Full user-turn prompt: prior turns + grounded context + the new question. */
  buildUserPrompt(params: {
    history: ChatMessage[];
    chunks: ScoredChunk[];
    message: string;
  }): string {
    const historyBlock = this.buildHistory(params.history);
    const contextBlock = this.buildContext(params.chunks);
    const parts: string[] = [];
    if (historyBlock) {
      parts.push(`PRIOR CONVERSATION:\n${historyBlock}`);
    }
    parts.push(`CONTEXT:\n${contextBlock}`);
    parts.push(`QUESTION:\n${params.message}`);
    return parts.join('\n\n');
  }
}
