'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@components/ui';
import {
  createTextSource,
  createWebSource,
  createPdfSource,
  createTranscriptSource,
  createYoutubeSource,
  type SourceType,
} from '../notebooks/api';

interface UploadDialogProps {
  open: boolean;
  notebookId: string;
  onClose: () => void;
  currentSourceCount?: number;
}

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_TRANSCRIPT_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_SOURCES_PER_NOTEBOOK = 10;

/**
 * 5-tabbed intake modal with client-side file and quota validation (AC-2.1.1 - AC-2.1.4):
 * - Text
 * - Web URL
 * - PDF Dropzone (rejected if > 10MB)
 * - Transcript (.srt/.vtt) (rejected if > 5MB)
 * - YouTube URL (keyless caption intake)
 * Enforces quota limit warning and disables submissions when notebook has >= 10 sources.
 */
export function UploadDialog({
  open,
  notebookId,
  onClose,
  currentSourceCount = 0,
}: UploadDialogProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<SourceType>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  const textRef = useRef<HTMLTextAreaElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isQuotaExceeded = currentSourceCount >= MAX_SOURCES_PER_NOTEBOOK;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['sources', notebookId] });

  const mutation = useMutation({
    mutationFn: async () => {
      const trimmedTitle = title.trim() || undefined;
      switch (mode) {
        case 'text':
          return createTextSource(notebookId, {
            title: trimmedTitle,
            content: text,
          });
        case 'web':
          return createWebSource(notebookId, {
            title: trimmedTitle,
            url,
          });
        case 'pdf':
          return createPdfSource(notebookId, {
            title: trimmedTitle || fileName,
            content: fileContent,
          });
        case 'transcript':
          return createTranscriptSource(notebookId, {
            title: trimmedTitle || fileName,
            content: fileContent || text,
          });
        case 'youtube':
          return createYoutubeSource(notebookId, {
            title: trimmedTitle,
            url,
          });
      }
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
    setFileContent('');
    setFileName('');
    setError(null);
    setLimitWarning(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, maxBytes: number, label: string) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxBytes) {
      setError(`${label} exceeds ${maxBytes / (1024 * 1024)}MB limit`);
      e.target.value = '';
      setFileName('');
      setFileContent('');
      return;
    }

    setFileName(file.name);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setFileContent(result);
      }
    };
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLimitWarning(null);

    if (isQuotaExceeded) {
      setError('Quota limit reached: This notebook already has 10 sources.');
      return;
    }

    if (mode === 'text') {
      if (!text.trim()) {
        setError('Text is required');
        textRef.current?.focus();
        return;
      }
    } else if (mode === 'web') {
      const trimmed = url.trim();
      if (!trimmed) {
        setError('Enter a URL');
        urlRef.current?.focus();
        return;
      }
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setError('Please enter a valid URL');
          urlRef.current?.focus();
          return;
        }
      } catch {
        setError('Please enter a valid URL');
        urlRef.current?.focus();
        return;
      }
    } else if (mode === 'pdf') {
      if (!fileContent) {
        setError('Please select a PDF file');
        fileInputRef.current?.focus();
        return;
      }
    } else if (mode === 'transcript') {
      if (!fileContent && !text.trim()) {
        setError('Please upload a .srt/.vtt file or paste transcript text');
        return;
      }
    } else if (mode === 'youtube') {
      const trimmed = url.trim();
      if (!trimmed) {
        setError('Please enter a YouTube URL');
        urlRef.current?.focus();
        return;
      }
      try {
        const parsed = new URL(trimmed);
        const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
        if (host !== 'youtube.com' && host !== 'youtu.be') {
          setError('Please enter a valid YouTube URL');
          urlRef.current?.focus();
          return;
        }
      } catch {
        setError('Please enter a valid YouTube URL');
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
      'flex-1 min-h-11 px-2 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 transition-colors',
      active
        ? 'bg-brand dark:bg-brand text-ink dark:text-ink-dark shadow-[2px_2px_0_0_var(--color-ink)]'
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
            disabled={mutation.isPending || isQuotaExceeded}
            data-debug="UploadDialogSubmit"
            data-testid="upload-submit"
            className="min-h-11 px-5 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-brand dark:bg-brand text-ink dark:text-ink-dark rounded-default disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 shadow-[2px_2px_0_0_var(--color-ink)]"
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
        {isQuotaExceeded && (
          <div
            data-debug="UploadDialogQuotaWarning"
            data-testid="upload-quota-warning"
            role="alert"
            className="px-4 py-3 border-2 border-border dark:border-border-dark bg-accent-yellow dark:bg-accent-yellow text-ink dark:text-ink-dark rounded-default font-semibold text-xs"
          >
            ⚠️ Quota Limit Reached: This notebook already has 10 sources. Remove a source to add more.
          </div>
        )}

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Source type">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'text'}
            onClick={() => setModeSafe('text')}
            data-debug="UploadDialogTextTab"
            data-testid="upload-tab-text"
            className={tabClass(mode === 'text')}
          >
            Text
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'web'}
            onClick={() => setModeSafe('web')}
            data-debug="UploadDialogWebTab"
            data-testid="upload-tab-web"
            className={tabClass(mode === 'web')}
          >
            Web URL
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'pdf'}
            onClick={() => setModeSafe('pdf')}
            data-debug="UploadDialogPdfTab"
            data-testid="upload-tab-pdf"
            className={tabClass(mode === 'pdf')}
          >
            PDF Dropzone
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'transcript'}
            onClick={() => setModeSafe('transcript')}
            data-debug="UploadDialogTranscriptTab"
            data-testid="upload-tab-transcript"
            className={tabClass(mode === 'transcript')}
          >
            Transcript (.srt/.vtt)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'youtube'}
            onClick={() => setModeSafe('youtube')}
            data-debug="UploadDialogYoutubeTab"
            data-testid="upload-tab-youtube"
            className={tabClass(mode === 'youtube')}
          >
            YouTube URL
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
          placeholder={mode === 'text' ? 'Title of this source' : 'Source Title'}
          data-debug="UploadDialogTitle"
          className={inputClass}
        />

        {mode === 'text' && (
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
        )}

        {mode === 'web' && (
          <label
            htmlFor="upload-source-url"
            className="flex flex-col gap-1 text-xs font-mono uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
          >
            Page URL (Firecrawl Scrape)
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

        {mode === 'pdf' && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="upload-source-pdf"
              className="flex flex-col gap-1 text-xs font-mono uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
            >
              PDF Document (Max 10MB)
            </label>
            <div className="p-6 border-2 border-dashed border-border dark:border-border-dark rounded-default bg-surface dark:bg-surface-dark text-center flex flex-col items-center justify-center gap-2">
              <input
                id="upload-source-pdf"
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                data-testid="upload-pdf-input"
                onChange={(e) => handleFileChange(e, MAX_PDF_BYTES, 'PDF')}
                className="block w-full text-xs font-mono text-ink-secondary dark:text-ink-secondary-dark file:mr-4 file:py-2 file:px-4 file:rounded-default file:border-2 file:border-border file:bg-brand file:text-xs file:font-semibold file:uppercase"
              />
              {fileName && <p className="text-xs font-mono text-ink dark:text-ink-dark mt-1">Selected: {fileName}</p>}
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Pure-JS extraction with page anchors (&lt;!-- page: N --&gt;)</p>
            </div>
          </div>
        )}

        {mode === 'transcript' && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="upload-source-transcript"
              className="flex flex-col gap-1 text-xs font-mono uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
            >
              Transcript (.srt/.vtt file - Max 5MB)
            </label>
            <input
              id="upload-source-transcript"
              type="file"
              accept=".srt,.vtt,text/plain"
              data-testid="upload-transcript-input"
              onChange={(e) => handleFileChange(e, MAX_TRANSCRIPT_BYTES, 'Transcript')}
              className="block w-full text-xs font-mono text-ink-secondary dark:text-ink-secondary-dark file:mr-4 file:py-2 file:px-4 file:rounded-default file:border-2 file:border-border file:bg-brand file:text-xs file:font-semibold file:uppercase"
            />
            {fileName && <p className="text-xs font-mono text-ink dark:text-ink-dark">Selected: {fileName}</p>}
            <p className="text-xs font-mono text-ink-secondary dark:text-ink-secondary-dark mt-1">Or paste transcript text directly:</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="1&#10;00:00:01,000 --> 00:00:04,000&#10;Dialogue excerpt..."
              rows={4}
              className={`${inputClass} resize-y font-sans normal-case tracking-normal`}
            />
          </div>
        )}

        {mode === 'youtube' && (
          <label
            htmlFor="upload-source-youtube"
            className="flex flex-col gap-1 text-xs font-mono uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
          >
            YouTube Video URL
            <input
              id="upload-source-youtube"
              ref={urlRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              aria-invalid={error && mode === 'youtube' ? true : undefined}
              data-debug="UploadDialogYoutubeInput"
              data-testid="upload-youtube-input"
              className={`${inputClass} font-sans normal-case tracking-normal`}
            />
            <span className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">
              Keyless subtitle extraction with timestamp anchors (&lt;!-- time: mm:ss --&gt;)
            </span>
          </label>
        )}

        {error && (
          <p
            data-debug="UploadDialogError"
            data-testid="upload-error"
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

// Named alias for AddSourceModal as per AC-2.1.1
export const AddSourceModal = UploadDialog;
