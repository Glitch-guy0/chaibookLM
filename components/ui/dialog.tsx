'use client';

import {
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type MouseEvent,
} from 'react';

interface DialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog should close (escape key, overlay click, action). */
  onClose: () => void;
  /** Dialog title rendered in the header. */
  title?: string;
  /** Main content area. */
  children: ReactNode;
  /** Optional action buttons rendered at the bottom. */
  actions?: ReactNode;
  /** Override the debug label name. */
  'data-debug'?: string;
}

/**
 * Neo-brutalist dialog:
 * - White fill, 3px ink border, 8px 8px shadow
 * - Overlay dim backdrop
 * - Escape to close
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  'data-debug': debugName = 'Dialog',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  // Close when clicking the overlay (not the dialog itself)
  const handleOverlayClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-dim"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        data-debug={debugName}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Dialog'}
        className={[
          'relative w-full max-w-lg',
          'bg-surface-elevated dark:bg-surface-elevated-dark',
          'border-3 border-[var(--color-border)] dark:border-[var(--color-border-dark)]',
          'shadow-[8px_8px_0_0_var(--color-ink)]',
          'dark:shadow-[8px_8px_0_0_var(--color-ink-dark)]',
          'p-6',
          'rounded-[var(--radius-default)]',
        ].join(' ')}
      >
        {/* Title */}
        {title && (
          <h2 className="text-xl font-display text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-4">
            {title}
          </h2>
        )}

        {/* Content */}
        <div className="text-sm text-[var(--color-ink-secondary)] dark:text-[var(--color-ink-secondary-dark)]">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center justify-end gap-3 mt-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}