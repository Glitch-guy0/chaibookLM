export interface User {
  id: string; // Clerk userId
  email: string;
  createdAt: Date;
}

export interface Notebook {
  id: string; // UUID
  userId: string;
  title: string;
  sourceCount: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface Source {
  id: string; // UUID
  notebookId: string;
  userId: string;
  type: 'text' | 'web' | 'pdf' | 'transcript' | 'youtube';
  title: string;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  size: number;
  chunkCount?: number;
  failReason?: string;
  createdAt: Date;
}

export interface Chunk {
  chunkId: string; // deterministic hash of sourceId + position
  sourceId: string;
  notebookId: string;
  userId?: string;
  span: { start: number; end: number };
  position: number;
  text: string;
  excerpt?: string;
  metadata?: {
    pageNumber?: number;
    timestampSeconds?: number;
    link?: string;
    [key: string]: any;
  };
}

export interface ChatMessage {
  id: string;
  notebookId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: CitationSnapshot[];
  createdAt: Date;
}

export interface CitationSnapshot {
  chunkId: string;
  sourceId: string;
  span: { start: number; end: number };
}

export interface LimitCounter {
  userId: string;
  resourceType: 'notebooks' | 'sources_per_user' | 'sources_per_notebook' | 'source_size';
  count: number;
  cap: number;
}

export interface LimitsConfig {
  maxNotebooksPerUser: number;
  maxSourcesPerNotebook: number;
  maxSourcesPerUser: number;
  maxSourceSizeBytes: number;
  notebookTtlDays: number;
}

export interface ApiError {
  message: string;
  code: string;
}