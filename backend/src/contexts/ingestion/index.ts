import { NeonRepository } from '../../adapters/neon/index';
import { JinaAdapter, stripImages } from '../../adapters/jina/index';
import { EmbeddingService } from '../../templates/EmbeddingService';
import {
  splitPlainText,
  splitMarkdown,
  chunkId,
} from '../../chunking/splitter';
import type { StorageService } from '../../ports/StorageService';
import type { Chunk } from '../../shared-kernel/types';

const RAW_KEY = (sourceId: string) => `sources/${sourceId}`;

/**
 * Single-writer ingestion pipeline. Drives a source through
 * `queued → processing → ready/failed` by loading its raw content, splitting it
 * into deterministic span-preserving chunks, embedding, and upserting to the
 * vector store. A tombstone check immediately before the chunk write prevents a
 * deleted source's chunks from ever resurrecting.
 */
export class IngestionService {
  private repo: NeonRepository;
  private storage: StorageService;
  private reader: JinaAdapter;
  private embeddingService: EmbeddingService;

  constructor(
    repo: NeonRepository,
    storage: StorageService,
    reader: JinaAdapter,
    embeddingService: EmbeddingService,
  ) {
    this.repo = repo;
    this.storage = storage;
    this.reader = reader;
    this.embeddingService = embeddingService;
  }

  async ingest(sourceId: string): Promise<void> {
    const source = await this.repo.findSourceById(sourceId);
    if (!source || source.status !== 'queued') return;

    await this.repo.setSourceStatus(sourceId, 'processing');

    try {
      const content = await this.loadContent(source.type, sourceId);
      const chunks = this.buildChunks(
        sourceId,
        source.notebookId,
        source.type,
        content,
      );

      // Tombstone check: abort if the source was removed while ingesting.
      const current = await this.repo.findSourceById(sourceId);
      if (!current || current.status === 'failed') return;

      await this.embeddingService.embedAndStore(chunks);
      await this.repo.setSourceStatus(sourceId, 'ready');
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Ingestion failed';
      await this.repo.setSourceStatus(sourceId, 'failed', reason).catch(() => {});
    }
  }

  private async loadContent(
    type: 'text' | 'web',
    sourceId: string,
  ): Promise<string> {
    const raw = await this.storage.get(RAW_KEY(sourceId));
    if (!raw) {
      throw new Error('Source content could not be loaded from storage.');
    }
    if (type === 'web') {
      const url = raw.toString('utf8');
      const markdown = await this.reader.fetchReader(url);
      return stripImages(markdown);
    }
    return raw.toString('utf8');
  }

  private buildChunks(
    sourceId: string,
    notebookId: string,
    type: 'text' | 'web',
    content: string,
  ): Chunk[] {
    const split =
      type === 'web' ? splitMarkdown(content) : splitPlainText(content);
    return split.map((c) => ({
      chunkId: chunkId(sourceId, c.position),
      sourceId,
      notebookId,
      span: c.span,
      position: c.position,
      text: c.text,
    }));
  }
}
