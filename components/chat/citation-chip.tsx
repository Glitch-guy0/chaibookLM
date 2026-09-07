'use client';

import type { KeyboardEvent } from 'react';
import type { CitationSnapshot } from '../notebooks/api';

interface CitationChipProps {
  citation: CitationSnapshot;
  /** Resolved source title, or undefined if the sourceId isn't found in the
   * client's currently-loaded source list (e.g. removed) -- falls back to a
   * generic label instead of crashing. */
  sourceTitle: string | undefined;
  /** Stable id unique to this rendered occurrence */
  citationKey: string;
  /** Optional 1-based index for numeral display [1], [2], etc. */
  index?: number;
  onOpenCitation: (citation: CitationSnapshot, citationKey: string) => void;
}

/**
 * Focusable, hoverable citation chip / pill rendered in place of a validated
 * marker. Styled in high-contrast cyan (#00E5FF) with Space Mono bold numerals.
 * Shows source title + page number / timestamp on hover and focus.
 */
export function CitationChip({
  citation,
  sourceTitle,
  citationKey,
  index,
  onOpenCitation,
}: CitationChipProps) {
  const baseTitle = sourceTitle ?? 'Source unavailable';
  let tooltipLabel = baseTitle;

  if (citation.pageNumber !== undefined) {
    tooltipLabel = `${baseTitle} — Page ${citation.pageNumber}`;
  } else if (citation.timestampSeconds !== undefined) {
    const mins = Math.floor(citation.timestampSeconds / 60);
    const secs = citation.timestampSeconds % 60;
    tooltipLabel = `${baseTitle} — @ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Derive numeral display: either explicit index or parsed from citationKey
  const derivedIndex =
    index !== undefined
      ? index
      : (() => {
          const parts = citationKey.split('-');
          const lastPart = parts[parts.length - 1];
          const num = parseInt(lastPart, 10);
          return Number.isFinite(num) ? num + 1 : 1;
        })();

  let pillText = `[${derivedIndex}]`;
  if (citation.link) {
    try {
      const url = new URL(citation.link);
      const domain = url.hostname.replace(/^www\./, '');
      pillText = `[Web: ${domain}]`;
    } catch {
      pillText = `[Web]`;
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onOpenCitation(citation, citationKey);
    }
  };

  return (
    <button
      type="button"
      data-debug="CitationChip"
      data-testid="citation-pill"
      data-citation-key={citationKey}
      title={tooltipLabel}
      aria-label={`Citation: ${tooltipLabel}`}
      onClick={() => onOpenCitation(citation, citationKey)}
      onKeyDown={handleKeyDown}
      className="mx-1 inline-flex items-center justify-center px-1.5 py-0.5 border-1.5 border-border dark:border-border-dark rounded-sm bg-[#00E5FF] dark:bg-[#00E5FF]/90 text-ink font-mono font-bold text-[11px] align-baseline leading-none shadow-[2px_2px_0_0_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_#111111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 transition-transform cursor-pointer"
    >
      {pillText}
    </button>
  );
}

export { CitationChip as CitationPill };


