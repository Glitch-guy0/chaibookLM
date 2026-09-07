import { describe, expect, it, vi } from 'vitest';
import { NeonRepository } from '../index';

describe('Story 3.5: Chat Prompt Usage Operational Telemetry', () => {
  it('records chat telemetry into telemetry_chat_prompts with < 15ms overhead (AC-3.5.1)', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
    const repo = new NeonRepository();
    (repo as any).pool = { query: mockQuery };

    const start = performance.now();
    await repo.recordChatTelemetry({
      userId: 'user-789',
      notebookId: 'nb-456',
      promptLength: 142,
      completionTokens: 85,
      latencyMs: 320,
      creditCost: 1,
    });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(15);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO telemetry_chat_prompts'),
      ['user-789', 'nb-456', 142, 85, 320, 1],
    );
  });

  it('ensures no raw prompt or response text is recorded in telemetry tables (AC-3.5.2)', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
    const repo = new NeonRepository();
    (repo as any).pool = { query: mockQuery };

    await repo.recordChatTelemetry({
      userId: 'user-789',
      notebookId: 'nb-456',
      promptLength: 120,
      completionTokens: 60,
      latencyMs: 250,
    });

    const callArgs = mockQuery.mock.calls[0];
    const sql = callArgs[0] as string;
    const params = callArgs[1] as any[];

    // Ensure parameters strictly contain metrics and IDs, never user prompt/response strings
    expect(sql).not.toContain('prompt_text');
    expect(sql).not.toContain('response_text');
    expect(sql).toContain('prompt_length');
    expect(sql).toContain('completion_tokens');
    expect(sql).toContain('latency_ms');
    expect(sql).toContain('credit_cost');

    // Parameters must not contain text longer than an ID
    for (const p of params) {
      if (typeof p === 'string') {
        expect(p.length).toBeLessThan(100);
      }
    }
  });

  it('rolls up chat telemetry into telemetry_daily_aggregates during daily aggregation (AC-3.5.3)', async () => {
    const mockRowsUploads = [
      {
        total_uploads: 10,
        total_bytes: '1024',
        avg_duration_ms: 100,
        failed_uploads: 0,
      },
    ];
    const mockRowsPrompts = [
      {
        total_queries: 25,
        total_prompt_chars: '5000',
        total_completion_tokens: '3500',
        total_credits_spent: 25,
      },
    ];

    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes('telemetry_file_uploads')) {
        return Promise.resolve({ rows: mockRowsUploads });
      }
      if (sql.includes('telemetry_chat_prompts')) {
        return Promise.resolve({ rows: mockRowsPrompts });
      }
      return Promise.resolve({ rows: [] });
    });

    const repo = new NeonRepository();
    (repo as any).pool = { query: mockQuery };

    const result = await repo.aggregateDailyTelemetry('2026-09-07');
    expect(result.dateIst).toBe('2026-09-07');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('FROM telemetry_chat_prompts'),
      ['2026-09-07'],
    );
  });
});
