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
 * (paste text / URL), bulk-select remove, and one-click "clear failed". All data
 * flows through TanStack Query — no raw fetch here.
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
    'min-h-11 px-4 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2';
  const primaryBtn =
    'min-h-11 px-5 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-brand dark:bg-brand text-ink dark:text-ink-dark rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2';
  const dangerBtn =
    'min-h-11 px-5 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-error text-white dark:bg-error dark:text-white rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2';

  return (
    <section data-debug="SourcesPanel">
      <div
        data-debug="SourcesPanelHeader"
        className="mb-6 flex flex-wrap items-center justify-between gap-3"
      >
        <p
          data-debug="SourcesCount"
          className="text-sm font-semibold font-sans uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark"
        >
          {sources.length} {sources.length === 1 ? 'source' : 'sources'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {failedCount > 0 && (
            <button
              type="button"
              onClick={() => clearFailedMutation.mutate()}
              disabled={clearFailedMutation.isPending}
              data-debug="ClearFailedButton"
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
            data-debug="AddSourceButton"
            className={secondaryBtn}
          >
            Add source
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div
          data-debug="SourcesBulkBar"
          role="region"
          aria-label="Bulk source selection"
          className="sticky top-4 z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 mb-6 border-2 border-border dark:border-border-dark bg-brand dark:bg-brand shadow-card dark:shadow-card-dark rounded-default"
        >
          <p
            data-debug="SourcesBulkCount"
            className="text-sm font-semibold font-sans uppercase tracking-wider text-ink dark:text-ink-dark"
          >
            {selected.size} {selected.size === 1 ? 'source' : 'sources'} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearSelection}
              data-debug="SourcesBulkClear"
              className={secondaryBtn}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              data-debug="SourcesBulkDelete"
              className={dangerBtn}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div
          data-debug="SourcesPanelLoading"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[0, 1, 2].map((n) => (
            <div
              key={n}
              data-debug={`SourcesSkeleton-${n}`}
              className="h-48 animate-pulse border-2 border-border dark:border-border-dark bg-ink-muted/30 dark:bg-ink-muted-dark/20 rounded-default"
            />
          ))}
        </div>
      ) : isError ? (
        <div
          data-debug="SourcesPanelError"
          className="px-4 py-8 text-center border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
        >
          <p className="text-lg font-semibold text-ink-secondary dark:text-ink-secondary-dark">
            Could not load your sources.
          </p>
          <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
            Please try again shortly.
          </p>
        </div>
      ) : sources.length === 0 ? (
        <div
          data-debug="SourcesEmptyState"
          className="flex flex-col items-center justify-center px-6 py-16 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
        >
          <p className="text-lg font-semibold text-ink-secondary dark:text-ink-secondary-dark">
            This notebook has no sources yet.
          </p>
          <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
            Add sources to ground your research and chat.
          </p>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            data-debug="AddFirstSourceButton"
            className={`${primaryBtn} mt-6`}
          >
            Add your first source
          </button>
        </div>
      ) : (
        <div
          data-debug="SourcesList"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              selected={selected.has(source.id)}
              onToggleSelect={() => toggleSelect(source.id)}
              onRemove={() => setRemoving(source)}
            />
          ))}
        </div>
      )}

      <UploadDialog
        open={uploadOpen}
        notebookId={notebookId}
        onClose={() => setUploadOpen(false)}
      />

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove this source?"
        data-debug="RemoveSourceDialog"
        actions={
          <>
            <button
              type="button"
              onClick={() => setRemoving(null)}
              data-debug="RemoveSourceCancel"
              className={secondaryBtn}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => removing && singleDeleteMutation.mutate(removing.id)}
              disabled={singleDeleteMutation.isPending}
              data-debug="RemoveSourceConfirm"
              className={dangerBtn}
            >
              {singleDeleteMutation.isPending ? 'Removing…' : 'Remove'}
            </button>
          </>
        }
      >
        <p data-debug="RemoveSourceMessage" className="text-ink dark:text-ink-dark">
          &quot;{removing?.title ?? ''}&quot; and its chunks will be removed from
          answers. This cannot be undone.
        </p>
      </Dialog>

      <Dialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Remove selected sources?"
        data-debug="RemoveSourcesBulkDialog"
        actions={
          <>
            <button
              type="button"
              onClick={() => setBulkOpen(false)}
              data-debug="RemoveSourcesBulkCancel"
              className={secondaryBtn}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => bulkDeleteMutation.mutate([...selected])}
              disabled={bulkDeleteMutation.isPending}
              data-debug="RemoveSourcesBulkConfirm"
              className={dangerBtn}
            >
              {bulkDeleteMutation.isPending ? 'Removing…' : `Remove ${selected.size}`}
            </button>
          </>
        }
      >
        <p data-debug="RemoveSourcesBulkMessage" className="text-ink dark:text-ink-dark">
          {selected.size} {selected.size === 1 ? 'source' : 'sources'} and their
          chunks will be removed from answers. This cannot be undone.
        </p>
      </Dialog>
    </section>
  );
}
