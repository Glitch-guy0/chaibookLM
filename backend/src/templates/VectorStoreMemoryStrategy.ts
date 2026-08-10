// VectorStoreMemoryStrategy
// Shikigami-compatible MemoryStrategy backed by the VectorStore port, scoped
// to a single notebook. `retrieve` embeds each chunk's chunkId inline in the
// returned content (`[chunkId] text`) so the id survives into whatever raw
// text reaches the model -- this is what makes citation resolution (Story
// 4.2) possible downstream. `store` is a no-op: chunks are written only by
// the ingestion pipeline, never by chat turns.
//
// `retrieveChunks` is the method ChatService actually calls on the hot path
// (see Design Notes / Spec Change Log amendment): it returns the raw
// ScoredChunk[] so GroundedAnswerReasoningStrategy can format context and
// resolve chunkIds without re-parsing the `[chunkId] text` string.

import type { VectorStore, ScoredChunk } from '../ports/VectorStore';
import type { Embeddings } from '../ports/Embeddings';
import type {
  MemoryStoreInput,
  MemoryStoreResult,
  MemoryRetrieveInput,
  MemoryRetrieveResult,
  KnowledgeEntry,
} from '@glitch-guy0/shikigami/core';

export const DEFAULT_TOP_K = 5;
export const DEFAULT_MIN_SCORE = 0.3;

export class VectorStoreMemoryStrategy {
  readonly name = 'vector-store-memory-strategy';

  constructor(
    private readonly vectorStore: VectorStore,
    private readonly embeddings: Embeddings,
    private readonly notebookId: string,
    private readonly topK: number = DEFAULT_TOP_K,
    private readonly minScore: number = DEFAULT_MIN_SCORE,
  ) {}

  /** Notebook-scoped retrieval returning the raw scored chunks (score, chunkId intact). */
  async retrieveChunks(query: string): Promise<ScoredChunk[]> {
    const queryVector = await this.embeddings.embed(query);
    return this.vectorStore.search({
      queryVector,
      notebookId: this.notebookId,
      topK: this.topK,
      minScore: this.minScore,
    });
  }

  /** Shikigami MemoryStrategy contract: retrieve() returns KnowledgeEntry[] with chunkId inlined into content. */
  async retrieve(input: MemoryRetrieveInput): Promise<MemoryRetrieveResult> {
    const chunks = await this.retrieveChunks(input.query);
    const entries: KnowledgeEntry[] = chunks.map((c) => ({
      id: c.chunkId,
      content: `[${c.chunkId}] ${c.text}`,
      metadata: { sourceId: c.sourceId, notebookId: c.notebookId, score: c.score },
      timestamp: new Date().toISOString(),
    }));
    return { entries, strategy: this.name };
  }

  /** No-op: chunks are only ever written by the ingestion pipeline. */
  async store(_input: MemoryStoreInput): Promise<MemoryStoreResult> {
    return { stored: false, strategy: this.name };
  }
}
