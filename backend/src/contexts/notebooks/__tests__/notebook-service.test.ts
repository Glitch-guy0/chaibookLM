import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NotebookService } from '../index';
import type { NeonRepository } from '../../../adapters/neon/index';
import type { LimitsService } from '../../limits/index';
import type { Notebook } from '../../../shared-kernel/types';

describe('NotebookService (AC-1.3.1, AC-1.3.3, AC-1.3.4)', () => {
  let mockRepo: Partial<NeonRepository>;
  let mockLimits: Partial<LimitsService>;
  let service: NotebookService;

  beforeEach(() => {
    mockRepo = {
      createUser: vi.fn().mockResolvedValue(undefined),
      createNotebook: vi.fn().mockResolvedValue({
        id: 'nb_1',
        userId: 'user_1',
        name: 'Research 1',
        title: 'Research 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
        sourceCount: 0,
      } as unknown as Notebook),
      findNotebooksByUserId: vi.fn().mockResolvedValue([]),
      findNotebookById: vi.fn(),
      deleteNotebook: vi.fn().mockResolvedValue(true),
      renameNotebook: vi.fn(),
    };

    mockLimits = {
      getNotebookCounter: vi.fn().mockResolvedValue({ count: 0, cap: 10 }),
      checkNotebookCap: vi.fn().mockResolvedValue(true),
      decrementCounter: vi.fn().mockResolvedValue(undefined),
      reconcileCounter: vi.fn().mockResolvedValue(undefined),
    };

    service = new NotebookService(mockRepo as NeonRepository, mockLimits as LimitsService);
  });

  it('creates notebook when under quota limit (AC-1.3.1)', async () => {
    const created = await service.create('user_1', 'Research 1');
    expect(created).not.toBeNull();
    expect(created?.id).toBe('nb_1');
    expect(mockRepo.createNotebook).toHaveBeenCalledWith('user_1', 'Research 1', expect.any(Number));
  });

  it('rejects notebook creation when quota cap of 10 is reached (AC-1.3.3)', async () => {
    mockLimits.getNotebookCounter = vi.fn().mockResolvedValue({ count: 10, cap: 10 });
    const created = await service.create('user_1', 'Research 11');
    expect(created).toBeNull();
    expect(mockRepo.createNotebook).not.toHaveBeenCalled();
  });

  it('deletes notebook and decrements counter when owned by user (AC-1.3.4)', async () => {
    mockRepo.findNotebookById = vi.fn().mockResolvedValue({
      id: 'nb_1',
      userId: 'user_1',
      name: 'Research 1',
      createdAt: new Date(),
    } as unknown as Notebook);

    const deleted = await service.delete('nb_1', 'user_1');
    expect(deleted).toBe(true);
    expect(mockRepo.deleteNotebook).toHaveBeenCalledWith('nb_1');
    expect(mockLimits.decrementCounter).toHaveBeenCalledWith('user_1', 'notebooks');
  });

  it('refuses deletion if notebook is not owned by requesting user', async () => {
    mockRepo.findNotebookById = vi.fn().mockResolvedValue({
      id: 'nb_1',
      userId: 'other_user',
      name: 'Research 1',
    } as unknown as Notebook);

    const deleted = await service.delete('nb_1', 'user_1');
    expect(deleted).toBe(false);
    expect(mockRepo.deleteNotebook).not.toHaveBeenCalled();
  });
});
