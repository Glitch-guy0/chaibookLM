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
 * both single and bulk deletes. Initial focus lands on the destructive confirm
 * button; focus is restored to the trigger on close.
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
      data-debug="DeleteNotebookDialog"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            data-debug="DeleteNotebookCancel"
            className="min-h-11 px-4 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            data-debug="DeleteNotebookConfirm"
            className="min-h-11 px-5 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-error text-white dark:bg-error dark:text-white rounded-default disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            {isPending ? 'Deleting…' : confirmLabel}
          </button>
        </>
      }
    >
      <p data-debug="DeleteNotebookMessage" className="text-ink dark:text-ink-dark">
        {message}
      </p>
    </Dialog>
  );
}
