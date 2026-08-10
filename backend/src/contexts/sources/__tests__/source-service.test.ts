import { describe, expect, it, vi } from 'vitest';
import { SourceService } from '../index';
import type { Source } from '../../../shared-kernel/types';

function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: 'source-1',
    notebookId: 'notebook-1',
    userId: 'user-1',
    type: 'text',
    title: 'My Source',
    status: 'ready',
    size: 100,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeService(opts: {
  source?: Source | null;
  storageGet?: (key: string) => Promise<Buffer | null>;
}) {
  const repo = {
    findSourceById: vi.fn(async () => (opts.source === undefined ? makeSource() : opts.source)),
  } as any;
  const storage = {
    get: vi.fn(opts.storageGet ?? (async () => null)),
    put: vi.fn(async () => ''),
    delete: vi.fn(async () => {}),
  } as any;
  const limits = {} as any;
  const indexer = {} as any;
  const qdrant = {} as any;
  return new SourceService(repo, storage, limits, indexer, qdrant);
}

describe('SourceService.getContent', () => {
  it('TEXT_OK: returns the full raw text for a Text Source', async () => {
    const service = makeService({
      source: makeSource({ type: 'text' }),
      storageGet: async (key) => (key === 'sources/source-1' ? Buffer.from('hello world') : null),
    });

    const result = await service.getContent('source-1', 'user-1');

    expect(result).toEqual({ ok: true, content: { type: 'text', text: 'hello world' } });
  });

  it('WEB_WITH_SNAPSHOT: returns the url plus the captured snapshot when present', async () => {
    const service = makeService({
      source: makeSource({ type: 'web' }),
      storageGet: async (key) => {
        if (key === 'sources/source-1') return Buffer.from('https://example.com');
        if (key === 'sources/source-1/snapshot.html') return Buffer.from('<html></html>');
        return null;
      },
    });

    const result = await service.getContent('source-1', 'user-1');

    expect(result).toEqual({
      ok: true,
      content: { type: 'web', url: 'https://example.com', snapshotHtml: '<html></html>' },
    });
  });

  it('WEB_WITHOUT_SNAPSHOT: returns snapshotHtml: null when no snapshot was captured', async () => {
    const service = makeService({
      source: makeSource({ type: 'web' }),
      storageGet: async (key) =>
        key === 'sources/source-1' ? Buffer.from('https://example.com') : null,
    });

    const result = await service.getContent('source-1', 'user-1');

    expect(result).toEqual({
      ok: true,
      content: { type: 'web', url: 'https://example.com', snapshotHtml: null },
    });
  });

  it('NOT_FOUND: returns not_found when the Source row does not exist', async () => {
    const service = makeService({ source: null });

    const result = await service.getContent('missing-id', 'user-1');

    expect(result).toEqual({ ok: false, reason: 'not_found' });
  });

  it('NOT_OWNED: returns not_found when the source belongs to a different user', async () => {
    const service = makeService({ source: makeSource({ userId: 'someone-else' }) });

    const result = await service.getContent('source-1', 'user-1');

    expect(result).toEqual({ ok: false, reason: 'not_found' });
  });

  it('TEXT_STORAGE_FAILURE: a rejected storage.get on a Text Source surfaces content_unavailable, not a throw', async () => {
    const service = makeService({
      source: makeSource({ type: 'text' }),
      storageGet: async () => {
        throw new Error('storage down');
      },
    });

    const result = await service.getContent('source-1', 'user-1');

    expect(result).toEqual({ ok: false, reason: 'content_unavailable' });
  });

  it('WEB_STORAGE_FAILURE: a rejected storage.get on the raw url for a Web Source surfaces content_unavailable, not a throw', async () => {
    const service = makeService({
      source: makeSource({ type: 'web' }),
      storageGet: async () => {
        throw new Error('storage down');
      },
    });

    const result = await service.getContent('source-1', 'user-1');

    expect(result).toEqual({ ok: false, reason: 'content_unavailable' });
  });

  it('TEXT_MISSING_BLOB: a null (not thrown) raw read on a Text Source is content_unavailable, not a masked empty success', async () => {
    const service = makeService({
      source: makeSource({ type: 'text' }),
      storageGet: async () => null,
    });

    const result = await service.getContent('source-1', 'user-1');

    expect(result).toEqual({ ok: false, reason: 'content_unavailable' });
  });

  it('WEB_SNAPSHOT_STORAGE_FAILURE: a rejected snapshot read still resolves the url (snapshot treated as absent)', async () => {
    const service = makeService({
      source: makeSource({ type: 'web' }),
      storageGet: async (key) => {
        if (key === 'sources/source-1') return Buffer.from('https://example.com');
        throw new Error('snapshot read failed');
      },
    });

    const result = await service.getContent('source-1', 'user-1');

    expect(result).toEqual({
      ok: true,
      content: { type: 'web', url: 'https://example.com', snapshotHtml: null },
    });
  });
});
