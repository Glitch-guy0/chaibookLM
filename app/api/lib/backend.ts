import { NeonRepository } from '@backend/adapters/neon/index';
import { LimitsService } from '@backend/contexts/limits/index';
import { NotebookService } from '@backend/contexts/notebooks/index';

interface BackendServices {
  repo: NeonRepository;
  limits: LimitsService;
  notebooks: NotebookService;
}

let backendPromise: Promise<BackendServices> | null = null;

/**
 * Composition root singleton.
 *
 * Lazily constructs the NeonRepository, LimitsService and NotebookService once
 * and reuses them across route invocations (Vercel serverless module cache).
 * Runs the idempotent schema migration before any service is used. Routes never
 * construct adapters directly — they only call getBackend().
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
      const limits = new LimitsService(repo);
      const notebooks = new NotebookService(repo, limits);
      return { repo, limits, notebooks };
    })();
  }
  return backendPromise;
}
