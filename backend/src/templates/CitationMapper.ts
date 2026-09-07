// CitationMapper
//
// Validates inline `[[chunkId]]` markers emitted by the model (per
// GroundedAnswerReasoningStrategy's system prompt) against the chunk ids
// actually retrieved for this specific chat turn (AD-7: validated, never
// trusted). Unknown/malformed markers are dropped -- they never become a
// citation. Order of the returned CitationSnapshot[] matches order of
// appearance in the answer text; the same chunkId cited more than once
// produces one snapshot per occurrence.

import type { CitationSnapshot } from '../shared-kernel/types';
import type { ScoredChunk } from '../ports/VectorStore';

const MARKER_RE = /\[\[(?:C:)?([^\[\]]+)\]\]/g;

export class CitationMapper {
  /**
   * Scans `answerText` in order for `[[chunkId]]` markers, keeps only those
   * whose chunkId matches a chunk in `retrievedChunks` (the exact set
   * retrieved for this turn -- never all chunks ever indexed for the
   * notebook), and returns an ordered CitationSnapshot[] for the survivors.
   */
  map(answerText: string, retrievedChunks: ScoredChunk[]): CitationSnapshot[] {
    const byChunkId = new Map<string, ScoredChunk>();
    for (const chunk of retrievedChunks) {
      byChunkId.set(chunk.chunkId, chunk);
    }

    const citations: CitationSnapshot[] = [];
    for (const match of answerText.matchAll(MARKER_RE)) {
      const chunkId = match[1];
      const chunk = byChunkId.get(chunkId);
      if (!chunk) continue;
      const citation: CitationSnapshot = {
        chunkId: chunk.chunkId,
        sourceId: chunk.sourceId,
        span: chunk.span,
      };
      if (chunk.metadata?.pageNumber !== undefined) {
        citation.pageNumber = chunk.metadata.pageNumber;
      }
      if (chunk.metadata?.timestampSeconds !== undefined) {
        citation.timestampSeconds = chunk.metadata.timestampSeconds;
      }
      if (chunk.excerpt || chunk.metadata?.excerpt) {
        citation.excerpt = chunk.excerpt || chunk.metadata?.excerpt;
      }
      if (chunk.metadata?.link) {
        citation.link = chunk.metadata.link;
      }
      citations.push(citation);
    }
    return citations;
  }
}
