import { describe, expect, it, vi } from 'vitest';

// `NeonRepository` constructs a real `Pool` in its constructor, so the
// adapter module is mocked here rather than hitting a live database --
// `query` is the only method `findChatMessagesBefore` calls.
const queryMock = vi.fn();
vi.mock('@neondatabase/serverless', () => ({
  // `Pool` is invoked with `new` by `NeonRepository`'s constructor -- the
  // mock implementation must be a regular function (arrow functions cannot
  // be used as constructors and throw "is not a constructor").
  Pool: vi.fn().mockImplementation(function PoolMock() {
    return { query: queryMock };
  }),
}));

// Imported after the mock so `NeonRepository` picks up the mocked `Pool`.
const { NeonRepository } = await import('../index');

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'row-id',
    notebook_id: 'notebook-1',
    user_id: 'user-1',
    role: 'user',
    content: 'hello',
    citations: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('NeonRepository.findChatMessagesBefore', () => {
  it('INITIAL_LOAD: with no cursor, limits to `limit` (7) rows and reverses to oldest-first', async () => {
    queryMock.mockReset();
    // DESC order as the DB would return it: newest first.
    const rows = Array.from({ length: 7 }, (_, i) =>
      makeRow({ id: `m${7 - i}`, created_at: new Date(2026, 0, 7 - i) }),
    );
    queryMock.mockResolvedValueOnce({ rows });

    const repo = new NeonRepository('postgres://fake');
    const result = await repo.findChatMessagesBefore('notebook-1', 7);

    expect(queryMock).toHaveBeenCalledTimes(1);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).not.toMatch(/beforeMessageId/);
    expect(params).toEqual(['notebook-1', 7]);
    // Reversed to oldest-first.
    expect(result.messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7']);
    expect(result.hasMore).toBe(true);
  });

  it('SCROLL_UP_MORE: cursor pagination returns strictly older rows only', async () => {
    queryMock.mockReset();
    const olderRows = Array.from({ length: 7 }, (_, i) =>
      makeRow({ id: `old${7 - i}`, created_at: new Date(2025, 11, 24 - i) }),
    );
    queryMock.mockResolvedValueOnce({ rows: olderRows });

    const repo = new NeonRepository('postgres://fake');
    const result = await repo.findChatMessagesBefore('notebook-1', 7, 'cursor-msg-id');

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/< \(/); // cursor comparison against (created_at, id)
    expect(params).toEqual(['notebook-1', 'cursor-msg-id', 7]);
    expect(result.messages.map((m) => m.id)).toEqual([
      'old1',
      'old2',
      'old3',
      'old4',
      'old5',
      'old6',
      'old7',
    ]);
    expect(result.hasMore).toBe(true);
  });

  it('scopes the cursor subquery to the requested notebook, not just the outer query, so a cursor id from a different notebook cannot leak rows across notebooks', async () => {
    queryMock.mockReset();
    queryMock.mockResolvedValueOnce({ rows: [] });

    const repo = new NeonRepository('postgres://fake');
    await repo.findChatMessagesBefore('notebook-1', 7, 'cursor-from-other-notebook');

    const [sql, params] = queryMock.mock.calls[0];
    // The cursor subquery must itself be scoped by notebook_id (not just the
    // outer WHERE), so a cursor id belonging to a different notebook resolves
    // to no rows rather than silently leaking that notebook's ordering.
    expect(sql).toMatch(/SELECT created_at, id FROM chat_messages WHERE id = \$2 AND notebook_id = \$1/);
    expect(params).toEqual(['notebook-1', 'cursor-from-other-notebook', 7]);
  });

  it('SCROLL_UP_EXHAUSTED: hasMore is false when fewer than `limit` rows remain', async () => {
    queryMock.mockReset();
    const rows = [makeRow({ id: 'only-one' })];
    queryMock.mockResolvedValueOnce({ rows });

    const repo = new NeonRepository('postgres://fake');
    const result = await repo.findChatMessagesBefore('notebook-1', 7, 'cursor-msg-id');

    expect(result.messages).toHaveLength(1);
    expect(result.hasMore).toBe(false);
  });

  it('INITIAL_LOAD_EMPTY: zero persisted messages returns an empty page with hasMore false', async () => {
    queryMock.mockReset();
    queryMock.mockResolvedValueOnce({ rows: [] });

    const repo = new NeonRepository('postgres://fake');
    const result = await repo.findChatMessagesBefore('notebook-1', 7);

    expect(result.messages).toEqual([]);
    expect(result.hasMore).toBe(false);
  });
});
