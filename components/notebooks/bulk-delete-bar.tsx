'use client';

interface BulkDeleteBarProps {
  count: number;
  onDelete: () => void;
  onClear: () => void;
}

/**
 * Toolbar shown when notebooks are bulk-selected. Offers a single clear action
 * and a single destructive delete action that opens the confirmation dialog.
 */
export function BulkDeleteBar({ count, onDelete, onClear }: BulkDeleteBarProps) {
  return (
    <div
      role="region"
      aria-label="Bulk selection"
      className="sticky top-4 z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 mb-6 border-2 border-border dark:border-border-dark bg-accent text-ink rounded-[2px] shadow-[5px_5px_0_0_var(--border,#111111)]"
    >
      <p
        className="text-xs font-bold font-mono uppercase tracking-wider text-ink"
      >
        {count} {count === 1 ? 'notebook' : 'notebooks'} selected
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="min-h-11 px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-[2px] shadow-[2px_2px_0_0_var(--border,#111111)] focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2 cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="min-h-11 px-5 py-2 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-[var(--danger,#FF3333)] text-white rounded-[2px] shadow-[3px_3px_0_0_var(--border,#111111)] hover:shadow-[4px_4px_0_0_var(--border,#111111)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2 cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
