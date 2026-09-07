'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@components/ui';
import {
  fetchSources,
  deleteSource,
  deleteSourcesBulk,
  clearFailedSources,
  type SourceRecord,
} from '../notebooks/api';
import { SourceCard } from './source-card';
import { UploadDialog } from './upload-dialog';

interface SourcesPanelProps {
  notebookId: string;
}

/**
 * Sources section for a notebook. Lists sources with live status, offers add
 * (paste text / URL / PDF / YouTube), bulk-select remove, and "clear failed".
 */
export function SourcesPanel({ notebookId }: SourcesPanelProps) {
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<SourceRecord | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sources', notebookId],
    queryFn: () => fetchSources(notebookId),
  });

  const sources = data?.sources ?? [];
  const failedCount = sources.filter((s) => s.status === 'failed').length;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['sources', notebookId] });

  const singleDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteSource(id),
    onSuccess: () => {
      invalidate();
      setRemoving(null);
      setSelected(new Set());
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteSourcesBulk(ids),
    onSuccess: () => {
      invalidate();
      setBulkOpen(false);
      setSelected(new Set());
    },
  });

  const clearFailedMutation = useMutation({
    mutationFn: () => clearFailedSources(notebookId),
    onSuccess: () => invalidate(),
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const secondaryBtn =
    'px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-[2px] shadow-[2px_2px_0_0_var(--border,#111111)] dark:shadow-[2px_2px_0_0_var(--border-dark,#E4E4E7)] hover:shadow-[3px_3px_0_0_var(--border,#111111)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2';
  const primaryBtn =
    'px-3.5 py-1.5 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-[var(--accent,#FFE500)] text-[#111111] rounded-[2px] shadow-[3px_3px_0_0_var(--border,#111111)] dark:shadow-[3px_3px_0_0_var(--border-dark,#E4E4E7)] hover:shadow-[4px_4px_0_0_var(--border,#111111)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2';
  const dangerBtn =
    'px-3.5 py-1.5 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-[var(--danger,#FF3333)] text-white rounded-[2px] shadow-[2px_2px_0_0_var(--border,#111111)] dark:shadow-[2px_2px_0_0_var(--border-dark,#E4E4E7)] hover:shadow-[3px_3px_0_0_var(--border,#111111)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2';

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold font-mono uppercase tracking-wider text-muted">
          {sources.length} {sources.length === 1 ? 'source' : 'sources'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {failedCount > 0 && (
            <button
              type="button"
              onClick={() => clearFailedMutation.mutate()}
              disabled={clearFailedMutation.isPending}
              className={secondaryBtn}
            >
              {clearFailedMutation.isPending
                ? 'Clearing…'
                : `Clear ${failedCount} failed`}
            </button>
          )}
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className={primaryBtn}
          >
            + Add Source
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div
          role="region"
          aria-label="Bulk source selection"
          className="sticky top-4 z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 mb-4 border-2 border-border dark:border-border-dark bg-accent text-ink shadow-[4px_4px_0_0_var(--border,#111111)] rounded-[2px]"
        >
          <p className="text-xs font-bold font-mono uppercase tracking-wider text-ink">
            {selected.size} {selected.size === 1 ? 'source' : 'sources'} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className={secondaryBtn}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className={dangerBtn}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((n) => (
            <div
              key={n}
              className="h-24 animate-pulse border-2 border-border dark:border-border-dark bg-muted/20 rounded-[2px]"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="px-4 py-8 text-center border-2 border-dashed border-muted bg-surface dark:bg-surface-dark rounded-[2px]">
          <p className="text-sm font-mono font-bold text-ink dark:text-ink-dark">
            Could not load your sources.
          </p>
          <p className="mt-1 text-xs text-muted">
            Please try again shortly.
          </p>
        </div>
      ) : sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 border-2 border-dashed border-muted bg-surface dark:bg-surface-dark rounded-[2px] text-center">
          <p className="text-sm font-mono font-bold text-ink dark:text-ink-dark">
            No sources yet
          </p>
          <p className="mt-1 text-xs text-muted max-w-xs">
            Add documents, links, or videos to ground your queries with citations.
          </p>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className={`${primaryBtn} mt-4`}
          >
            + Add First Source
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              selected={selected.has(source.id)}
              onToggleSelect={() => toggleSelect(source.id)}
              onRemove={() => setRemoving(source)}
              onRetry={() => invalidate()}
            />
          ))}
        </div>
      )}

      <UploadDialog
        open={uploadOpen}
        notebookId={notebookId}
        onClose={() => setUploadOpen(false)}
        currentSourceCount={sources.length}
      />

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Delete this source?"
        actions={
          <>
            <button
              type="button"
              onClick={() => setRemoving(null)}
              className={secondaryBtn}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => removing && singleDeleteMutation.mutate(removing.id)}
              disabled={singleDeleteMutation.isPending}
              className={dangerBtn}
            >
              {singleDeleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-ink dark:text-ink-dark font-sans text-sm">
          &quot;{removing?.title ?? ''}&quot; and its chunks will be removed from
          answers. This cannot be undone.
        </p>
      </Dialog>

      <Dialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Remove selected sources?"
        actions={
          <>
            <button
              type="button"
              onClick={() => setBulkOpen(false)}
              className={secondaryBtn}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => bulkDeleteMutation.mutate([...selected])}
              disabled={bulkDeleteMutation.isPending}
              className={dangerBtn}
            >
              {bulkDeleteMutation.isPending ? 'Removing…' : `Remove ${selected.size}`}
            </button>
          </>
        }
      >
        <p className="text-ink dark:text-ink-dark font-sans text-sm">
          {selected.size} {selected.size === 1 ? 'source' : 'sources'} and their
          chunks will be removed from answers. This cannot be undone.
        </p>
      </Dialog>
    </section>
  );
}
