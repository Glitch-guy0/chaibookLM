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
      data-debug="BulkDeleteBar"
      role="region"
      aria-label="Bulk selection"
      className="sticky top-4 z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 mb-6 border-2 border-border dark:border-border-dark bg-brand dark:bg-brand shadow-card dark:shadow-card-dark rounded-default"
    >
      <p
        data-debug="BulkDeleteCount"
        className="text-sm font-semibold font-sans uppercase tracking-wider text-ink dark:text-ink-dark"
      >
        {count} {count === 1 ? 'notebook' : 'notebooks'} selected
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          data-debug="BulkDeleteClear"
          className="min-h-11 px-4 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onDelete}
          data-debug="BulkDeleteDelete"
          className="min-h-11 px-5 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-error text-white dark:bg-error dark:text-white rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
