import { describe, expect, it, vi } from 'vitest';
import { FetchOnRefusalService } from '../index';
import type { SourceService } from '../../sources/index';
import type { SourceIndexer } from '../../../templates/SourceIndexer';
import type { WebSearchTool } from '../../../templates/WebSearchTool';
import type { SearchResult } from '../../../ports/search';

function makeResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return { title: 'A Page', url: 'https://example.com/a', content: 'snippet', ...overrides };
}

function makeService(opts: {
  searchWeb: () => Promise<SearchResult[]>;
  create: (params: unknown) => Promise<{ ok: true; source: { id: string } } | { ok: false; reason: string }>;
  indexShouldFailFor?: Set<string>;
}) {
  const webSearchTool = { searchWeb: opts.searchWeb } as unknown as WebSearchTool;
  const sourceService = { create: vi.fn(opts.create) } as unknown as SourceService;
  const indexed: string[] = [];
  const indexer = {
    index: vi.fn(async (sourceId: string) => {
      indexed.push(sourceId);
      if (opts.indexShouldFailFor?.has(sourceId)) throw new Error('index failed');
    }),
  } as unknown as SourceIndexer;
  const service = new FetchOnRefusalService(webSearchTool, sourceService, indexer);
  return { service, sourceService, indexer, indexed };
}

describe('FetchOnRefusalService.approve', () => {
  it('APPROVE_SUCCESS: creates + indexes a Web Source per result via the existing SourceService.create, returning the settled count', async () => {
    let counter = 0;
    const { service, sourceService, indexer } = makeService({
      searchWeb: async () => [makeResult({ url: 'https://example.com/a' })],
      create: async () => {
        counter += 1;
        return { ok: true, source: { id: `source-${counter}` } };
      },
    });

    const result = await service.approve('notebook-1', 'user-1', 'my query');

    expect(result).toEqual({ ok: true, added: 1 });
    expect(sourceService.create).toHaveBeenCalledWith(
      expect.objectContaining({ notebookId: 'notebook-1', userId: 'user-1', type: 'web' }),
    );
    expect(indexer.index).toHaveBeenCalledWith('source-1');
  });

  it('APPROVE_ZERO_RESULTS: search succeeds but returns no results -- clean no-op, no sources created', async () => {
    const { service, sourceService } = makeService({
      searchWeb: async () => [],
      create: vi.fn() as unknown as (params: unknown) => Promise<{ ok: true; source: { id: string } }>,
    });

    const result = await service.approve('notebook-1', 'user-1', 'my query');

    expect(result).toEqual({ ok: false, reason: 'no_results' });
    expect(sourceService.create).not.toHaveBeenCalled();
  });

  it('APPROVE_SEARCH_FAILS: the search call throwing is swallowed into a typed failure, not a raw exception', async () => {
    const { service, sourceService } = makeService({
      searchWeb: async () => {
        throw new Error('network error');
      },
      create: vi.fn() as unknown as (params: unknown) => Promise<{ ok: true; source: { id: string } }>,
    });

    const result = await service.approve('notebook-1', 'user-1', 'my query');

    expect(result).toEqual({ ok: false, reason: 'search_failed' });
    expect(sourceService.create).not.toHaveBeenCalled();
  });

  it('APPROVE_ALL_CAPPED: every candidate rejected by the cap yields a distinct capped reason, not surfaced per-candidate', async () => {
    const { service } = makeService({
      searchWeb: async () => [makeResult({ url: 'https://example.com/a' }), makeResult({ url: 'https://example.com/b' })],
      create: async () => ({ ok: false, reason: 'Source limit reached' }),
    });

    const result = await service.approve('notebook-1', 'user-1', 'my query');

    expect(result).toEqual({ ok: false, reason: 'capped' });
  });

  it('APPROVE_PARTIAL: 5 results, 3 succeed and 2 are capped/fail -- reports the actual settled count, never the raw result count', async () => {
    const results = Array.from({ length: 5 }, (_, i) => makeResult({ url: `https://example.com/${i}` }));
    let counter = 0;
    const { service } = makeService({
      searchWeb: async () => results,
      create: async () => {
        counter += 1;
        if (counter > 3) return { ok: false, reason: 'Source limit reached' };
        return { ok: true, source: { id: `source-${counter}` } };
      },
    });

    const result = await service.approve('notebook-1', 'user-1', 'my query');

    expect(result).toEqual({ ok: true, added: 3 });
  });

  it('CREATE_THROWS: an unexpected create-path exception for one candidate is skipped silently, same as a cap rejection', async () => {
    let counter = 0;
    const { service } = makeService({
      searchWeb: async () => [makeResult({ url: 'https://example.com/a' }), makeResult({ url: 'https://example.com/b' })],
      create: async () => {
        counter += 1;
        if (counter === 1) throw new Error('db down');
        return { ok: true, source: { id: 'source-2' } };
      },
    });

    const result = await service.approve('notebook-1', 'user-1', 'my query');

    expect(result).toEqual({ ok: true, added: 1 });
  });

  it('deduplicates search results by URL before creating sources', async () => {
    const { service, sourceService } = makeService({
      searchWeb: async () => [
        makeResult({ url: 'https://example.com/a' }),
        makeResult({ url: 'https://example.com/a' }),
      ],
      create: async () => ({ ok: true, source: { id: 'source-1' } }),
    });

    const result = await service.approve('notebook-1', 'user-1', 'my query');

    expect(result).toEqual({ ok: true, added: 1 });
    expect(sourceService.create).toHaveBeenCalledTimes(1);
  });

  it('reports search_failed (retryable), not capped, when every candidate fails via an unexpected exception rather than a cap rejection', async () => {
    const { service } = makeService({
      searchWeb: async () => [makeResult({ url: 'https://example.com/a' }), makeResult({ url: 'https://example.com/b' })],
      create: async () => {
        throw new Error('db down');
      },
    });

    const result = await service.approve('notebook-1', 'user-1', 'my query');

    expect(result).toEqual({ ok: false, reason: 'search_failed' });
  });

  it('still reports capped (no retry) when zero added is caused purely by cap rejections, even alongside an unrelated exception mixed in', async () => {
    let counter = 0;
    const { service } = makeService({
      searchWeb: async () => [
        makeResult({ url: 'https://example.com/a' }),
        makeResult({ url: 'https://example.com/b' }),
      ],
      create: async () => {
        counter += 1;
        return { ok: false, reason: 'Source limit reached' };
      },
    });

    const result = await service.approve('notebook-1', 'user-1', 'my query');

    expect(result).toEqual({ ok: false, reason: 'capped' });
  });
});
