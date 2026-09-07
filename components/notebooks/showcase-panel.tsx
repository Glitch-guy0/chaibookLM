'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchSourceContent,
  type CitationSnapshot,
  type SourceRecord,
} from './api';
import { ShowcaseEmpty } from './showcase/showcase-empty';
import { PdfShowcase } from './showcase/pdf-showcase';
import { YouTubeShowcase } from './showcase/youtube-showcase';
import { TranscriptShowcase } from './showcase/transcript-showcase';
import { WebShowcase } from './showcase/web-showcase';
import { TextShowcase } from './showcase/text-showcase';

export interface ShowcasePanelProps {
  citation: CitationSnapshot | null;
  sources: SourceRecord[];
  sourcesLoading: boolean;
  onEsc: () => void;
}

/**
 * ShowcasePanel (Story 4.1: Showcase State Machine & Multi-Modal Dispatcher)
 * - Empty state when no citation is active: "Click any citation pill in chat to verify proof in the original source."
 * - Dispatches appropriate viewer modality based on cited source type:
 *   - PDF: Page jumper with "Page X of Y", keyboard shortcuts `[` and `]`, cyan bounding box
 *   - YouTube: Embedded player seeking to timestampSeconds + synchronized autoscrolling transcript
 *   - Transcript: Dialogue lines with seekable timestamp cues and active highlight
 *   - Web: Sanitized article reader with cyan outline on cited paragraph, iframe/snapshot fallback
 *   - Text: Full markdown reader with auto-scroll and cyan highlight mark
 * - State machine handling: idle -> loading -> active -> error / not-found
 * - Esc key dismisses active citation and restores focus
 */
export function ShowcasePanel({
  citation,
  sources,
  sourcesLoading,
  onEsc,
}: ShowcasePanelProps) {
  const source = useMemo(
    () => (citation ? sources.find((s) => s.id === citation.sourceId) ?? null : null),
    [citation, sources],
  );

  // Only treat source as genuinely missing once source list query settles
  const sourceNotFound = Boolean(citation) && !sourcesLoading && !source;

  const contentQuery = useQuery({
    queryKey: ['source-content', citation?.sourceId],
    queryFn: () => fetchSourceContent(citation!.sourceId),
    enabled: Boolean(citation) && !sourceNotFound,
  });

  useEffect(() => {
    if (!citation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEsc();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [citation, onEsc]);

  const title = source?.title ?? citation?.sourceTitle ?? 'this source';
  const announcement = sourceNotFound
    ? `Showcase: ${title} is no longer available.`
    : citation
      ? `Showcase: ${title}`
      : '';

  if (!citation) {
    return <ShowcaseEmpty />;
  }

  return (
    <div data-debug="ShowcasePanel" data-testid="showcase-panel" className="flex flex-col gap-4">
      <div aria-live="polite" className="sr-only" data-debug="ShowcaseAriaLive">
        {announcement}
      </div>

      {sourceNotFound ? (
        <div
          data-debug="ShowcaseSourceNotFound"
          data-testid="showcase-source-not-found"
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default shadow-[3px_3px_0_0_#111111]"
        >
          <p className="font-mono text-sm font-semibold text-ink-secondary dark:text-ink-secondary-dark">
            This source is no longer available.
          </p>
          <p className="mt-1 text-xs text-ink-muted dark:text-ink-muted-dark">
            The source may have been deleted from the notebook.
          </p>
        </div>
      ) : sourcesLoading || contentQuery.isLoading ? (
        <div
          data-debug="ShowcaseLoading"
          data-testid="showcase-loading"
          className="flex flex-col items-center justify-center p-12 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark rounded-default shadow-[3px_3px_0_0_#111111]"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border dark:border-border-dark border-t-[#00E5FF] mb-3" />
          <p className="font-mono text-xs font-semibold text-ink dark:text-ink-dark">
            Loading source proof…
          </p>
        </div>
      ) : contentQuery.isError || !contentQuery.data ? (
        <div
          data-debug="ShowcaseContentError"
          data-testid="showcase-content-error"
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default shadow-[3px_3px_0_0_#111111]"
        >
          <p className="font-mono text-sm font-semibold text-ink-secondary dark:text-ink-secondary-dark">
            This source&apos;s content is no longer available.
          </p>
        </div>
      ) : contentQuery.data.type === 'pdf' ? (
        <PdfShowcase
          content={contentQuery.data}
          citation={citation}
          title={title}
        />
      ) : contentQuery.data.type === 'youtube' ? (
        <YouTubeShowcase
          content={contentQuery.data}
          citation={citation}
          title={title}
        />
      ) : contentQuery.data.type === 'transcript' ? (
        <TranscriptShowcase
          content={contentQuery.data}
          citation={citation}
          title={title}
        />
      ) : contentQuery.data.type === 'web' ? (
        <WebShowcase
          content={contentQuery.data}
          citation={citation}
          title={title}
        />
      ) : (
        <TextShowcase
          content={contentQuery.data}
          citation={citation}
          title={title}
        />
      )}
    </div>
  );
}
