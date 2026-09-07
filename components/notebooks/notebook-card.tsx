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
 * Dashboard notebook card. Shows title, source count, expiry meta,
 * rename/delete actions and a bulk-select checkbox matching mockup-dashboard.html.
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
      aria-label={`Notebook: ${notebook.title}`}
      className={[
        'relative flex flex-col justify-between gap-4 p-5',
        'border-2 border-[var(--border,#111111)] dark:border-[var(--border-dark,#E4E4E7)] rounded-[2px]',
        'shadow-[5px_5px_0_0_var(--border,#111111)] dark:shadow-[5px_5px_0_0_var(--border-dark,#E4E4E7)]',
        'hover:shadow-[8px_8px_0_0_var(--border,#111111)] dark:hover:shadow-[8px_8px_0_0_var(--border-dark,#E4E4E7)]',
        'hover:-translate-x-[2px] hover:-translate-y-[2px]',
        'transition-[transform,box-shadow,background] duration-150 ease-[cubic-bezier(0.2,0,0,1)]',
        selected
          ? 'bg-[var(--accent,#FFE500)] text-[#111111]'
          : 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <label
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted cursor-pointer select-none"
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Select ${notebook.title}`}
            className="h-4 w-4 cursor-pointer accent-ink dark:accent-surface"
          />
          <span aria-hidden="true" className={selected ? 'text-[0.8em] font-bold text-ink' : 'text-[0.8em] text-transparent'}>
            ▮
          </span>
          Select
        </label>
      </div>

      <div className="space-y-2">
        <h3 className="font-mono text-lg font-bold leading-tight break-words text-ink dark:text-ink-dark">
          <Link
            href={`/notebook/${notebook.id}`}
            className="no-underline hover:underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2"
          >
            {notebook.title}
          </Link>
        </h3>

        {/* Badges from mockup-dashboard.html */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-[2px] border border-border dark:border-border-dark bg-[var(--citation,#00E5FF)] text-[#111111] font-mono text-[11px] font-bold shadow-[1px_1px_0_0_var(--border,#111111)]"
          >
            {notebook.sourceCount} {notebook.sourceCount === 1 ? 'source' : 'sources'}
          </span>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-[2px] border border-border dark:border-border-dark bg-[var(--accent,#FFE500)] text-[#111111] font-mono text-[11px] font-bold shadow-[1px_1px_0_0_var(--border,#111111)]"
          >
            ⏳ {dayLabel} left
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 pt-3 border-t border-border/20 dark:border-border-dark/20">
        <button
          type="button"
          onClick={onRename}
          className="px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-[2px] shadow-[2px_2px_0_0_var(--border,#111111)] dark:shadow-[2px_2px_0_0_var(--border-dark,#E4E4E7)] hover:shadow-[3px_3px_0_0_var(--border,#111111)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-[var(--danger,#FF3333)] text-white rounded-[2px] shadow-[2px_2px_0_0_var(--border,#111111)] dark:shadow-[2px_2px_0_0_var(--border-dark,#E4E4E7)] hover:shadow-[3px_3px_0_0_var(--border,#111111)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
