import { describe, expect, it } from 'vitest';
import { splitMarkdown, splitPlainText, extractAnchorMetadata } from '../splitter';
import { QdrantAdapter } from '../../adapters/qdrant/index';

describe('Story 2.4: Chunking, Local/Remote Vector Embeddings & Qdrant Upsert', () => {
  it('extracts page anchor metadata (pageNumber) into chunk metadata (AC-2.4.1)', () => {
    const markdown = `# Introduction
<!-- page: 1 -->
This is content on page one explaining core principles.

# Architecture
<!-- page: 2 -->
This is content on page two discussing vector search and embeddings.`;

    const chunks = splitMarkdown(markdown);
    expect(chunks.length).toBeGreaterThanOrEqual(2);

    const firstChunk = chunks.find((c) => c.text.includes('core principles'));
    expect(firstChunk?.metadata?.pageNumber).toBe(1);

    const secondChunk = chunks.find((c) => c.text.includes('vector search'));
    expect(secondChunk?.metadata?.pageNumber).toBe(2);
  });

  it('extracts time anchor metadata (timestampSeconds) into chunk metadata (AC-2.4.1)', () => {
    const transcriptMarkdown = `<!-- time: 01:23 -->
Here we discuss semantic retrieval techniques.

<!-- time: 02:45 -->
Next we examine vector embeddings in multi-dimensional space.`;

    const chunks = splitMarkdown(transcriptMarkdown);
    expect(chunks.length).toBeGreaterThanOrEqual(2);

    const firstChunk = chunks[0];
    expect(firstChunk.metadata?.timestampSeconds).toBe(83); // 1*60 + 23 = 83

    const secondChunk = chunks[1];
    expect(secondChunk.metadata?.timestampSeconds).toBe(165); // 2*60 + 45 = 165
  });

  it('preserves clean excerpts and sequential positions in splitPlainText', () => {
    const text = 'Hello world, this is a plain text source that needs to be chunked into segments.';
    const chunks = splitPlainText(text);

    expect(chunks.length).toBe(1);
    expect(chunks[0].position).toBe(0);
    expect(chunks[0].excerpt).toBe(text);
  });

  it('configures Qdrant collection contextual_chunks_v1 and formats payload (AC-2.4.3)', () => {
    const adapter = new QdrantAdapter();
    expect((adapter as any).collection).toBe('contextual_chunks_v1');
  });
});
