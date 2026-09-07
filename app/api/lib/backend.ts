import { NeonRepository } from '@backend/adapters/neon/index';
import { QdrantAdapter } from '@backend/adapters/qdrant/index';
import { EmbeddingsAdapter } from '@backend/adapters/embeddings/index';
import { CloudinaryAdapter } from '@backend/adapters/cloudinary/index';
import { TavilyAdapter } from '@backend/adapters/tavily/index';
import { FirecrawlAdapter } from '@backend/adapters/firecrawl/index';
import { LimitsService } from '@backend/contexts/limits/index';
import { NotebookService } from '@backend/contexts/notebooks/index';
import { SourceService } from '@backend/contexts/sources/index';
import { IngestionService } from '@backend/contexts/ingestion/index';
import { SourceIndexer } from '@backend/templates/SourceIndexer';
import { EmbeddingService } from '@backend/templates/EmbeddingService';
import { LlmAdapter } from '@backend/adapters/llm/index';
import { VectorStoreMemoryStrategy } from '@backend/templates/VectorStoreMemoryStrategy';
import { GroundedAnswerReasoningStrategy } from '@backend/templates/GroundedAnswerReasoningStrategy';
import { WebSearchTool } from '@backend/templates/WebSearchTool';
import { ChatService } from '@backend/contexts/chat/index';
import { FetchOnRefusalService } from '@backend/contexts/fetch-on-refusal/index';

interface BackendServices {
  repo: NeonRepository;
  limits: LimitsService;
  notebooks: NotebookService;
  sources: SourceService;
  chatFor: (notebookId: string, userId?: string) => ChatService;
  fetchOnRefusal: FetchOnRefusalService;
}

let backendPromise: Promise<BackendServices> | null = null;

/**
 * Composition root singleton.
 *
 * Lazily constructs every adapter and owning context once and reuses them
 * across route invocations (Vercel serverless module cache). Runs the idempotent
 * schema migration before any service is used. Adapters are constructed only
 * here — routes never construct them directly.
 */
export function getBackend(): Promise<BackendServices> {
  if (!backendPromise) {
    backendPromise = (async () => {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error(
          'DATABASE_URL is not set. Configure the Neon connection string to use the notebooks API.',
        );
      }
      const repo = new NeonRepository(databaseUrl);
      await repo.runMigrations();

      const embeddings = new EmbeddingsAdapter();
      const qdrant = new QdrantAdapter();
      const storage = new CloudinaryAdapter();
      const scraper = new FirecrawlAdapter();
      const search = new TavilyAdapter();

      const embeddingService = new EmbeddingService(embeddings, qdrant);
      const ingestion = new IngestionService(repo, storage, scraper, embeddingService);
      const indexer = new SourceIndexer(ingestion);

      const limits = new LimitsService(repo);
      const notebooks = new NotebookService(repo, limits);
      const sources = new SourceService(repo, storage, limits, indexer, qdrant);

      const llm = new LlmAdapter();
      const reasoning = new GroundedAnswerReasoningStrategy();
      // ChatService is notebook-scoped (VectorStoreMemoryStrategy is
      // constructed per notebookId to keep retrieval strictly filtered), so
      // we expose a factory rather than a single shared instance.
      const chatFor = (notebookId: string, userId?: string) => {
        const memory = new VectorStoreMemoryStrategy(qdrant, embeddings, notebookId, 5, 0.3, userId);
        return new ChatService(repo, memory, reasoning, llm);
      };

      const webSearchTool = new WebSearchTool(search);
      const fetchOnRefusal = new FetchOnRefusalService(webSearchTool, sources, indexer);

      return { repo, limits, notebooks, sources, chatFor, fetchOnRefusal };
    })();
  }
  return backendPromise;
}
