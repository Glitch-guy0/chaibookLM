import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WebShowcase } from './web-showcase';
import { TextShowcase } from './text-showcase';
import type { CitationSnapshot, SourceContent } from '../api';

describe('Story 4.4: Text & Web Source Showcase Readers', () => {
  it('AC-4.4.1: Web sources render clean article reader with cyan focus outline on cited paragraph', () => {
    const mockWebContent: Extract<SourceContent, { type: 'web' }> = {
      type: 'web',
      url: 'https://docs.contextual.ai/architecture',
      snapshotHtml: null,
      markdown: `
        Contextual Architecture Overview.

        This first paragraph introduces the core distributed indexing pipeline.

        Our consensus engine utilizes Raft state machines for cluster coordination and fault tolerance across replicas.

        Finally, the storage layer guarantees snapshot durability and ephemeral purge at midnight IST.
      `,
    };

    const citation: CitationSnapshot = {
      chunkId: 'chk-web-1',
      sourceId: 'src-web-1',
      span: { start: 0, end: 50 },
      excerpt: 'Our consensus engine utilizes Raft state machines for cluster coordination',
    };

    const html = renderToStaticMarkup(
      <WebShowcase
        content={mockWebContent}
        citation={citation}
        title="Contextual Architecture"
      />,
    );

    expect(html).toContain('data-testid="web-showcase"');
    expect(html).toContain('data-testid="web-article-reader"');
    expect(html).toContain('data-testid="web-cited-paragraph"');
    expect(html).toContain('outline-3 outline-[#00E5FF]');
    expect(html).toContain('Our consensus engine utilizes Raft state machines');
  });

  it('AC-4.4.2: Text sources render full Markdown text with cyan highlight mark on cited passage', () => {
    const mockTextContent: Extract<SourceContent, { type: 'text' }> = {
      type: 'text',
      text: 'Meeting Notes: The daily credit governor restricts free-tier accounts to 10 queries per day, resetting at midnight Asia/Kolkata.',
    };

    const citation: CitationSnapshot = {
      chunkId: 'chk-txt-1',
      sourceId: 'src-txt-1',
      span: { start: 15, end: 104 },
      excerpt: 'The daily credit governor restricts free-tier accounts to 10 queries per day',
    };

    const html = renderToStaticMarkup(
      <TextShowcase
        content={mockTextContent}
        citation={citation}
        title="Meeting Notes"
      />,
    );

    expect(html).toContain('data-testid="text-showcase"');
    expect(html).toContain('data-testid="text-showcase-content"');
    expect(html).toContain('data-testid="text-highlight-mark"');
    expect(html).toContain('bg-[#00E5FF]/40');
    expect(html).toContain('The daily credit governor restricts free-tier accounts to 10 queries per day');
  });
});
