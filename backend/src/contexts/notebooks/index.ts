import { NeonRepository } from '../../adapters/neon/index';
import { LimitsService, DEFAULT_LIMITS } from '../limits/index';
import type { Notebook } from '../../shared-kernel/types';

export class NotebookService {
  private repo: NeonRepository;
  private limits: LimitsService;

  constructor(repo: NeonRepository, limits: LimitsService) {
    this.repo = repo;
    this.limits = limits;
  }

  /**
   * Create a new notebook for the user. Checks the notebook cap first.
   * @returns the created Notebook, or null if the user is at their cap.
   */
  async create(userId: string, title: string): Promise<Notebook | null> {
    const counter = await this.limits.getNotebookCounter(userId);
    if (counter.count >= counter.cap) return null;

    // Ensure user row exists for FK constraint
    await this.repo.createUser(userId, '').catch(() => {});

    const result = await this.limits.checkNotebookCap(userId);
    if (!result) return null;

    try {
      return await this.repo.createNotebook(userId, title, DEFAULT_LIMITS.notebookTtlDays);
    } catch (err) {
      // Roll back the counter increment if notebook creation fails
      await this.limits.decrementCounter(userId, 'notebooks').catch(() => {});
      throw err;
    }
  }

  /**
   * Return all notebooks belonging to a user, newest first.
   */
  async findByUserId(userId: string): Promise<Notebook[]> {
    return this.repo.findNotebooksByUserId(userId);
  }

  /**
   * Find a single notebook by id. Returns null if not found.
   */
  async findById(id: string): Promise<Notebook | null> {
    return this.repo.findNotebookById(id);
  }

  /**
   * Rename a notebook. Returns the updated Notebook, or null if not found.
   */
  async rename(id: string, title: string): Promise<Notebook | null> {
    return this.repo.renameNotebook(id, title);
  }

  /**
   * Delete a notebook and reconcile its counter.
   * Verifies the notebook belongs to the requesting user.
   * @returns true if the notebook was deleted, false if not found or unauthorized.
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const notebook = await this.repo.findNotebookById(id);
    if (!notebook) return false;
    if (notebook.userId !== userId) return false;

    await this.repo.deleteNotebook(id);
    await this.limits.decrementCounter(userId, 'notebooks');
    return true;
  }

  /**
   * Find all TTL-expired notebooks. Useful for a cleanup cron job.
   */
  async findExpired(): Promise<Notebook[]> {
    return this.repo.findExpiredNotebooks();
  }

  /**
   * Count notebooks owned by a user.
   */
  async countByUser(userId: string): Promise<number> {
    const notebooks = await this.repo.findNotebooksByUserId(userId);
    return notebooks.length;
  }
}