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
 * - White surface fill, 2px ink border, solid offset shadow
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
      const active = document.activeElement;
      const isFormControl = active instanceof HTMLElement && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
      if (!isFormControl) {
        lastFocusedRef.current?.focus();
      }
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Dialog'}
        tabIndex={-1}
        className={[
          'relative w-full max-w-lg max-h-[90vh] overflow-y-auto',
          'bg-[var(--surface,#FFFFFF)] dark:bg-[var(--surface,#18181B)]',
          'border-2 border-[var(--border,#111111)] dark:border-[var(--border-dark,#E4E4E7)]',
          'shadow-[10px_10px_0_0_var(--border,#111111)]',
          'dark:shadow-[10px_10px_0_0_var(--border-dark,#E4E4E7)]',
          'p-6',
          'rounded-[2px]',
          'focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2',
        ].join(' ')}
      >
        {/* Title */}
        {title && (
          <h2 className="text-xl font-mono font-bold text-[var(--fg,#111111)] dark:text-[var(--fg,#FFFFFF)] mb-4">
            {title}
          </h2>
        )}

        {/* Content */}
        <div className="text-sm font-sans text-[var(--fg,#111111)] dark:text-[var(--fg,#FFFFFF)]">
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
