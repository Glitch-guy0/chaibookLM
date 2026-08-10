import type { Embeddings } from '../../ports/Embeddings';

interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

/**
 * OpenAI-compatible embeddings adapter (text-embedding-*). Configured via
 * EMBEDDING_BASE_URL / EMBEDDING_API_KEY / EMBEDDING_MODEL. Throws a clear
 * error when unconfigured; ingestion converts that into a `failed` status.
 */
export class EmbeddingsAdapter implements Embeddings {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.EMBEDDING_BASE_URL ?? '';
    this.apiKey = process.env.EMBEDDING_API_KEY ?? '';
    this.model = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small';
  }

  async embed(text: string): Promise<number[]> {
    const [vector] = await this.embedBatch([text]);
    if (!vector) {
      throw new Error('Embeddings API returned no vector');
    }
    return vector;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    if (!this.baseUrl) {
      throw new Error(
        'Embeddings not configured: EMBEDDING_BASE_URL is not set',
      );
    }
    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/embeddings`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `Embeddings request failed (${res.status})${detail ? `: ${detail}` : ''}`,
      );
    }
    const data = (await res.json()) as EmbeddingResponse;
    return data.data.map((d) => d.embedding);
  }
}
