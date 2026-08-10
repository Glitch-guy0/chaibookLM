'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@components/ui';
import {
  createTextSource,
  createWebSource,
  type SourceType,
} from '../notebooks/api';

interface UploadDialogProps {
  open: boolean;
  notebookId: string;
  onClose: () => void;
}

/**
 * Focus-trapped upload dialog with two paths: paste text or enter a URL. Empty
 * text and malformed URLs are rejected inline; a server-side limit rejection is
 * surfaced as a warning listing the limit and current count. On success the
 * dialog resets and closes, and the sources list is refreshed.
 */
export function UploadDialog({ open, notebookId, onClose }: UploadDialogProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<SourceType>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['sources', notebookId] });

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === 'text') {
        return createTextSource(notebookId, {
          title: title.trim() || undefined,
          content: text,
        });
      }
      return createWebSource(notebookId, {
        title: title.trim() || undefined,
        url,
      });
    },
    onSuccess: () => {
      invalidate();
      reset();
      onClose();
    },
    onError: (err) => {
      const e = err as Error & {
        code?: string;
        data?: { count?: number; cap?: number; error?: { message?: string } };
      };
      if (e.code === 'SOURCE_CAP_EXCEEDED') {
        const message = e.data?.error?.message ?? 'Source limit reached';
        const count = e.data?.count;
        const cap = e.data?.cap;
        setLimitWarning(
          typeof count === 'number' && typeof cap === 'number'
            ? `${message} You have ${count} of ${cap} sources.`
            : message,
        );
      } else {
        setError(e.message || 'Could not add the source. Please try again.');
      }
    },
  });

  const reset = () => {
    setText('');
    setUrl('');
    setTitle('');
    setError(null);
    setLimitWarning(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLimitWarning(null);
    if (mode === 'text') {
      if (!text.trim()) {
        setError('Text is required');
        textRef.current?.focus();
        return;
      }
    } else {
      const trimmed = url.trim();
      if (!trimmed) {
        setError('Enter a URL');
        urlRef.current?.focus();
        return;
      }
      let parsed: URL;
      try {
        parsed = new URL(trimmed);
      } catch {
        setError('Please enter a valid URL');
        urlRef.current?.focus();
        return;
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError('Please enter a valid URL');
        urlRef.current?.focus();
        return;
      }
    }
    mutation.mutate();
  };

  const setModeSafe = (next: SourceType) => {
    setMode(next);
    setError(null);
    setLimitWarning(null);
  };

  const inputClass =
    'w-full px-3 py-2 min-h-11 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-default placeholder:text-ink-muted dark:placeholder:text-ink-muted-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2';
  const tabClass = (active: boolean) =>
    [
      'flex-1 min-h-11 px-4 py-2 text-sm font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2',
      active
        ? 'bg-brand dark:bg-brand text-ink dark:text-ink-dark'
        : 'bg-surface dark:bg-surface-dark text-ink-secondary dark:text-ink-secondary-dark',
    ].join(' ');

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Add a source"
      data-debug="UploadDialog"
      actions={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={mutation.isPending}
            data-debug="UploadDialogCancel"
            className="min-h-11 px-4 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="upload-source-form"
            disabled={mutation.isPending}
            data-debug="UploadDialogSubmit"
            className="min-h-11 px-5 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-brand dark:bg-brand text-ink dark:text-ink-dark rounded-default disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            {mutation.isPending ? 'Adding…' : 'Add source'}
          </button>
        </>
      }
    >
      <form
        id="upload-source-form"
        onSubmit={handleSubmit}
        noValidate
        data-debug="UploadDialogForm"
        className="flex flex-col gap-3"
      >
        <div className="flex gap-2" role="tablist" aria-label="Source type">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'text'}
            onClick={() => setModeSafe('text')}
            data-debug="UploadDialogTextTab"
            className={tabClass(mode === 'text')}
          >
            Paste text
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'web'}
            onClick={() => setModeSafe('web')}
            data-debug="UploadDialogWebTab"
            className={tabClass(mode === 'web')}
          >
            URL
          </button>
        </div>

        <label
          htmlFor="upload-source-title"
          className="text-xs font-mono uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
        >
          Title (optional)
        </label>
        <input
          id="upload-source-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={mode === 'text' ? 'Title of this source' : 'https://example.com'}
          data-debug="UploadDialogTitle"
          className={inputClass}
        />

        {mode === 'text' ? (
          <label
            htmlFor="upload-source-text"
            className="flex flex-col gap-1 text-xs font-mono uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
          >
            Text content
            <textarea
              id="upload-source-text"
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the text you want to ground your research in…"
              rows={7}
              aria-invalid={error && mode === 'text' ? true : undefined}
              data-debug="UploadDialogTextArea"
              className={`${inputClass} resize-y font-sans normal-case tracking-normal`}
            />
          </label>
        ) : (
          <label
            htmlFor="upload-source-url"
            className="flex flex-col gap-1 text-xs font-mono uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
          >
            Page URL
            <input
              id="upload-source-url"
              ref={urlRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              aria-invalid={error && mode === 'web' ? true : undefined}
              data-debug="UploadDialogUrlInput"
              className={`${inputClass} font-sans normal-case tracking-normal`}
            />
          </label>
        )}

        {error && (
          <p
            data-debug="UploadDialogError"
            role="alert"
            className="text-sm font-semibold text-[var(--color-error)] dark:text-[var(--color-error-dark)]"
          >
            {error}
          </p>
        )}

        {limitWarning && (
          <div
            data-debug="UploadDialogLimitWarning"
            role="alert"
            className="px-4 py-3 border-2 border-border dark:border-border-dark bg-accent-yellow dark:bg-accent-yellow text-ink dark:text-ink-dark rounded-default"
          >
            <p className="text-sm font-semibold">{limitWarning}</p>
          </div>
        )}
      </form>
    </Dialog>
  );
}
