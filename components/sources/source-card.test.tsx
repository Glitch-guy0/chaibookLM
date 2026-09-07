import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceCard } from './source-card';
import type { SourceRecord } from '../notebooks/api';

describe('Story 2.5: Source Management UI & Real-Time Status Telemetry', () => {
  const baseSource: SourceRecord = {
    id: 'src-1',
    notebookId: 'nb-1',
    userId: 'user-1',
    type: 'pdf',
    title: 'Research Paper.pdf',
    status: 'ready',
    size: 2048576,
    failReason: null,
    createdAt: new Date('2026-09-07T10:00:00Z').toISOString(),
  };

  it('renders ready state with green pulse dot and pdf icon (AC-2.5.1)', () => {
    const html = renderToStaticMarkup(
      <SourceCard
        source={{ ...baseSource, type: 'pdf', status: 'ready' }}
        selected={false}
        onToggleSelect={() => {}}
        onRemove={() => {}}
      />,
    );

    expect(html).toContain('📄');
    expect(html).toContain('Ready');
    expect(html).toContain('chai-green-pulse');
    expect(html).toContain('data-testid="source-delete-src-1"');
  });

  it('renders indexing state with yellow border and orbital neo-brutalist shadow spin (AC-2.5.1)', () => {
    const html = renderToStaticMarkup(
      <SourceCard
        source={{ ...baseSource, type: 'youtube', status: 'processing' }}
        selected={false}
        onToggleSelect={() => {}}
        onRemove={() => {}}
      />,
    );

    expect(html).toContain('▶');
    expect(html).toContain('Indexing');
    expect(html).toContain('chai-indexing-shadow');
    expect(html).toContain('border-[var(--color-accent,#FFE500)]');
  });

  it('renders queued state with gray border and gray dot (AC-2.5.1)', () => {
    const html = renderToStaticMarkup(
      <SourceCard
        source={{ ...baseSource, type: 'transcript', status: 'queued' }}
        selected={false}
        onToggleSelect={() => {}}
        onRemove={() => {}}
      />,
    );

    expect(html).toContain('💬');
    expect(html).toContain('Queued');
    expect(html).toContain('border-[#888888]');
  });

  it('renders failed state with red border, error tooltip, and Retry button (AC-2.5.1)', () => {
    const html = renderToStaticMarkup(
      <SourceCard
        source={{
          ...baseSource,
          type: 'web',
          status: 'failed',
          failReason: 'Firecrawl API returned 503 service unavailable',
        }}
        selected={false}
        onToggleSelect={() => {}}
        onRemove={() => {}}
        onRetry={() => {}}
      />,
    );

    expect(html).toContain('↗');
    expect(html).toContain('Failed');
    expect(html).toContain('border-[#FF3333]');
    expect(html).toContain('Firecrawl API returned 503 service unavailable');
    expect(html).toContain('data-testid="source-retry-src-1"');
    expect(html).toContain('Retry');
  });
});
