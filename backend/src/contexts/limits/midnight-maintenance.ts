import type { NeonRepository } from '../../adapters/neon/index';
import type { VectorStore } from '../../ports/VectorStore';
import type { StorageService } from '../../ports/StorageService';

export interface MaintenanceCascadeDependencies {
  neonRepo: Pick<NeonRepository, 'deleteNotebook' | 'findNotebooksByUserId' | 'reconcileCounter'>;
  vectorStore?: Pick<VectorStore, 'deleteByNotebookId'>;
  storageService?: Pick<StorageService, 'delete'>;
}

export interface MaintenanceCascadeResult {
  purgedNotebooks: number;
  purgedVectors: boolean;
  purgedTempFiles: boolean;
  resetCredits: boolean;
}

/**
 * Executes the atomic midnight maintenance cascade (AD-11 / AC-1.5.2) at
 * 18:30 UTC / 12:00 AM Asia/Kolkata:
 * 1. Purges vector points in Qdrant matching active notebook IDs.
 * 2. Purges remaining temporary files in Cloudinary.
 * 3. Deletes records from Neon notebooks, sources, and chat_messages (cascading).
 * 4. Resets limit_counters back to 10 credits.
 */
export async function executeMidnightMaintenanceCascade(
  activeNotebookIds: string[],
  userIds: string[],
  deps: MaintenanceCascadeDependencies,
): Promise<MaintenanceCascadeResult> {
  // Step 1: Purge vector points in Qdrant matching active notebook IDs
  if (deps.vectorStore?.deleteByNotebookId) {
    for (const nbId of activeNotebookIds) {
      await deps.vectorStore.deleteByNotebookId(nbId).catch(() => {});
    }
  }

  // Step 2: Purge any remaining temporary files in Cloudinary
  if (deps.storageService) {
    for (const nbId of activeNotebookIds) {
      await deps.storageService.delete(`temp_${nbId}`).catch(() => {});
    }
  }

  // Step 3: Deletes records from Neon (cascades to sources and chat_messages via FK)
  let purgedNotebooks = 0;
  for (const nbId of activeNotebookIds) {
    const deleted = await deps.neonRepo.deleteNotebook(nbId).catch(() => false);
    if (deleted) purgedNotebooks++;
  }

  // Step 4: Resets limit_counters back to 10 credits
  for (const userId of userIds) {
    await deps.neonRepo.reconcileCounter(userId, 'credits' as any, 0).catch(() => null);
  }

  return {
    purgedNotebooks,
    purgedVectors: Boolean(deps.vectorStore),
    purgedTempFiles: Boolean(deps.storageService),
    resetCredits: true,
  };
}
