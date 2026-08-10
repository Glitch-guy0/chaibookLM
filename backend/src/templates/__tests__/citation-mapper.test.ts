import { describe, expect, it } from 'vitest';
import { CitationMapper } from '../CitationMapper';
import type { ScoredChunk } from '../../ports/VectorStore';

function makeChunk(overrides: Partial<ScoredChunk> = {}): ScoredChunk {
  return {
    chunkId: 'chunk-1',
    sourceId: 'source-1',
    notebookId: 'notebook-a',
    span: { start: 0, end: 10 },
    position: 0,
    text: 'sample chunk text',
    score: 0.9,
    ...overrides,
  };
}

describe('CitationMapper.map', () => {
  it('VALID_MARKERS: returns a CitationSnapshot for every marker whose chunkId is in the retrieved set', () => {
    const mapper = new CitationMapper();
    const chunk = makeChunk({ chunkId: 'chunk-1', sourceId: 'source-1', span: { start: 3, end: 9 } });

    const result = mapper.map('See this [[chunk-1]] for details.', [chunk]);

    expect(result).toEqual([{ chunkId: 'chunk-1', sourceId: 'source-1', span: { start: 3, end: 9 } }]);
  });

  it('UNKNOWN_MARKER: drops a chunkId not present in the retrieved set (AD-7 -- validated against this turn only)', () => {
    const mapper = new CitationMapper();
    const chunk = makeChunk({ chunkId: 'chunk-1' });

    const result = mapper.map('Hallucinated [[chunk-does-not-exist]] citation.', [chunk]);

    expect(result).toEqual([]);
  });

  it('NO_MARKERS: returns an empty array when the answer has zero markers', () => {
    const mapper = new CitationMapper();
    const chunk = makeChunk({ chunkId: 'chunk-1' });

    const result = mapper.map('A plain answer with no citations.', [chunk]);

    expect(result).toEqual([]);
  });

  it('DUPLICATE_MARKER: the same valid chunkId cited twice produces two snapshots, one per occurrence', () => {
    const mapper = new CitationMapper();
    const chunk = makeChunk({ chunkId: 'chunk-1', sourceId: 'source-1' });

    const result = mapper.map('[[chunk-1]] first, and [[chunk-1]] again.', [chunk]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ chunkId: 'chunk-1', sourceId: 'source-1', span: chunk.span });
    expect(result[1]).toEqual({ chunkId: 'chunk-1', sourceId: 'source-1', span: chunk.span });
  });

  it('MIXED: preserves order of appearance and drops only the invalid markers among valid ones', () => {
    const mapper = new CitationMapper();
    const chunkA = makeChunk({ chunkId: 'chunk-a', sourceId: 'source-a' });
    const chunkB = makeChunk({ chunkId: 'chunk-b', sourceId: 'source-b' });

    const result = mapper.map(
      'First [[chunk-a]], then [[chunk-unknown]], then [[chunk-b]].',
      [chunkA, chunkB],
    );

    expect(result.map((c) => c.chunkId)).toEqual(['chunk-a', 'chunk-b']);
  });

  it('REFUSAL-LIKE: an answer against an empty retrieved set never produces citations, even if it contains marker-shaped text', () => {
    const mapper = new CitationMapper();

    const result = mapper.map('[[chunk-1]]', []);

    expect(result).toEqual([]);
  });

  it('CROSS_TURN_ISOLATION (AD-7): a chunkId retrieved for a different call is not implicitly trusted here', () => {
    const mapper = new CitationMapper();
    const otherTurnChunk = makeChunk({ chunkId: 'chunk-from-other-turn' });

    // Only chunks passed in *this* call's retrievedChunks may validate a
    // marker -- this call passes none, so even a chunkId that's "real" in
    // some other context is dropped.
    const result = mapper.map('[[chunk-from-other-turn]]', []);

    expect(result).toEqual([]);
    expect(otherTurnChunk.chunkId).toBe('chunk-from-other-turn'); // sanity
  });
});
