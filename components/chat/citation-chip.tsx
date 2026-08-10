'use client';

import type { KeyboardEvent } from 'react';
import type { CitationSnapshot } from '../notebooks/api';

interface CitationChipProps {
  citation: CitationSnapshot;
  /** Resolved source title, or undefined if the sourceId isn't found in the
   * client's currently-loaded source list (e.g. removed) -- falls back to a
   * generic label instead of crashing. */
  sourceTitle: string | undefined;
  /** Stable id unique to this rendered occurrence (e.g.
   * `${turn.id}-${citation.chunkId}-${occurrenceIndex}`), set as
   * `data-citation-key` so focus can be re-queried after `ChatPanel`
   * remounts on returning from the Showcase tab -- a raw DOM node reference
   * would not survive that unmount/remount cycle. */
  citationKey: string;
  onOpenCitation: (citation: CitationSnapshot, citationKey: string) => void;
}

/**
 * Focusable, hoverable citation chip rendered in place of a validated
 * `[[chunkId]]` marker. A plain `title` attribute satisfies "shows source
 * title on hover/focus" without pulling in a tooltip library -- native
 * `title` already fires on both mouse hover and keyboard focus.
 */
export function CitationChip({ citation, sourceTitle, citationKey, onOpenCitation }: CitationChipProps) {
  const label = sourceTitle ?? 'Source unavailable';

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
      data-citation-key={citationKey}
      title={label}
      aria-label={`Citation: ${label}`}
      onClick={() => onOpenCitation(citation, citationKey)}
      onKeyDown={handleKeyDown}
      className="mx-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark text-[10px] font-semibold align-super leading-none text-ink-secondary dark:text-ink-secondary-dark hover:bg-ink hover:text-white dark:hover:bg-ink-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
    >
      •
    </button>
  );
}
