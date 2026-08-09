// ---------------------------------------------------------------------------
// chaibookLM — Backend Index
// ---------------------------------------------------------------------------
// The main entry point for the backend tree. Exports all context services,
// port interfaces, adapter implementations, templates, and shared types.

// Shared kernel
export type {
  User,
  Notebook,
  Source,
  Chunk,
  ChatMessage,
  CitationSnapshot,
  LimitCounter,
  LimitsConfig,
  ApiError,
} from './shared-kernel/types';

// Ports
export type { VectorStore, ScoredChunk } from './ports/VectorStore';
export type { StorageService } from './ports/StorageService';
export type { Embeddings } from './ports/Embeddings';
export type { Search, SearchResult } from './ports/search';

// Adapters
export {
  NeonRepository,
  SCHEMA_MIGRATION,
} from './adapters/neon/index';
export {
  validateSession,
  extractUserIdFromRequest,
  clerkClient,
} from './adapters/clerk/index';
export { QdrantAdapter } from './adapters/qdrant/index';
export { FilebaseAdapter } from './adapters/filebase/index';
export { LlmAdapter } from './adapters/llm/index';
export { EmbeddingsAdapter } from './adapters/embeddings/index';
export { JinaAdapter } from './adapters/jina/index';

// Contexts
export { LimitsService, DEFAULT_LIMITS } from './contexts/limits/index';
export { NotebookService } from './contexts/notebooks/index';

// Templates
export { VectorStoreMemoryStrategy } from './templates/VectorStoreMemoryStrategy';
export { GroundedAnswerReasoningStrategy } from './templates/GroundedAnswerReasoningStrategy';
export { NotebookSession } from './templates/NotebookSession';
export { WebSearchTool } from './templates/WebSearchTool';
export { SourceIndexer } from './templates/SourceIndexer';
export { EmbeddingService } from './templates/EmbeddingService';
export { CitationMapper } from './templates/CitationMapper';