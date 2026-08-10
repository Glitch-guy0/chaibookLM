import type { VectorStore, ScoredChunk } from '../../ports/VectorStore';
import type { Chunk } from '../../shared-kernel/types';

interface QdrantPoint {
  id: string;
  vector: number[];
  payload: {
    sourceId: string;
    notebookId: string;
    position: number;
    span: { start: number; end: number };
    text: string;
  };
}

/** Format a 32-char hex chunkId into a Qdrant-acceptable UUID string. */
function toUuid(hex: string): string {
  if (hex.length !== 32) {
    throw new Error(`Expected a 32-char hex chunkId, got ${hex.length} chars`);
  }
  return (
    hex.slice(0, 8) +
    '-' +
    hex.slice(8, 12) +
    '-' +
    hex.slice(12, 16) +
    '-' +
    hex.slice(16, 20) +
    '-' +
    hex.slice(20)
  );
}

/**
 * Qdrant vector store backed by the REST API. Configured via QDRANT_URL,
 * QDRANT_API_KEY and QDRANT_COLLECTION (default "chunks"). Throws a clear error
 * when unconfigured; ingestion converts that into a `failed` status. `search`
 * is deferred to Epic 4.
 */
export class QdrantAdapter implements VectorStore {
  private url: string;
  private apiKey: string;
  private collection: string;

  constructor() {
    this.url = process.env.QDRANT_URL ?? '';
    this.apiKey = process.env.QDRANT_API_KEY ?? '';
    this.collection = process.env.QDRANT_COLLECTION ?? 'chunks';
  }

  private async request(
    path: string,
    init: RequestInit,
  ): Promise<Response> {
    const res = await fetch(`${this.url.replace(/\/+$/, '')}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'api-key': this.apiKey } : {}),
        ...(init.headers ?? {}),
      },
    });
    return res;
  }

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

  async upsert(
    chunks: Chunk[],
    vectors?: number[][],
    _retried = false,
  ): Promise<void> {
    if (chunks.length === 0) return;
    if (!this.url) {
      throw new Error('Qdrant not configured: QDRANT_URL is not set');
    }
    if (!vectors || vectors.length !== chunks.length) {
      throw new Error('Qdrant upsert requires a vector for every chunk');
    }

    const points: QdrantPoint[] = chunks.map((chunk, i) => ({
      id: toUuid(chunk.chunkId),
      vector: vectors[i],
      payload: {
        sourceId: chunk.sourceId,
        notebookId: chunk.notebookId,
        position: chunk.position,
        span: chunk.span,
        text: chunk.text,
      },
    }));

    const res = await this.request(
      `/collections/${this.collection}/points?wait=true`,
      {
        method: 'PUT',
        body: JSON.stringify({ points }),
      },
    );
    if (res.status === 404 && !_retried) {
      await this.createCollection(vectors[0].length);
      await this.upsert(chunks, vectors, true);
      return;
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `Qdrant upsert failed (${res.status})${detail ? `: ${detail}` : ''}`,
      );
    }
  }

  private async createCollection(vectorSize: number): Promise<void> {
    const res = await this.request(`/collections/${this.collection}`, {
      method: 'PUT',
      body: JSON.stringify({
        vectors: { size: vectorSize, distance: 'Cosine' },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `Qdrant create collection failed (${res.status})${detail ? `: ${detail}` : ''}`,
      );
    }
  }

  async deleteBySourceId(sourceId: string): Promise<void> {
    if (!this.url) return;
    const res = await this.request(
      `/collections/${this.collection}/points/delete?wait=true`,
      {
        method: 'POST',
        body: JSON.stringify({
          filter: { must: [{ key: 'sourceId', match: { value: sourceId } }] },
        }),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `Qdrant delete failed (${res.status})${detail ? `: ${detail}` : ''}`,
      );
    }
  }
}
