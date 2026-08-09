'use client';

import Link from 'next/link';
import { daysUntilExpiry, type NotebookRecord } from './api';

interface NotebookCardProps {
  notebook: NotebookRecord;
  /** Whether the card is bulk-selected (drives the active/brand state). */
  selected: boolean;
  onToggleSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}

/**
 * Dashboard notebook card. Shows the title, source count, expiry meta, per-card
 * rename/delete actions and a bulk-select checkbox. The active/open state uses a
 * brand fill plus a bold title and filled glyph — never color-only.
 */
export function NotebookCard({
  notebook,
  selected,
  onToggleSelect,
  onRename,
  onDelete,
}: NotebookCardProps) {
  const days = daysUntilExpiry(notebook.expiresAt);
  const dayLabel = days === 1 ? '1 day' : `${days} days`;

  return (
    <article
      data-debug={`NotebookCard-${notebook.id}`}
      aria-label={`Notebook: ${notebook.title}`}
      className={[
        'relative flex flex-col gap-3 p-5',
        'border-2 border-border dark:border-border-dark rounded-default',
        'shadow-card dark:shadow-card-dark transition-shadow duration-150',
        selected
          ? 'bg-brand dark:bg-brand'
          : 'bg-surface-elevated dark:bg-surface-elevated-dark hover:bg-surface dark:hover:bg-surface-dark',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <label
          data-debug={`NotebookCardSelect-${notebook.id}`}
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Select ${notebook.title}`}
            data-debug={`NotebookCheckbox-${notebook.id}`}
            className="h-5 w-5 cursor-pointer accent-[var(--color-ink)] dark:accent-[var(--color-ink-dark)]"
          />
          <span aria-hidden="true" className={selected ? 'text-[0.8em]' : 'text-[0.8em] text-transparent'}>
            ▮
          </span>
          Select
        </label>
        <span
          data-debug={`NotebookSourceCount-${notebook.id}`}
          className="text-xs font-mono uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
        >
          {notebook.sourceCount} {notebook.sourceCount === 1 ? 'source' : 'sources'}
        </span>
      </div>

      <h3
        data-debug={`NotebookTitle-${notebook.id}`}
        className={[
          'font-display text-xl leading-tight break-words',
          selected
            ? 'text-ink dark:text-ink-dark font-bold'
            : 'text-ink dark:text-ink-dark font-semibold',
        ].join(' ')}
      >
        <Link
          href={`/notebook/${notebook.id}`}
          data-debug={`NotebookOpen-${notebook.id}`}
          className="focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          {notebook.title}
        </Link>
      </h3>

      <p
        data-debug={`NotebookExpiry-${notebook.id}`}
        className="text-sm text-ink-secondary dark:text-ink-secondary-dark"
      >
        Expires in {dayLabel}
      </p>

      <div className="mt-auto flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onRename}
          data-debug={`NotebookRename-${notebook.id}`}
          className="min-h-11 sm:min-h-9 px-3 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-default hover:bg-brand dark:hover:bg-brand focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={onDelete}
          data-debug={`NotebookDelete-${notebook.id}`}
          className="min-h-11 sm:min-h-9 px-3 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-error text-white dark:bg-error dark:text-white rounded-default hover:opacity-90 focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
