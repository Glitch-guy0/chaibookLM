'use client';

import type { KeyboardEvent } from 'react';
import type { CitationSnapshot } from '../notebooks/api';

interface CitationChipProps {
  citation: CitationSnapshot;
  /** Resolved source title, or undefined if the sourceId isn't found in the
   * client's currently-loaded source list (e.g. removed) -- falls back to a
   * generic label instead of crashing. */
  sourceTitle: string | undefined;
  /** Story 4.3's responsibility is the actual navigation; this story wires a
   * no-op placeholder. */
  onOpenCitation: (citation: CitationSnapshot) => void;
}

/**
 * Focusable, hoverable citation chip rendered in place of a validated
 * `[[chunkId]]` marker. A plain `title` attribute satisfies "shows source
 * title on hover/focus" without pulling in a tooltip library -- native
 * `title` already fires on both mouse hover and keyboard focus.
 */
export function CitationChip({ citation, sourceTitle, onOpenCitation }: CitationChipProps) {
  const label = sourceTitle ?? 'Source unavailable';

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onOpenCitation(citation);
    }
  };

  return (
    <button
      type="button"
      data-debug="CitationChip"
      title={label}
      aria-label={`Citation: ${label}`}
      onClick={() => onOpenCitation(citation)}
      onKeyDown={handleKeyDown}
      className="mx-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark text-[10px] font-semibold align-super leading-none text-ink-secondary dark:text-ink-secondary-dark hover:bg-ink hover:text-white dark:hover:bg-ink-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
    >
      •
    </button>
  );
}
