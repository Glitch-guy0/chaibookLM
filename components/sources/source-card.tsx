'use client';

import { formatBytes, type SourceRecord } from '../notebooks/api';

const STATUS_META: Record<
  SourceRecord['status'],
  { label: string; dotClass: string; textClass: string; borderClass: string }
> = {
  queued: {
    label: 'Queued',
    dotClass: 'dot gray',
    textClass: 'text-muted',
    borderClass: 'border-[#888888] border-border dark:border-border-dark',
  },
  processing: {
    label: 'Indexing',
    dotClass: 'orb',
    textClass: 'text-ink dark:text-ink-dark font-bold',
    borderClass: 'border-[var(--color-accent,#FFE500)] border-accent chai-indexing-shadow',
  },
  ready: {
    label: 'Ready',
    dotClass: 'dot green chai-green-pulse',
    textClass: 'text-[var(--success,#00E575)] font-bold',
    borderClass: 'border-border dark:border-border-dark',
  },
  failed: {
    label: 'Failed',
    dotClass: 'dot red',
    textClass: 'text-danger font-bold',
    borderClass: 'border-[#FF3333] border-danger',
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
 * SourceCard matching mockup-workspace-desktop.html and component-library.html:
 * Renders type icon, title, format/size, and status state:
 * - queued: dot.gray, label "Queued"
 * - indexing: orb spinning, label "Indexing"
 * - ready: dot.green pulsing, label "Ready"
 * - failed: dot.red, label "Failed" with retry button
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
  const isFailed = source.status === 'failed';
  const typeIcon = TYPE_ICONS[source.type] ?? '¶';

  return (
    <article
      data-testid={`source-card-${source.id}`}
      aria-label={`Source: ${source.title}`}
      className={[
        'relative flex flex-col gap-3 p-4',
        'border-2 rounded-[2px]',
        status.borderClass,
        'shadow-[3px_3px_0_0_var(--border,#111111)] dark:shadow-[3px_3px_0_0_var(--border-dark,#E4E4E7)]',
        'transition-[box-shadow,transform] duration-120 ease-out',
        selected
          ? 'bg-[var(--accent,#FFE500)] text-[#111111]'
          : 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <label
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted cursor-pointer select-none"
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Select ${source.title}`}
            className="h-4 w-4 cursor-pointer accent-ink dark:accent-surface"
          />
          Select
        </label>
        <span
          data-testid={`source-type-${source.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted"
        >
          <span
            aria-hidden="true"
            className="inline-grid place-items-center h-5 w-5 border border-border dark:border-border-dark rounded-[2px] bg-bg dark:bg-surface text-[11px] leading-none"
          >
            {typeIcon}
          </span>
          {source.type} · {formatBytes(source.size)}
        </span>
      </div>

      <h3
        className="font-mono text-sm font-bold leading-snug break-words text-ink dark:text-ink-dark"
      >
        {source.title}
      </h3>

      <p className="text-[11px] font-mono text-muted">
        Added {new Date(source.createdAt).toLocaleDateString()}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          data-testid={`source-status-${source.id}`}
          className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider ${status.textClass}`}
        >
          <span
            aria-hidden="true"
            data-testid={`source-dot-${source.id}`}
            className={status.dotClass}
          />
          {status.label}
        </span>
        {isFailed && source.failReason && (
          <span
            data-testid={`source-fail-reason-${source.id}`}
            title={source.failReason}
            className="text-xs font-mono text-danger break-words cursor-help underline decoration-dotted"
          >
            ⚠️ {source.failReason}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 pt-2 border-t border-border/20 dark:border-border-dark/20">
        {isFailed && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            data-testid={`source-retry-${source.id}`}
            className="px-3 py-1 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-accent text-ink rounded-[2px] shadow-[2px_2px_0_0_var(--border,#111111)] hover:shadow-[3px_3px_0_0_var(--border,#111111)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
          >
            Retry
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          data-testid={`source-delete-${source.id}`}
          className="px-3 py-1 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-muted hover:text-danger hover:border-danger rounded-[2px] shadow-[2px_2px_0_0_var(--border,#111111)] hover:shadow-[3px_3px_0_0_var(--border,#111111)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
        >
          Remove
        </button>
      </div>
    </article>
  );
}
