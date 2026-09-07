import type { NeonRepository } from '../../adapters/neon/index';
import type { StorageService } from '../../ports/StorageService';

export interface IngestionFailureDependencies {
  repo: Pick<NeonRepository, 'setSourceStatus'>;
  storage?: Pick<StorageService, 'delete'>;
}

export interface IngestionFailureResult {
  sourceId: string;
  status: 'failed';
  errorReason: string;
  tempCleaned: boolean;
}

/**
 * Handles background ingestion failure isolation (AC-2.2.3):
 * 1. Sets Neon source status to 'failed' with descriptive errorReason.
 * 2. Cleans up ephemeral temporary storage files without touching sibling sources.
 */
export async function handleIngestionFailure(
  sourceId: string,
  errorReason: string,
  deps: IngestionFailureDependencies,
): Promise<IngestionFailureResult> {
  await deps.repo.setSourceStatus(sourceId, 'failed', errorReason).catch(() => {});

  let tempCleaned = false;
  if (deps.storage) {
    try {
      await deps.storage.delete(`temp_${sourceId}`);
      tempCleaned = true;
    } catch {
      tempCleaned = false;
    }
  }

  return {
    sourceId,
    status: 'failed',
    errorReason,
    tempCleaned,
  };
}
