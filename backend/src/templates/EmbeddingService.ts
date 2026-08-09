// Template stub: EmbeddingService
// Generates embeddings for chunks and upserts them into the VectorStore.
// Real implementation deferred to Epic 3 (ingestion).

import type { Embeddings } from '../ports/Embeddings';
import type { VectorStore } from '../ports/VectorStore';

export class EmbeddingService {
  private embeddings: Embeddings;
  private vectorStore: VectorStore;

  constructor(embeddings: Embeddings, vectorStore: VectorStore) {
    this.embeddings = embeddings;
    this.vectorStore = vectorStore;
  }

  async embedAndStore(_chunks: unknown[]): Promise<void> {
    throw new Error('Not implemented');
  }
}