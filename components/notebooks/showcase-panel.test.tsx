import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShowcasePanel } from './showcase-panel';
import { ShowcaseEmpty } from './showcase/showcase-empty';
import { PdfShowcase } from './showcase/pdf-showcase';
import { YouTubeShowcase } from './showcase/youtube-showcase';
import { TranscriptShowcase } from './showcase/transcript-showcase';
import { WebShowcase } from './showcase/web-showcase';
import { TextShowcase } from './showcase/text-showcase';
import type { SourceRecord, CitationSnapshot } from './api';

const mockSources: SourceRecord[] = [
  {
    id: 'src-pdf-1',
    notebookId: 'nb-1',
    userId: 'user-1',
    type: 'pdf',
    title: 'Research Paper.pdf',
    status: 'ready',
    size: 1024,
    failReason: null,
    createdAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'src-yt-1',
    notebookId: 'nb-1',
    userId: 'user-1',
    type: 'youtube',
    title: 'MIT Lecture',
    status: 'ready',
    size: 512,
    failReason: null,
    createdAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'src-web-1',
    notebookId: 'nb-1',
    userId: 'user-1',
    type: 'web',
    title: 'System Docs',
    status: 'ready',
    size: 256,
    failReason: null,
    createdAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'src-txt-1',
    notebookId: 'nb-1',
    userId: 'user-1',
    type: 'text',
    title: 'Notes Draft',
    status: 'ready',
    size: 128,
    failReason: null,
    createdAt: '2026-09-07T00:00:00Z',
  },
];

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return renderToStaticMarkup(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Story 4.1: Showcase State Machine & Multi-Modal Dispatcher', () => {
  it('AC-4.1.1: renders empty state when no citation is active', () => {
    const html = renderWithClient(
      <ShowcasePanel
        citation={null}
        sources={mockSources}
        sourcesLoading={false}
        onEsc={() => {}}
      />,
    );

    expect(html).toContain('data-testid="showcase-empty"');
    expect(html).toContain('Click any citation pill in chat to verify proof in the original source.');
  });

  it('renders standalone ShowcaseEmpty component correctly', () => {
    const html = renderToStaticMarkup(<ShowcaseEmpty />);
    expect(html).toContain('Click any citation pill in chat to verify proof in the original source.');
    expect(html).toContain('data-testid="showcase-empty"');
  });

  it('handles source not found state gracefully', () => {
    const citation: CitationSnapshot = {
      chunkId: 'chk-404',
      sourceId: 'non-existent-source',
      span: { start: 0, end: 5 },
    };

    const html = renderWithClient(
      <ShowcasePanel
        citation={citation}
        sources={mockSources}
        sourcesLoading={false}
        onEsc={() => {}}
      />,
    );

    expect(html).toContain('data-testid="showcase-source-not-found"');
    expect(html).toContain('This source is no longer available.');
  });

  it('renders loading state when sources are loading', () => {
    const citation: CitationSnapshot = {
      chunkId: 'chk-1',
      sourceId: 'src-pdf-1',
      span: { start: 0, end: 5 },
    };

    const html = renderWithClient(
      <ShowcasePanel
        citation={citation}
        sources={mockSources}
        sourcesLoading={true}
        onEsc={() => {}}
      />,
    );

    expect(html).toContain('data-testid="showcase-loading"');
    expect(html).toContain('Loading source proof…');
  });
});
