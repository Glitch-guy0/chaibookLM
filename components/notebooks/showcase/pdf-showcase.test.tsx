import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PdfShowcase } from './pdf-showcase';
import { CitationChip } from '../../chat/citation-chip';
import type { CitationSnapshot, SourceContent } from '../api';

describe('Story 4.2: PDF Original View Showcase with Page Jumper & Bounding-Box Highlight', () => {
  const mockPdfContent: Extract<SourceContent, { type: 'pdf' }> = {
    type: 'pdf',
    title: 'raft-paper.pdf',
    pages: [
      { pageNumber: 1, text: 'Introduction to consensus protocols and state machine replication.' },
      {
        pageNumber: 14,
        text: 'During a partition, the minority leader can be deposed. The deposed leader reverts to follower and discards uncommitted entries.',
      },
      { pageNumber: 15, text: 'Log compaction and snapshotting mechanisms.' },
    ],
    totalPages: 28,
  };

  const mockCitation: CitationSnapshot = {
    chunkId: 'chk-raft-1',
    sourceId: 'src-raft',
    span: { start: 20, end: 80 },
    pageNumber: 14,
    excerpt: 'The deposed leader reverts to follower and discards uncommitted entries.',
  };

  it('AC-4.2.1 & AC-4.2.2: renders PDF page viewer navigated to cited pageNumber with Page X of Y header', () => {
    const html = renderToStaticMarkup(
      <PdfShowcase
        content={mockPdfContent}
        citation={mockCitation}
        title="raft-paper.pdf"
      />,
    );

    expect(html).toContain('data-testid="pdf-showcase"');
    expect(html).toContain('raft-paper.pdf');
    expect(html).toContain('Page 14 of 28');
    expect(html).toContain('data-testid="pdf-prev-page"');
    expect(html).toContain('data-testid="pdf-next-page"');
    expect(html).toContain('data-testid="pdf-page-indicator"');
  });

  it('AC-4.2.3: highlights cited excerpt text inside high-contrast cyan bounding box', () => {
    const html = renderToStaticMarkup(
      <PdfShowcase
        content={mockPdfContent}
        citation={mockCitation}
        title="raft-paper.pdf"
      />,
    );

    expect(html).toContain('data-testid="pdf-bounding-box"');
    expect(html).toContain('border-3 border-[#00E5FF]');
    expect(html).toContain('The deposed leader reverts to follower and discards uncommitted entries.');
  });

  it('AC-4.2.4: hovering citation pill in chat displays tooltip with source title and page number', () => {
    const html = renderToStaticMarkup(
      <CitationChip
        citation={mockCitation}
        sourceTitle="raft-paper.pdf"
        citationKey="turn-1-chk-raft-1-0"
        index={1}
        onOpenCitation={() => {}}
      />,
    );

    expect(html).toContain('data-testid="citation-pill"');
    expect(html).toContain('title="raft-paper.pdf — Page 14"');
    expect(html).toContain('aria-label="Citation: raft-paper.pdf — Page 14"');
    expect(html).toContain('[1]');
  });
});
