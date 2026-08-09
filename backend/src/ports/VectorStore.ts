import type { Chunk } from '../shared-kernel/types';

export interface ScoredChunk extends Chunk {
  score: number;
}

export interface VectorStore {
  search(params: {
    queryVector: number[];
    notebookId: string;
    topK: number;
    minScore: number;
  }): Promise<ScoredChunk[]>;
  upsert(chunks: Chunk[]): Promise<void>;
  deleteBySourceId(sourceId: string): Promise<void>;
}