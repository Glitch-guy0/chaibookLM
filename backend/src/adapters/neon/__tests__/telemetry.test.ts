import { describe, expect, it, vi } from 'vitest';
import { NeonRepository } from '../index';
import { executeMidnightMaintenanceCascade } from '../../../contexts/limits/midnight-maintenance';

describe('Story 2.6: File Upload Ingestion Operational Telemetry', () => {
  it('records upload telemetry into telemetry_file_uploads with < 15ms overhead (AC-2.6.1 & AC-2.6.2)', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
    const repo = new NeonRepository();
    (repo as any).pool = { query: mockQuery };

    const start = performance.now();
    await repo.recordUploadTelemetry({
      sourceId: 'src-123',
      userId: 'user-456',
      byteSize: 1048576,
      mimeType: 'application/pdf',
      durationMs: 340,
      errorCategory: null,
    });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(15);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO telemetry_file_uploads'),
      ['src-123', 'user-456', 1048576, 'application/pdf', 340, null],
    );
  });

  it('aggregates daily uploads into telemetry_daily_aggregates (AC-2.6.3)', async () => {
    const mockRows = [
      {
        total_uploads: 15,
        total_bytes: '52428800',
        avg_duration_ms: 420,
        failed_uploads: 2,
      },
    ];
    const mockQuery = vi.fn().mockResolvedValue({ rows: mockRows });
    const repo = new NeonRepository();
    (repo as any).pool = { query: mockQuery };

    const result = await repo.aggregateDailyTelemetry('2026-09-07');

    expect(result.dateIst).toBe('2026-09-07');
    expect(result.totalUploads).toBe(15);
    expect(result.totalBytes).toBe(52428800);
    expect(result.avgDurationMs).toBe(420);
    expect(result.failedUploads).toBe(2);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      ['2026-09-07'],
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO telemetry_daily_aggregates'),
      ['2026-09-07', 15, '52428800', 420, 2],
    );
  });

  it('invokes daily telemetry aggregation during midnight maintenance cascade (AC-2.6.3)', async () => {
    const mockAggregate = vi.fn().mockResolvedValue({
      dateIst: '2026-09-07',
      totalUploads: 5,
      totalBytes: 1000,
      avgDurationMs: 200,
      failedUploads: 0,
    });

    const result = await executeMidnightMaintenanceCascade(
      ['nb-1'],
      ['user-1'],
      {
        neonRepo: {
          deleteNotebook: vi.fn().mockResolvedValue(true),
          findNotebooksByUserId: vi.fn().mockResolvedValue([]),
          reconcileCounter: vi.fn().mockResolvedValue(null),
          aggregateDailyTelemetry: mockAggregate as any,
        } as any,
      },
      '2026-09-07',
    );

    expect(result.aggregatedTelemetry).toBe(true);
    expect(mockAggregate).toHaveBeenCalledWith('2026-09-07');
  });
});
