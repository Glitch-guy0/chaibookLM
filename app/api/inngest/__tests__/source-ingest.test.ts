import { describe, expect, it, vi } from 'vitest';
import { SOURCE_INGEST_FUNCTION_CONFIG, fnSourceIngest } from '../functions/source-ingest';
import { handleIngestionFailure } from '../../../../backend/src/contexts/ingestion/failure-handler';

describe('Story 2.2: Inngest Durable Orchestration, Concurrency & Failure Isolation', () => {
  it('enforces per-user concurrency limit of 2 concurrent pipelines (AC-2.2.1)', () => {
    expect(SOURCE_INGEST_FUNCTION_CONFIG.concurrency.key).toBe('event.data.userId');
    expect(SOURCE_INGEST_FUNCTION_CONFIG.concurrency.limit).toBe(2);
  });

  it('configures 3 retries for transient error recovery (AC-2.2.2)', () => {
    expect(SOURCE_INGEST_FUNCTION_CONFIG.retries).toBe(3);
    expect(fnSourceIngest.id()).toBe('source-ingest');
  });

  it('updates Neon status to failed with descriptive errorReason and purges temp storage on failure (AC-2.2.3)', async () => {
    const mockSetSourceStatus = vi.fn().mockResolvedValue(undefined);
    const mockStorageDelete = vi.fn().mockResolvedValue(undefined);

    const result = await handleIngestionFailure('src-failed-123', 'Socket timeout after 3 retries', {
      repo: { setSourceStatus: mockSetSourceStatus as any },
      storage: { delete: mockStorageDelete } as any,
    });

    expect(result.status).toBe('failed');
    expect(result.sourceId).toBe('src-failed-123');
    expect(result.errorReason).toBe('Socket timeout after 3 retries');
    expect(result.tempCleaned).toBe(true);

    expect(mockSetSourceStatus).toHaveBeenCalledWith(
      'src-failed-123',
      'failed',
      'Socket timeout after 3 retries',
    );
    expect(mockStorageDelete).toHaveBeenCalledWith('temp_src-failed-123');
  });

  it('isolates failure to failed source without impacting sibling ready sources (AC-2.2.4)', async () => {
    const mockSetSourceStatus = vi.fn().mockResolvedValue(undefined);

    // Call failure on source-A
    await handleIngestionFailure('source-A', 'Extraction error', {
      repo: { setSourceStatus: mockSetSourceStatus as any },
    });

    // Verify source-B was never targeted
    expect(mockSetSourceStatus).toHaveBeenCalledWith('source-A', 'failed', 'Extraction error');
    expect(mockSetSourceStatus).not.toHaveBeenCalledWith('source-B', expect.anything(), expect.anything());
  });
});
