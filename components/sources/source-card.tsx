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
  const isFailed = source.status === 'failed';
  const typeIcon = TYPE_ICONS[source.type] ?? '¶';

  return (
    <article
      data-testid={`source-card-${source.id}`}
      aria-label={`Source: ${source.title}`}
      className={[
        'src-item relative flex flex-col gap-1.5 rounded-[2px]',
        'border-2',
        status.borderClass,
        'shadow-[3px_3px_0_0_var(--border)]',
        'transition-[box-shadow,transform] duration-120 ease-out',
        selected
          ? 'bg-[var(--accent,#FFE500)] text-[#111111]'
          : 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Top row: Checkbox + Type Icon + Title + Remove button */}
      <div className="src-row justify-between w-full">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Select ${source.title}`}
            className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-ink dark:accent-surface rounded-[2px]"
          />
          <span
            aria-hidden="true"
            data-testid={`source-type-${source.id}`}
            className="src-icon text-[10px]"
          >
            {typeIcon}
          </span>
          <span className="src-name font-mono text-xs font-bold truncate">
            {source.title}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          data-testid={`source-delete-${source.id}`}
          aria-label={`Remove ${source.title}`}
          title="Remove source"
          className="shrink-0 p-1 text-[11px] font-mono font-bold text-muted hover:text-danger cursor-pointer transition-colors"
        >
          ×
        </button>
      </div>

      {/* Bottom row: Status Dot + Label + Meta / Retry */}
      <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span
            data-testid={`source-status-${source.id}`}
            className={`status ${status.textClass}`}
          >
            <span
              aria-hidden="true"
              data-testid={`source-dot-${source.id}`}
              className={status.dotClass}
            />
            {status.label}
          </span>
          <span className="text-muted text-[10px]">
            · {formatBytes(source.size)}
          </span>
        </div>

        {isFailed && (
          <div className="flex items-center gap-1.5">
            {source.failReason && (
              <span
                data-testid={`source-fail-reason-${source.id}`}
                title={source.failReason}
                className="text-[10px] text-danger truncate max-w-[120px] cursor-help underline decoration-dotted"
              >
                {source.failReason}
              </span>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                data-testid={`source-retry-${source.id}`}
                className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider border border-danger bg-surface dark:bg-surface-dark text-danger rounded-[2px] shadow-[1px_1px_0_0_var(--border)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
