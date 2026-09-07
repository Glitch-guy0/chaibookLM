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
export interface KnowledgeEntry {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface MemoryRetrieveInput {
  query: string;
}

export interface MemoryRetrieveResult {
  entries: KnowledgeEntry[];
  strategy: string;
}

export interface MemoryStoreInput {
  content: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryStoreResult {
  stored: boolean;
  strategy: string;
}

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
    private readonly userId?: string,
  ) {}

  /** Notebook-scoped retrieval returning the raw scored chunks (score, chunkId intact). */
  async retrieveChunks(query: string, userId?: string): Promise<ScoredChunk[]> {
    const targetUserId = userId ?? this.userId;
    const queryVector = await this.embeddings.embed(query);
    const chunks = await this.vectorStore.search({
      queryVector,
      notebookId: this.notebookId,
      userId: targetUserId,
      topK: this.topK,
      minScore: this.minScore,
    });

    if (chunks.length === 0) {
      return [];
    }

    const maxScore = Math.max(...chunks.map((c) => c.score));
    if (maxScore < this.minScore) {
      return [];
    }

    return chunks;
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
