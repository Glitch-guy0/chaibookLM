// Template stub: VectorStoreMemoryStrategy
// Provides shikigami-compatible memory strategy backed by the VectorStore port.
// Real implementation deferred to Epic 3 (ingestion + retrieval).

export class VectorStoreMemoryStrategy {
  async retrieve(_query: string): Promise<unknown[]> {
    throw new Error('Not implemented');
  }
}