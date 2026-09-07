import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { YouTubeShowcase } from './youtube-showcase';
import { TranscriptShowcase } from './transcript-showcase';
import type { CitationSnapshot, SourceContent } from '../api';

describe('Story 4.3: YouTube & Subtitle Transcript Showcase with Player Sync', () => {
  const mockYouTubeContent: Extract<SourceContent, { type: 'youtube' }> = {
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    title: 'MIT 6.824 Distributed Systems Lecture',
    transcript: [
      { timestampSeconds: 1112, formattedTime: '18:32', text: 'so the key safety guarantee is that the elected leader log contains' },
      { timestampSeconds: 1122, formattedTime: '18:42', text: 'every committed entry from prior terms — nothing can be lost.' },
      { timestampSeconds: 1132, formattedTime: '18:52', text: 'and it does this by never overwriting entries already committed.' },
    ],
  };

  const mockCitation: CitationSnapshot = {
    chunkId: 'chk-yt-1',
    sourceId: 'src-yt',
    span: { start: 0, end: 50 },
    timestampSeconds: 1122,
  };

  it('AC-4.3.1: embeds YouTube player seeking immediately to timestampSeconds', () => {
    const html = renderToStaticMarkup(
      <YouTubeShowcase
        content={mockYouTubeContent}
        citation={mockCitation}
        title="MIT 6.824 Distributed Systems Lecture"
      />,
    );

    expect(html).toContain('data-testid="youtube-showcase"');
    expect(html).toContain('data-testid="youtube-player"');
    expect(html).toContain('start=1122');
    expect(html).toContain('dQw4w9WgXcQ');
    expect(html).toContain('[18:42]');
  });

  it('AC-4.3.2 & AC-4.3.3: renders transcript list with cyan highlight on cited cue and bold timestamp', () => {
    const html = renderToStaticMarkup(
      <YouTubeShowcase
        content={mockYouTubeContent}
        citation={mockCitation}
        title="MIT 6.824 Distributed Systems Lecture"
      />,
    );

    expect(html).toContain('data-testid="youtube-transcript-list"');
    expect(html).toContain('data-testid="youtube-active-cue"');
    expect(html).toContain('border-[#00E5FF]');
    expect(html).toContain('[18:42]');
    expect(html).toContain('every committed entry from prior terms — nothing can be lost.');
  });

  it('renders standalone TranscriptShowcase with subtitle dialogue and timestamps', () => {
    const mockTranscriptContent: Extract<SourceContent, { type: 'transcript' }> = {
      type: 'transcript',
      title: 'panel-discussion.srt',
      dialogue: [
        { timestampSeconds: 30, formattedTime: '00:30', text: 'Welcome everyone to the discussion.' },
        { timestampSeconds: 75, formattedTime: '01:15', text: 'In our benchmarks, latency dropped by 40%.' },
      ],
    };

    const citation: CitationSnapshot = {
      chunkId: 'chk-srt-1',
      sourceId: 'src-srt',
      span: { start: 0, end: 40 },
      timestampSeconds: 75,
    };

    const html = renderToStaticMarkup(
      <TranscriptShowcase
        content={mockTranscriptContent}
        citation={citation}
        title="panel-discussion.srt"
      />,
    );

    expect(html).toContain('data-testid="transcript-showcase"');
    expect(html).toContain('panel-discussion.srt');
    expect(html).toContain('[01:15]');
    expect(html).toContain('In our benchmarks, latency dropped by 40%.');
    expect(html).toContain('border-[#00E5FF]');
  });
});
