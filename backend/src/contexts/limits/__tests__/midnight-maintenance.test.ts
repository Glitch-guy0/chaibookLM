import { describe, expect, it, vi, beforeEach } from 'vitest';
import { executeMidnightMaintenanceCascade } from '../midnight-maintenance';

describe('Midnight Maintenance Cascade (AC-1.5.2)', () => {
  let mockNeonRepo: any;
  let mockVectorStore: any;
  let mockStorageService: any;

  beforeEach(() => {
    mockNeonRepo = {
      deleteNotebook: vi.fn().mockResolvedValue(true),
      reconcileCounter: vi.fn().mockResolvedValue(null),
    };
    mockVectorStore = {
      deleteByNotebookId: vi.fn().mockResolvedValue(undefined),
    };
    mockStorageService = {
      delete: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('executes atomic 4-step purge cascade across Qdrant, Cloudinary, Neon, and credit reset', async () => {
    const activeNotebookIds = ['nb_1', 'nb_2'];
    const userIds = ['user_1'];

    const result = await executeMidnightMaintenanceCascade(
      activeNotebookIds,
      userIds,
      {
        neonRepo: mockNeonRepo,
        vectorStore: mockVectorStore,
        storageService: mockStorageService,
      },
    );

    // 1. Purges vector points in Qdrant
    expect(mockVectorStore.deleteByNotebookId).toHaveBeenCalledWith('nb_1');
    expect(mockVectorStore.deleteByNotebookId).toHaveBeenCalledWith('nb_2');

    // 2. Purges temporary files in Cloudinary
    expect(mockStorageService.delete).toHaveBeenCalledWith('temp_nb_1');
    expect(mockStorageService.delete).toHaveBeenCalledWith('temp_nb_2');

    // 3. Deletes records from Neon (cascades to sources and chat_messages)
    expect(mockNeonRepo.deleteNotebook).toHaveBeenCalledWith('nb_1');
    expect(mockNeonRepo.deleteNotebook).toHaveBeenCalledWith('nb_2');

    // 4. Resets limit_counters back to 10 credits
    expect(mockNeonRepo.reconcileCounter).toHaveBeenCalledWith('user_1', 'credits', 0);

    expect(result.purgedNotebooks).toBe(2);
    expect(result.resetCredits).toBe(true);
  });
});
