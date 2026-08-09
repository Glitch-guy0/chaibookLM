// Template stub: SourceIndexer
// Orchestrates the ingestion pipeline: fetch → extract → split → embed → store.
// Real implementation deferred to Epic 3 (ingestion).

export class SourceIndexer {
  async index(_sourceId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}