'use client';

import { useRef } from 'react';
import { Dialog } from '@components/ui';

interface DeleteNotebookDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Focus-trapped confirmation dialog for destructive notebook deletion, used for
 * both single and bulk deletes.
 */
export function DeleteNotebookDialog({
  open,
  title,
  message,
  confirmLabel,
  isPending = false,
  onConfirm,
  onClose,
}: DeleteNotebookDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      initialFocusRef={confirmRef}
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-[2px] shadow-[2px_2px_0_0_var(--border,#111111)] focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2 cursor-pointer"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="min-h-11 px-5 py-2 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-[var(--danger,#FF3333)] text-white rounded-[2px] shadow-[3px_3px_0_0_var(--border,#111111)] hover:shadow-[4px_4px_0_0_var(--border,#111111)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2 cursor-pointer"
          >
            {isPending ? 'Deleting…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-ink dark:text-ink-dark font-sans text-sm leading-relaxed">
        {message}
      </p>
    </Dialog>
  );
}
