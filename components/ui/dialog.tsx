'use client';

import {
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type MouseEvent,
  type RefObject,
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
  /** Element to receive focus when the dialog opens (e.g. the confirm button). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Override the debug label name. */
  'data-debug'?: string;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusable(
  root: HTMLElement,
): Array<HTMLElement & { focus: () => void }> {
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el): el is HTMLElement & { focus: () => void } => {
      const candidate = el as HTMLElement;
      return !candidate.hasAttribute('disabled') && candidate.tabIndex !== -1;
    },
  );
}

/**
 * Neo-brutalist modal dialog with focus management:
 * - White fill, 2px ink border, offset shadow
 * - Overlay dim backdrop, Escape to close, overlay click to close
 * - Traps Tab focus inside the dialog
 * - Focuses `initialFocusRef` (or the dialog) on open
 * - Restores focus to the previously focused element on close
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  initialFocusRef,
  'data-debug': debugName = 'Dialog',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = getFocusable(dialogRef.current);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Defer so the dialog is mounted before focusing.
    const raf = requestAnimationFrame(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        dialogRef.current?.focus();
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      lastFocusedRef.current?.focus();
    };
  }, [open, handleKeyDown, initialFocusRef]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-dim px-4 py-6"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        data-debug={debugName}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Dialog'}
        tabIndex={-1}
        className={[
          'relative w-full max-w-lg max-h-full overflow-y-auto',
          'bg-surface-elevated dark:bg-surface-elevated-dark',
          'border-3 border-[var(--color-border)] dark:border-[var(--color-border-dark)]',
          'shadow-[8px_8px_0_0_var(--color-ink)]',
          'dark:shadow-[8px_8px_0_0_var(--color-ink-dark)]',
          'p-6',
          'rounded-[var(--radius-default)]',
          'focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2',
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
