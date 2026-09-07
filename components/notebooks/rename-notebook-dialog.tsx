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
 * rename leaves the notebook's previous name untouched.
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
      title="Rename Notebook"
      initialFocusRef={saveRef}
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
            ref={saveRef}
            type="submit"
            form="rename-notebook-form"
            disabled={mutation.isPending}
            className="min-h-11 px-5 py-2 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-accent text-ink rounded-[2px] shadow-[3px_3px_0_0_var(--border,#111111)] hover:shadow-[4px_4px_0_0_var(--border,#111111)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2 cursor-pointer"
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="rename-notebook-form" onSubmit={handleSubmit} noValidate>
        <label
          htmlFor="rename-notebook-input"
          className="block text-xs font-mono font-bold uppercase tracking-wider text-muted mb-2"
        >
          Notebook Name
        </label>
        <input
          ref={inputRef}
          id="rename-notebook-input"
          type="text"
          value={title}
          onChange={(e) => handleChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          className="w-full px-3 py-2 min-h-11 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-[2px] placeholder:text-muted focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2 font-mono text-sm"
        />
        {error && (
          <p
            role="alert"
            className="mt-2 text-xs font-mono font-bold text-danger"
          >
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
