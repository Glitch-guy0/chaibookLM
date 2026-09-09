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
 * the notebook cap pop-up when a create is blocked server-side with 422.
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
      const e = err as Error & { code?: string; data?: { count?: number; cap?: number }; status?: number };
      if (e.code === 'NOTEBOOK_CAP_EXCEEDED' || e.status === 422) {
        onCapExceeded?.(e.data?.count ?? 0, e.data?.cap ?? 0);
        return;
      }
      setError(e.message ?? 'Failed to create notebook');
      setTitle('');
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
      className="flex flex-col gap-3 p-5 border-2 border-dashed border-border dark:border-border-dark bg-surface dark:bg-surface-dark rounded-[2px]"
    >
      <p className="font-mono text-base font-bold text-ink dark:text-ink-dark uppercase">New Notebook</p>
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Notebook name"
        aria-label="Notebook name"
        aria-invalid={error ? true : undefined}
        className="w-full px-3 py-2 min-h-11 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-[2px] placeholder:text-muted focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2 font-mono text-sm"
      />
      {error && (
        <p
          role="alert"
          className="text-xs font-mono font-bold text-danger"
        >
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-[2px] focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2 cursor-pointer shadow-[2px_2px_0_0_var(--border,#111111)]"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="min-h-11 px-5 py-2 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-accent text-ink rounded-[2px] shadow-[3px_3px_0_0_var(--border,#111111)] hover:shadow-[4px_4px_0_0_var(--border,#111111)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2 cursor-pointer"
        >
          {mutation.isPending ? 'Creating…' : 'Create'}
        </button>
      </div>
    </form>
  );
}
