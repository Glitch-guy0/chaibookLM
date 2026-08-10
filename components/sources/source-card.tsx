'use client';

import { formatBytes, type SourceRecord } from '../notebooks/api';

const STATUS_META: Record<
  SourceRecord['status'],
  { label: string; dot: string; text: string }
> = {
  queued: {
    label: 'Queued',
    dot: 'var(--color-warning)',
    text: 'text-[var(--color-warning)] dark:text-[var(--color-warning-dark)]',
  },
  processing: {
    label: 'Indexing',
    dot: 'var(--color-warning)',
    text: 'text-[var(--color-warning)] dark:text-[var(--color-warning-dark)]',
  },
  ready: {
    label: 'Ready',
    dot: 'var(--color-success)',
    text: 'text-[var(--color-success)] dark:text-[var(--color-success-dark)]',
  },
  failed: {
    label: 'Failed',
    dot: 'var(--color-error)',
    text: 'text-[var(--color-error)] dark:text-[var(--color-error-dark)]',
  },
};

interface SourceCardProps {
  source: SourceRecord;
  selected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
}

/**
 * Source card. Shows icon, title, type + size, added time and a status dot +
 * label (color is never the only channel). While indexing, only the card's
 * offset shadow rotates as an activity indicator; on ready the shadow snaps
 * back. Reduced motion skips the rotation via CSS.
 */
export function SourceCard({
  source,
  selected,
  onToggleSelect,
  onRemove,
}: SourceCardProps) {
  const status = STATUS_META[source.status];
  const indexing = source.status === 'queued' || source.status === 'processing';
  const isFailed = source.status === 'failed';

  return (
    <>
      <style>{`
@keyframes chai-shadow-orbit {
  0% { box-shadow: 3px 3px 0 0 var(--color-ink); }
  25% { box-shadow: -3px 3px 0 0 var(--color-ink); }
  50% { box-shadow: -3px -3px 0 0 var(--color-ink); }
  75% { box-shadow: 3px -3px 0 0 var(--color-ink); }
  100% { box-shadow: 3px 3px 0 0 var(--color-ink); }
}
@keyframes chai-ready-glow {
  0% { box-shadow: 3px 3px 0 0 var(--color-success); }
  100% { box-shadow: 3px 3px 0 0 var(--color-ink); }
}
.chai-indexing-shadow { animation: chai-shadow-orbit 1.2s linear infinite; }
.chai-ready-glow { animation: chai-ready-glow 1s ease-out 1; }
@media (prefers-reduced-motion: reduce) {
  .chai-indexing-shadow, .chai-ready-glow { animation: none; }
}
`}</style>
      <article
        data-debug={`SourceCard-${source.id}`}
        aria-label={`Source: ${source.title}`}
        className={[
          'relative flex flex-col gap-3 p-5',
          'border-2 border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-default',
          'shadow-[3px_3px_0_0_var(--color-ink)]',
          'dark:shadow-[3px_3px_0_0_var(--color-ink-dark)]',
          indexing ? 'chai-indexing-shadow' : '',
          source.status === 'ready' ? 'chai-ready-glow' : '',
          selected
            ? 'bg-[var(--color-brand)] dark:bg-[var(--color-brand-dark)]'
            : 'bg-surface-elevated dark:bg-surface-elevated-dark',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex items-start justify-between gap-3">
          <label
            data-debug={`SourceSelect-${source.id}`}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              aria-label={`Select ${source.title}`}
              data-debug={`SourceCheckbox-${source.id}`}
              className="h-5 w-5 cursor-pointer accent-[var(--color-ink)] dark:accent-[var(--color-ink-dark)]"
            />
            Select
          </label>
          <span
            data-debug={`SourceType-${source.id}`}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
          >
            <span aria-hidden="true" className="text-base leading-none">
              {source.type === 'web' ? '↗' : '¶'}
            </span>
            {source.type} · {formatBytes(source.size)}
          </span>
        </div>

        <h3
          data-debug={`SourceTitle-${source.id}`}
          className="font-display text-xl leading-tight break-words text-ink dark:text-ink-dark font-semibold"
        >
          {source.title}
        </h3>

        <p
          data-debug={`SourceAdded-${source.id}`}
          className="text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark"
        >
          Added {new Date(source.createdAt).toLocaleString()}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span
            data-debug={`SourceStatus-${source.id}`}
            className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-semibold ${status.text}`}
          >
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: status.dot }}
            />
            {status.label}
          </span>
          {isFailed && source.failReason && (
            <span
              data-debug={`SourceFailReason-${source.id}`}
              className="text-xs font-mono text-[var(--color-error)] dark:text-[var(--color-error-dark)] break-words"
            >
              {source.failReason}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onRemove}
            data-debug={`SourceRemove-${source.id}`}
            className="min-h-11 sm:min-h-9 px-3 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-error text-white dark:bg-error dark:text-white rounded-default hover:opacity-90 focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            Remove
          </button>
        </div>
      </article>
    </>
  );
}
