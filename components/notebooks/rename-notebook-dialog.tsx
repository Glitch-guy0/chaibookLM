'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@components/ui';
import { renameNotebook, type NotebookRecord } from './api';

interface RenameNotebookDialogProps {
  /** The notebook being renamed, or null when the dialog is closed. */
  notebook: NotebookRecord | null;
  onClose: () => void;
}

/**
 * Focus-trapped rename dialog. Rejects empty/whitespace names inline; a rejected
 * rename leaves the notebook's previous name untouched. Syncs the input to the
 * notebook's current title whenever a new notebook is opened.
 */
export function RenameNotebookDialog({ notebook, onClose }: RenameNotebookDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (notebook) {
      setTitle(notebook.title);
      setError(null);
    }
  }, [notebook]);

  const mutation = useMutation({
    mutationFn: (value: string) => renameNotebook(notebook!.id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      onClose();
    },
  });

  const trimmed = title.trim();
  const invalid = trimmed.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notebook) return;
    if (invalid) {
      setError('Name is required');
      inputRef.current?.focus();
      return;
    }
    setError(null);
    mutation.mutate(trimmed);
  };

  const handleChange = (value: string) => {
    setTitle(value);
    if (value.trim().length > 0 && error) setError(null);
  };

  return (
    <Dialog
      open={notebook !== null}
      onClose={onClose}
      title="Rename notebook"
      initialFocusRef={saveRef}
      data-debug="RenameNotebookDialog"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            data-debug="RenameNotebookCancel"
            className="min-h-11 px-4 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            Cancel
          </button>
          <button
            ref={saveRef}
            type="submit"
            form="rename-notebook-form"
            disabled={mutation.isPending}
            data-debug="RenameNotebookConfirm"
            className="min-h-11 px-5 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-brand dark:bg-brand text-ink dark:text-ink-dark rounded-default disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="rename-notebook-form" onSubmit={handleSubmit} noValidate>
        <label
          htmlFor="rename-notebook-input"
          className="block text-sm font-semibold text-ink dark:text-ink-dark mb-2"
        >
          Name
        </label>
        <input
          ref={inputRef}
          id="rename-notebook-input"
          type="text"
          value={title}
          onChange={(e) => handleChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          data-debug="RenameNotebookInput"
          className="w-full px-3 py-2 min-h-11 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-default placeholder:text-ink-muted dark:placeholder:text-ink-muted-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        />
        {error && (
          <p
            data-debug="RenameNotebookError"
            role="alert"
            className="mt-2 text-sm font-semibold text-error dark:text-error"
          >
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
