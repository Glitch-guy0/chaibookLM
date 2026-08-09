import type { Embeddings } from '../../ports/Embeddings';

export class EmbeddingsAdapter implements Embeddings {
  async embed(_text: string): Promise<number[]> {
    throw new Error('Not implemented');
  }

  async embedBatch(_texts: string[]): Promise<number[][]> {
    throw new Error('Not implemented');
  }
}