'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNotebook, type NotebookRecord } from './api';

interface CreateNotebookFormProps {
  onCreated?: (notebook: NotebookRecord) => void;
  onCapExceeded?: (count: number, cap: number) => void;
  onCancel?: () => void;
}

/**
 * Inline create-notebook form. Rejects empty/whitespace names inline; surfaces
 * the notebook cap pop-up when a create is blocked server-side with 409.
 */
export function CreateNotebookForm({
  onCreated,
  onCapExceeded,
  onCancel,
}: CreateNotebookFormProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (value: string) => createNotebook(value),
    onSuccess: (data) => {
      setTitle('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      onCreated?.(data.notebook);
    },
    onError: (err) => {
      const e = err as Error & { code?: string; data?: { count?: number; cap?: number } };
      if (e.code === 'NOTEBOOK_CAP_EXCEEDED') {
        onCapExceeded?.(e.data?.count ?? 0, e.data?.cap ?? 0);
      }
      setTitle('');
      setError(null);
      inputRef.current?.focus();
    },
  });

  const trimmed = title.trim();
  const invalid = trimmed.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <form
      onSubmit={handleSubmit}
      noValidate
      data-debug="CreateNotebookForm"
      className="flex flex-col gap-3 p-5 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
    >
      <p className="font-display text-lg text-ink dark:text-ink-dark">New notebook</p>
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Notebook name"
        aria-label="Notebook name"
        aria-invalid={error ? true : undefined}
        data-debug="CreateNotebookInput"
        className="w-full px-3 py-2 min-h-11 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-default placeholder:text-ink-muted dark:placeholder:text-ink-muted-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
      />
      {error && (
        <p
          data-debug="CreateNotebookError"
          role="alert"
          className="text-sm font-semibold text-error dark:text-error"
        >
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            data-debug="CreateNotebookCancel"
            className="min-h-11 px-4 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          data-debug="CreateNotebookSubmit"
          className="min-h-11 px-5 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-brand dark:bg-brand text-ink dark:text-ink-dark rounded-default hover:shadow-card dark:hover:shadow-card-dark disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          {mutation.isPending ? 'Creating…' : 'Create'}
        </button>
      </div>
    </form>
  );
}
