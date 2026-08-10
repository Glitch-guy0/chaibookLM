import type { IngestionService } from '../contexts/ingestion/index';

/**
 * Entry point for enqueued ingestion jobs. Delegates to the IngestionService
 * single-writer pipeline. Invoked either by an enqueued job (QStash) or inline
 * fire-and-forget from the create route.
 */
export class SourceIndexer {
  private ingestion: IngestionService;

  constructor(ingestion: IngestionService) {
    this.ingestion = ingestion;
  }

  async index(sourceId: string): Promise<void> {
    await this.ingestion.ingest(sourceId);
  }
}
