import type { Chunk } from '../shared-kernel/types';

export interface ScoredChunk extends Chunk {
  score: number;
}

export interface VectorStore {
  search(params: {
    queryVector: number[];
    notebookId: string;
    userId?: string;
    topK: number;
    minScore: number;
  }): Promise<ScoredChunk[]>;
  /**
   * Upsert chunks alongside their vectors. `vectors` must be same-length and
   * ordered as `chunks`. Optional so in-memory/test implementations can embed
   * lazily, but production storage requires both.
   */
  upsert(chunks: Chunk[], vectors?: number[][]): Promise<void>;
  deleteBySourceId(sourceId: string): Promise<void>;
  deleteByNotebookId?(notebookId: string): Promise<void>;
}