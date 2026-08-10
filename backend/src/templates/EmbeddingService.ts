import type { Embeddings } from '../ports/Embeddings';
import type { VectorStore } from '../ports/VectorStore';
import type { Chunk } from '../shared-kernel/types';

/**
 * Embeds chunk text via the Embeddings port and upserts chunk + vector pairs
 * into the VectorStore. This is the only caller of the embeddings endpoint.
 */
export class EmbeddingService {
  private embeddings: Embeddings;
  private vectorStore: VectorStore;

  constructor(embeddings: Embeddings, vectorStore: VectorStore) {
    this.embeddings = embeddings;
    this.vectorStore = vectorStore;
  }

  async embedAndStore(chunks: Chunk[]): Promise<void> {
    if (chunks.length === 0) return;
    const vectors = await this.embeddings.embedBatch(
      chunks.map((c) => c.text),
    );
    await this.vectorStore.upsert(chunks, vectors);
  }
}
