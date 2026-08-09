import type { VectorStore, ScoredChunk } from '../../ports/VectorStore';
import type { Chunk } from '../../shared-kernel/types';

export class QdrantAdapter implements VectorStore {
  async search(
    _params: {
      queryVector: number[];
      notebookId: string;
      topK: number;
      minScore: number;
    },
  ): Promise<ScoredChunk[]> {
    throw new Error('Not implemented');
  }

  async upsert(_chunks: Chunk[]): Promise<void> {
    throw new Error('Not implemented');
  }

  async deleteBySourceId(_sourceId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}