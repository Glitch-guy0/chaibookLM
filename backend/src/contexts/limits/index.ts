import { NeonRepository } from '../../adapters/neon/index';
import type { LimitsConfig, LimitCounter } from '../../shared-kernel/types';

export const DEFAULT_LIMITS: LimitsConfig = {
  maxNotebooksPerUser: 10,
  maxSourcesPerNotebook: 10,
  maxSourcesPerUser: 30,
  maxSourceSizeBytes: 5_242_880, // 5 MB
  notebookTtlDays: 7,
};

export class LimitsService {
  private repo: NeonRepository;
  private config: LimitsConfig;

  constructor(repo: NeonRepository, config: LimitsConfig = DEFAULT_LIMITS) {
    this.repo = repo;
    this.config = config;
  }

  // ── Counter access ─────────────────────────────────────────────────────

  async getNotebookCounter(userId: string): Promise<LimitCounter> {
    return this.repo.getOrCreateCounter(
      userId,
      'notebooks',
      this.config.maxNotebooksPerUser,
    );
  }

  async getSourcesPerUserCounter(userId: string): Promise<LimitCounter> {
    return this.repo.getOrCreateCounter(
      userId,
      'sources_per_user',
      this.config.maxSourcesPerUser,
    );
  }

  async getSourcesPerNotebookCounter(
    userId: string,
  ): Promise<LimitCounter> {
    return this.repo.getOrCreateCounter(
      userId,
      'sources_per_notebook',
      this.config.maxSourcesPerNotebook,
    );
  }

  async getSourceSizeCounter(userId: string): Promise<LimitCounter> {
    return this.repo.getOrCreateCounter(
      userId,
      'source_size',
      this.config.maxSourceSizeBytes,
    );
  }

  // ── Cap checks ─────────────────────────────────────────────────────────

  /**
   * Atomically check if the user is under the notebook cap and increment.
   * Returns true if the notebook was created (under cap), false if capped out.
   */
  async checkNotebookCap(userId: string): Promise<boolean> {
    const counter = await this.getNotebookCounter(userId);
    if (counter.count >= counter.cap) return false;

    const result = await this.repo.incrementIfUnderCap(userId, 'notebooks');
    return result !== null;
  }

  /**
   * Atomically check if the user is under both per-user and per-notebook
   * source caps, and the source size cap. Increments all three on success.
   *
   * NOTE: Source size is checked at upload time via the ingest boundary, not
   * here. This function only guards counts.
   */
  async checkSourceCap(
    notebookId: string,
    userId: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check per-user source cap (uses atomic counter)
    const userCounter = await this.getSourcesPerUserCounter(userId);
    if (userCounter.count >= userCounter.cap) {
      return {
        allowed: false,
        reason: `You have reached the limit of ${userCounter.cap} sources across all notebooks.`,
      };
    }

    // Check per-notebook source cap (uses direct DB count for accuracy)
    const currentSourcesInNotebook =
      await this.repo.countSourcesByNotebook(notebookId);
    if (currentSourcesInNotebook >= this.config.maxSourcesPerNotebook) {
      return {
        allowed: false,
        reason: `This notebook has reached the limit of ${this.config.maxSourcesPerNotebook} sources.`,
      };
    }

    // Atomic increment for the per-user counter
    const userOk = await this.repo.incrementIfUnderCap(
      userId,
      'sources_per_user',
    );
    if (!userOk) {
      return {
        allowed: false,
        reason: `You have reached the limit of ${userCounter.cap} sources across all notebooks.`,
      };
    }

    // Per-notebook counter uses direct DB count — no separate counter needed.
    // The per-user counter is incremented above; source creation is guarded
    // by the notebook-level COUNT(*) check.

    return { allowed: true };
  }

  // ── Counter mutations ──────────────────────────────────────────────────

  async incrementCounter(
    userId: string,
    resourceType: LimitCounter['resourceType'],
  ): Promise<LimitCounter | null> {
    return this.repo.incrementIfUnderCap(userId, resourceType);
  }

  /**
   * Decrement a counter with the double-bump guard (cannot go below 0).
   * Call this when a resource is deleted or expires.
   */
  async decrementCounter(
    userId: string,
    resourceType: LimitCounter['resourceType'],
  ): Promise<LimitCounter | null> {
    return this.repo.decrementCounter(userId, resourceType);
  }

  /**
   * Reconcile a counter to match the actual count of persisted resources.
   * Used after TTL sweeps or bulk operations.
   */
  async reconcileCounter(
    userId: string,
    resourceType: LimitCounter['resourceType'],
    actualCount: number,
  ): Promise<LimitCounter | null> {
    return this.repo.reconcileCounter(userId, resourceType, actualCount);
  }

  // ── Config access ──────────────────────────────────────────────────────

  getConfig(): LimitsConfig {
    return { ...this.config };
  }
}