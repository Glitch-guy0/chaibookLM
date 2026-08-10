'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchSourceContent,
  type CitationSnapshot,
  type SourceContent,
  type SourceRecord,
} from './api';

const IFRAME_LOAD_TIMEOUT_MS = 8_000;

interface ShowcasePanelProps {
  citation: CitationSnapshot | null;
  sources: SourceRecord[];
  sourcesLoading: boolean;
  onEsc: () => void;
}

/**
 * Showcase panel: renders the source cited by `citation` -- a live sandboxed
 * iframe (falling back to a stored HTML snapshot, then a plain link) for a
 * Web Source, or the full text with the cited span highlighted via `<mark>`
 * for a Text Source. Content is fetched on demand (never bundled into the
 * sources list call). Esc calls back up to `Workspace` to switch tabs and
 * trigger focus restore -- this component owns no focus-restore state itself.
 */
export function ShowcasePanel({ citation, sources, sourcesLoading, onEsc }: ShowcasePanelProps) {
  const source = useMemo(
    () => (citation ? sources.find((s) => s.id === citation.sourceId) ?? null : null),
    [citation, sources],
  );

  // Only treat the source as genuinely gone once the source list has settled
  // -- never false-positive "not available" while it's still in flight.
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

  const title = source?.title ?? 'this source';
  const announcement = sourceNotFound
    ? `Showcase: ${title} is no longer available.`
    : citation
      ? `Showcase: ${title}`
      : '';

  if (!citation) {
    return (
      <div
        data-debug="ShowcaseEmpty"
        className="flex flex-col items-center justify-center px-6 py-16 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
      >
        <p className="text-lg font-semibold text-ink-secondary dark:text-ink-secondary-dark">
          Your showcase will appear here.
        </p>
        <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
          Click a citation chip in Chat to open the original source.
        </p>
      </div>
    );
  }

  return (
    <div data-debug="ShowcasePanel" className="flex flex-col gap-4">
      <div aria-live="polite" className="sr-only" data-debug="ShowcaseAriaLive">
        {announcement}
      </div>

      {sourceNotFound ? (
        <div
          data-debug="ShowcaseSourceNotFound"
          className="flex flex-col items-center justify-center px-6 py-16 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
        >
          <p className="text-lg font-semibold text-ink-secondary dark:text-ink-secondary-dark">
            This source is no longer available.
          </p>
        </div>
      ) : sourcesLoading || contentQuery.isLoading ? (
        <div
          data-debug="ShowcaseLoading"
          className="flex flex-col items-center justify-center px-6 py-16 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
        >
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Loading source…</p>
        </div>
      ) : contentQuery.isError || !contentQuery.data ? (
        <div
          data-debug="ShowcaseContentError"
          className="flex flex-col items-center justify-center px-6 py-16 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
        >
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
            This source's content is no longer available.
          </p>
        </div>
      ) : contentQuery.data.type === 'web' ? (
        <WebShowcase content={contentQuery.data} title={title} />
      ) : (
        <TextShowcase content={contentQuery.data} span={citation.span} title={title} />
      )}
    </div>
  );
}

function WebShowcase({
  content,
  title,
}: {
  content: Extract<SourceContent, { type: 'web' }>;
  title: string;
}) {
  const [blocked, setBlocked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBlocked(false);
    setLoaded(false);
    timeoutRef.current = setTimeout(() => setBlocked(true), IFRAME_LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [content.url]);

  const handleLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoaded(true);
  };

  if (!blocked) {
    return (
      <div data-debug="ShowcaseWebLive" className="flex flex-col gap-2">
        {!loaded && (
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Loading {title}…</p>
        )}
        <iframe
          key={content.url}
          data-debug="ShowcaseWebIframe"
          src={content.url}
          title={title}
          onLoad={handleLoad}
          sandbox="allow-scripts allow-popups allow-forms"
          className="h-[32rem] w-full rounded-default border-2 border-border dark:border-border-dark bg-white"
        />
      </div>
    );
  }

  if (content.snapshotHtml) {
    return (
      <div data-debug="ShowcaseWebSnapshot" className="flex flex-col gap-2">
        <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
          Showing a saved snapshot -- the live page could not be embedded.
        </p>
        <iframe
          data-debug="ShowcaseWebSnapshotIframe"
          srcDoc={content.snapshotHtml}
          title={`${title} (snapshot)`}
          sandbox=""
          className="h-[32rem] w-full rounded-default border-2 border-border dark:border-border-dark bg-white"
        />
      </div>
    );
  }

  return (
    <div
      data-debug="ShowcaseWebUnavailable"
      className="flex flex-col items-center justify-center gap-2 px-6 py-16 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
    >
      <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
        This page can&apos;t be embedded.
      </p>
      <a
        href={content.url}
        target="_blank"
        rel="noopener noreferrer"
        data-debug="ShowcaseWebOpenLink"
        className="text-sm font-semibold underline underline-offset-2 text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
      >
        Open in a new tab
      </a>
    </div>
  );
}

function TextShowcase({
  content,
  span,
  title,
}: {
  content: Extract<SourceContent, { type: 'text' }>;
  span: { start: number; end: number };
  title: string;
}) {
  const markRef = useRef<HTMLElement>(null);

  useEffect(() => {
    markRef.current?.scrollIntoView({ block: 'center' });
  }, [content.text, span.start, span.end]);

  const { before, highlighted, after } = useMemo(() => {
    const len = content.text.length;
    const start = Math.max(0, Math.min(span.start, len));
    const end = Math.max(start, Math.min(span.end, len));
    return {
      before: content.text.slice(0, start),
      highlighted: content.text.slice(start, end),
      after: content.text.slice(end),
    };
  }, [content.text, span.start, span.end]);

  return (
    <>
      <div aria-live="polite" className="sr-only" data-debug="ShowcaseHighlightAriaLive">
        {`Showcase: ${title} -- highlighted passage: ${highlighted}`}
      </div>
      <div
        data-debug="ShowcaseTextView"
        className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded-default border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark p-4 text-sm"
      >
        {before}
        <mark
          ref={markRef}
          data-debug="ShowcaseTextHighlight"
          className="rounded-sm border-2 border-ink dark:border-ink-dark bg-yellow-200 dark:bg-yellow-500/40"
        >
          {highlighted}
        </mark>
        {after}
      </div>
    </>
  );
}
