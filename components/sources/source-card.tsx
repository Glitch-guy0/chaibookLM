'use client';

import { formatBytes, type SourceRecord } from '../notebooks/api';

const STATUS_META: Record<
  SourceRecord['status'],
  { label: string; dot: string; text: string; border: string }
> = {
  queued: {
    label: 'Queued',
    dot: 'var(--color-muted, #888888)',
    text: 'text-ink-muted dark:text-ink-muted-dark',
    border: 'border-[#888888]',
  },
  processing: {
    label: 'Indexing',
    dot: 'var(--color-accent, #FFE500)',
    text: 'text-[var(--color-warning,#FFE500)]',
    border: 'border-[var(--color-accent,#FFE500)]',
  },
  ready: {
    label: 'Ready',
    dot: 'var(--color-success, #00E575)',
    text: 'text-[var(--color-success,#00E575)]',
    border: 'border-[var(--color-border)] dark:border-[var(--color-border-dark)]',
  },
  failed: {
    label: 'Failed',
    dot: 'var(--color-error, #FF3333)',
    text: 'text-[var(--color-error,#FF3333)]',
    border: 'border-[#FF3333]',
  },
};

const TYPE_ICONS: Record<SourceRecord['type'], string> = {
  text: '¶',
  web: '↗',
  pdf: '📄',
  transcript: '💬',
  youtube: '▶',
};

interface SourceCardProps {
  source: SourceRecord;
  selected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  onRetry?: () => void;
}

/**
 * SourceCard (AC-2.5.1):
 * Renders type icon, title, and current state:
 * - queued: gray border, gray dot
 * - indexing: yellow border, animated orbital neo-brutalist shadow spin
 * - ready: ink border, green pulse dot
 * - failed: red border, alert tooltip explaining error cause and a [Retry] button
 */
export function SourceCard({
  source,
  selected,
  onToggleSelect,
  onRemove,
  onRetry,
}: SourceCardProps) {
  const status = STATUS_META[source.status];
  const isIndexing = source.status === 'processing';
  const isReady = source.status === 'ready';
  const isFailed = source.status === 'failed';
  const typeIcon = TYPE_ICONS[source.type] ?? '¶';

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
@keyframes green-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.2); }
}
.chai-indexing-shadow { animation: chai-shadow-orbit 1.2s linear infinite; }
.chai-green-pulse { animation: green-pulse 1.8s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .chai-indexing-shadow, .chai-green-pulse { animation: none; }
}
`}</style>
      <article
        data-debug={`SourceCard-${source.id}`}
        data-testid={`source-card-${source.id}`}
        aria-label={`Source: ${source.title}`}
        className={[
          'relative flex flex-col gap-3 p-5',
          'border-2 rounded-default',
          status.border,
          'shadow-[3px_3px_0_0_var(--color-ink)] dark:shadow-[3px_3px_0_0_var(--color-ink-dark)]',
          isIndexing ? 'chai-indexing-shadow' : '',
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
            data-testid={`source-type-${source.id}`}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
          >
            <span aria-hidden="true" className="text-base leading-none">
              {typeIcon}
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
            data-testid={`source-status-${source.id}`}
            className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-semibold ${status.text}`}
          >
            <span
              aria-hidden="true"
              data-testid={`source-dot-${source.id}`}
              className={`inline-block h-2.5 w-2.5 rounded-full ${isReady ? 'chai-green-pulse' : ''}`}
              style={{ backgroundColor: status.dot }}
            />
            {status.label}
          </span>
          {isFailed && source.failReason && (
            <span
              data-debug={`SourceFailReason-${source.id}`}
              data-testid={`source-fail-reason-${source.id}`}
              title={source.failReason}
              className="text-xs font-mono text-[var(--color-error)] dark:text-[var(--color-error-dark)] break-words cursor-help underline decoration-dotted"
            >
              ⚠️ {source.failReason}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-end gap-2 pt-1">
          {isFailed && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              data-debug={`SourceRetry-${source.id}`}
              data-testid={`source-retry-${source.id}`}
              className="min-h-11 sm:min-h-9 px-3 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-brand dark:bg-brand text-ink dark:text-ink-dark rounded-default hover:opacity-90 shadow-[2px_2px_0_0_var(--color-ink)] focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            >
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            data-debug={`SourceRemove-${source.id}`}
            data-testid={`source-delete-${source.id}`}
            className="min-h-11 sm:min-h-9 px-3 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-error text-white dark:bg-error dark:text-white rounded-default hover:opacity-90 focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            Delete
          </button>
        </div>
      </article>
    </>
  );
}
