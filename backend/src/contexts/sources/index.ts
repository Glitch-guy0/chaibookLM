import { NeonRepository } from '../../adapters/neon/index';
import { LimitsService } from '../limits/index';
import { SourceIndexer } from '../../templates/SourceIndexer';
import type { VectorStore } from '../../ports/VectorStore';
import type { StorageService } from '../../ports/StorageService';
import type { Source } from '../../shared-kernel/types';

const RAW_KEY = (sourceId: string) => `sources/${sourceId}`;
const SNAPSHOT_KEY = (sourceId: string) => `sources/${sourceId}/snapshot.html`;

export type GetContentResult =
  | { ok: true; content: { type: 'text'; text: string } }
  | { ok: true; content: { type: 'web'; url: string; snapshotHtml: string | null } }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'content_unavailable' };

export interface CreateSourceParams {
  notebookId: string;
  userId: string;
  type: 'text' | 'web' | 'pdf' | 'transcript' | 'youtube';
  title: string;
  content: string;
}

export type CreateSourceResult =
  | { ok: true; source: Source }
  | { ok: false; reason: string; count: number; cap: number };

/**
 * Source lifecycle: create (with limits + enqueue), scoped list/find, and the
 * delete cascade (Qdrant → Filebase → Neon) for single/bulk/clear-failed with a
 * single counter reconcile. Counters are owned by the LimitsService; the
 * per-user source counter is bumped atomically inside checkSourceCap.
 */
export class SourceService {
  private repo: NeonRepository;
  private storage: StorageService;
  private limits: LimitsService;
  private indexer: SourceIndexer;
  private qdrant: VectorStore;

  constructor(
    repo: NeonRepository,
    storage: StorageService,
    limits: LimitsService,
    indexer: SourceIndexer,
    qdrant: VectorStore,
  ) {
    this.repo = repo;
    this.storage = storage;
    this.limits = limits;
    this.indexer = indexer;
    this.qdrant = qdrant;
  }

  async create(params: CreateSourceParams): Promise<CreateSourceResult> {
    const config = this.limits.getConfig();
    const size = Buffer.byteLength(params.content, 'utf8');
    if (size > config.maxSourceSizeBytes) {
      const notebookCount = await this.repo.countSourcesByNotebook(
        params.notebookId,
      );
      return {
        ok: false,
        reason: `This source exceeds the ${this.formatBytes(config.maxSourceSizeBytes)} limit.`,
        count: notebookCount,
        cap: config.maxSourcesPerNotebook,
      };
    }

    const cap = await this.limits.checkSourceCap(
      params.notebookId,
      params.userId,
    );
    if (!cap.allowed) {
      const userCounter = await this.limits.getSourcesPerUserCounter(
        params.userId,
      );
      const notebookCount = await this.repo.countSourcesByNotebook(
        params.notebookId,
      );
      const userOver = userCounter.count >= userCounter.cap;
      return {
        ok: false,
        reason: cap.reason ?? 'Source limit reached',
        count: userOver ? userCounter.count : notebookCount,
        cap: userOver
          ? userCounter.cap
          : config.maxSourcesPerNotebook,
      };
    }

    await this.repo.createUser(params.userId, '').catch(() => {});

    try {
      const source = await this.repo.createSource(
        params.notebookId,
        params.userId,
        params.type,
        params.title,
      );

      try {
        await this.storage.put(
          RAW_KEY(source.id),
          Buffer.from(params.content, 'utf8'),
          'text/plain',
        );
      } catch {
        // Storage unconfigured/transient: leave queued; ingestion reports it.
      }

      void this.indexer.index(source.id).catch(() => {});

      return { ok: true, source };
    } catch (err) {
      await this.limits
        .decrementCounter(params.userId, 'sources_per_user')
        .catch(() => {});
      throw err;
    }
  }

  async listByNotebook(notebookId: string): Promise<Source[]> {
    return this.repo.findSourcesByNotebookId(notebookId);
  }

  async findById(id: string): Promise<Source | null> {
    return this.repo.findSourceById(id);
  }

  /**
   * Loads a source's full content for the Showcase panel: raw text for a
   * Text Source, or the stored URL + optional HTML snapshot for a Web
   * Source. Storage-read failures are handled identically across both
   * branches (`.catch(() => null)`) and surfaced as `content_unavailable`
   * rather than masked as an empty-string success -- distinct from
   * `not_found`, which covers a missing/not-owned `Source` row.
   */
  async getContent(id: string, userId: string): Promise<GetContentResult> {
    const source = await this.repo.findSourceById(id);
    if (!source || source.userId !== userId) {
      return { ok: false, reason: 'not_found' };
    }

    if (source.type === 'text') {
      const raw = await this.storage.get(RAW_KEY(id)).catch(() => null);
      if (raw === null) {
        return { ok: false, reason: 'content_unavailable' };
      }
      return { ok: true, content: { type: 'text', text: raw.toString('utf8') } };
    }

    const raw = await this.storage.get(RAW_KEY(id)).catch(() => null);
    if (raw === null) {
      return { ok: false, reason: 'content_unavailable' };
    }
    const snapshot = await this.storage.get(SNAPSHOT_KEY(id)).catch(() => null);
    return {
      ok: true,
      content: {
        type: 'web',
        url: raw.toString('utf8'),
        snapshotHtml: snapshot ? snapshot.toString('utf8') : null,
      },
    };
  }

  async remove(ids: string[], userId: string): Promise<number> {
    const results = await Promise.all(
      ids.map(async (id) => {
        const source = await this.repo.findSourceById(id);
        if (!source || source.userId !== userId) return false;
        await this.cascadeDelete(id);
        return this.repo.deleteSource(id);
      }),
    );
    const deleted = results.filter(Boolean).length;
    if (deleted > 0) {
      const actualCount = await this.repo.countSourcesByUser(userId);
      await this.limits.reconcileCounter(
        userId,
        'sources_per_user',
        actualCount,
      );
    }
    return deleted;
  }

  async clearFailed(notebookId: string, userId: string): Promise<number> {
    const sources = await this.repo.findSourcesByNotebookId(notebookId);
    const failed = sources
      .filter((s) => s.userId === userId && s.status === 'failed')
      .map((s) => s.id);
    return this.remove(failed, userId);
  }

  private async cascadeDelete(sourceId: string): Promise<void> {
    await this.qdrant.deleteBySourceId(sourceId).catch(() => {});
    await this.storage.delete(RAW_KEY(sourceId)).catch(() => {});
  }

  private formatBytes(bytes: number): string {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
}
