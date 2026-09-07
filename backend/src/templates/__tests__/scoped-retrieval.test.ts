import { describe, it, expect, vi } from 'vitest';
import {
  VectorStoreMemoryStrategy,
  DEFAULT_TOP_K,
  DEFAULT_MIN_SCORE,
} from '../VectorStoreMemoryStrategy';
import type { VectorStore, ScoredChunk } from '../../ports/VectorStore';
import type { Embeddings } from '../../ports/Embeddings';

describe('Scoped Semantic Vector Retrieval Service (Story 3.1)', () => {
  const fakeEmbeddings: Embeddings = {
    embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    embedBatch: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
  };

  const sampleChunks: ScoredChunk[] = [
    {
      chunkId: 'chk_1',
      sourceId: 'src_1',
      notebookId: 'nb_123',
      userId: 'user_456',
      span: { start: 0, end: 50 },
      position: 0,
      text: 'First relevant passage about quantum computing.',
      score: 0.85,
    },
    {
      chunkId: 'chk_2',
      sourceId: 'src_1',
      notebookId: 'nb_123',
      userId: 'user_456',
      span: { start: 50, end: 100 },
      position: 1,
      text: 'Second relevant passage about qubits and superposition.',
      score: 0.72,
    },
  ];

  it('generates query embeddings and passes notebookId and userId strictly to vector store', async () => {
    const searchMock = vi.fn().mockResolvedValue(sampleChunks);
    const fakeStore: VectorStore = {
      search: searchMock,
      upsert: vi.fn(),
      deleteBySourceId: vi.fn(),
    };

    const strategy = new VectorStoreMemoryStrategy(
      fakeStore,
      fakeEmbeddings,
      'nb_123',
      DEFAULT_TOP_K,
      DEFAULT_MIN_SCORE,
      'user_456',
    );

    const results = await strategy.retrieveChunks('What is quantum computing?');

    expect(fakeEmbeddings.embed).toHaveBeenCalledWith('What is quantum computing?');
    expect(searchMock).toHaveBeenCalledWith({
      queryVector: [0.1, 0.2, 0.3],
      notebookId: 'nb_123',
      userId: 'user_456',
      topK: 5,
      minScore: 0.3,
    });
    expect(results).toHaveLength(2);
    expect(results[0].chunkId).toBe('chk_1');
  });

  it('allows userId override per query call while keeping notebook scoping intact', async () => {
    const searchMock = vi.fn().mockResolvedValue(sampleChunks);
    const fakeStore: VectorStore = {
      search: searchMock,
      upsert: vi.fn(),
      deleteBySourceId: vi.fn(),
    };

    const strategy = new VectorStoreMemoryStrategy(
      fakeStore,
      fakeEmbeddings,
      'nb_123',
    );

    await strategy.retrieveChunks('Query text', 'user_custom_789');

    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        notebookId: 'nb_123',
        userId: 'user_custom_789',
      }),
    );
  });

  it('flags retrieval as insufficient context (returns empty array) when max similarity score is < 0.30', async () => {
    const lowScoreChunks: ScoredChunk[] = [
      {
        chunkId: 'chk_low',
        sourceId: 'src_1',
        notebookId: 'nb_123',
        userId: 'user_456',
        span: { start: 0, end: 50 },
        position: 0,
        text: 'Unrelated snippet with low relevance.',
        score: 0.25,
      },
    ];

    const fakeStore: VectorStore = {
      search: vi.fn().mockResolvedValue(lowScoreChunks),
      upsert: vi.fn(),
      deleteBySourceId: vi.fn(),
    };

    const strategy = new VectorStoreMemoryStrategy(
      fakeStore,
      fakeEmbeddings,
      'nb_123',
      5,
      0.3,
      'user_456',
    );

    const results = await strategy.retrieveChunks('Unrelated query');
    expect(results).toEqual([]);
  });

  it('returns empty array when vector search returns 0 chunks', async () => {
    const fakeStore: VectorStore = {
      search: vi.fn().mockResolvedValue([]),
      upsert: vi.fn(),
      deleteBySourceId: vi.fn(),
    };

    const strategy = new VectorStoreMemoryStrategy(
      fakeStore,
      fakeEmbeddings,
      'nb_123',
      5,
      0.3,
      'user_456',
    );

    const results = await strategy.retrieveChunks('Empty query');
    expect(results).toEqual([]);
  });
});
