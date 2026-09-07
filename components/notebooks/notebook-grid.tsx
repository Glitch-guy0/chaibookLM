'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@components/ui';
import {
  fetchNotebooks,
  deleteNotebook,
  deleteNotebooksBulk,
  type NotebookRecord,
} from './api';
import { NotebookCard } from './notebook-card';
import { CreateNotebookForm } from './create-notebook-form';
import { RenameNotebookDialog } from './rename-notebook-dialog';
import { DeleteNotebookDialog } from './delete-notebook-dialog';
import { BulkDeleteBar } from './bulk-delete-bar';

/**
 * Client dashboard for managing notebooks. All data access goes through TanStack
 * Query hooks — no raw fetch in this component. Handles create, rename, single
 * and bulk delete, the 10-notebook cap warning, TTL-expiry notice and empty state.
 */
export function NotebookGrid() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renaming, setRenaming] = useState<NotebookRecord | null>(null);
  const [deleting, setDeleting] = useState<NotebookRecord | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [capWarning, setCapWarning] = useState<{ count: number; cap: number } | null>(null);
  const [dismissedExpired, setDismissedExpired] = useState<number | null>(null);
  const [seenExpired, setSeenExpired] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notebooks'],
    queryFn: fetchNotebooks,
  });

  const notebooks = data?.notebooks ?? [];
  const expiredRemoved = data?.expiredRemoved ?? 0;

  const showExpiredNotice = !seenExpired && expiredRemoved > 0 && dismissedExpired !== expiredRemoved;

  useEffect(() => {
    if (!seenExpired && expiredRemoved > 0) {
      setSeenExpired(true);
    }
  }, [expiredRemoved, seenExpired]);

  const clearSelection = () => setSelected(new Set());

  const singleDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotebook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      setDeleting(null);
      setSelected((prev) => {
        if (!deleting) return prev;
        const next = new Set(prev);
        next.delete(deleting.id);
        return next;
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteNotebooksBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      setBulkOpen(false);
      clearSelection();
    },
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isCapReached = notebooks.length >= 10;

  const createCell = creating ? (
    <CreateNotebookForm
      onCancel={() => setCreating(false)}
      onCreated={() => setCreating(false)}
      onCapExceeded={(count, cap) => setCapWarning({ count, cap })}
    />
  ) : (
    <button
      type="button"
      onClick={() => setCreating(true)}
      disabled={isCapReached}
      title={isCapReached ? 'Notebook limit reached (max 10 notebooks per user)' : undefined}
      data-testid="new-notebook-card"
      data-debug="NewNotebookCard"
      className="flex min-h-[200px] flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface dark:hover:bg-surface-dark hover:text-ink dark:hover:text-ink-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated dark:disabled:hover:bg-surface-elevated-dark"
    >
      <span aria-hidden="true" className="font-display text-3xl leading-none">
        +
      </span>
      <span className="text-sm font-semibold font-sans uppercase tracking-wider">
        {isCapReached ? 'Limit reached (10 max)' : 'New notebook'}
      </span>
    </button>
  );

  return (
    <section data-debug="NotebookGrid" data-testid="notebook-grid">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-3xl font-display text-ink dark:text-ink-dark">
          Your Notebooks
        </h2>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            disabled={isCapReached}
            title={isCapReached ? 'Notebook limit reached (max 10 notebooks per user)' : undefined}
            data-testid="create-notebook-button"
            data-debug="CreateNotebookButton"
            className="min-h-11 px-5 py-2 text-sm font-semibold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-brand dark:bg-brand text-ink dark:text-ink-dark rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 disabled:opacity-45 disabled:cursor-not-allowed"
          >
            + New Notebook
          </button>
        )}
      </div>

      {/* ── Bulk toolbar ── */}
      {selected.size > 0 && (
        <BulkDeleteBar
          count={selected.size}
          onDelete={() => setBulkOpen(true)}
          onClear={clearSelection}
        />
      )}

      {/* ── Expired notice ── */}
      {showExpiredNotice && (
        <div
          data-debug="ExpiredNotice"
          role="status"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-2 border-border dark:border-border-dark bg-accent-yellow dark:bg-accent-yellow text-ink dark:text-ink-dark rounded-default"
        >
          <p className="text-sm font-semibold">
            {expiredRemoved} {expiredRemoved === 1 ? 'notebook' : 'notebooks'} expired and were
            removed.
          </p>
          <button
            type="button"
            onClick={() => setDismissedExpired(expiredRemoved)}
            data-debug="ExpiredNoticeDismiss"
            className="min-h-11 px-3 py-1 text-xs font-semibold font-sans uppercase tracking-wider underline underline-offset-2 focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-debug="NotebookGridLoading">
          {[0, 1, 2].map((n) => (
            <div
              key={n}
              data-debug={`NotebookGridSkeleton-${n}`}
              className="h-52 animate-pulse border-2 border-border dark:border-border-dark bg-ink-muted/30 dark:bg-ink-muted-dark/20 rounded-default"
            />
          ))}
        </div>
      ) : isError ? (
        <div
          data-debug="NotebookGridError"
          className="px-4 py-8 text-center border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
        >
          <p className="text-lg font-semibold text-ink-secondary dark:text-ink-secondary-dark">
            Could not load your notebooks.
          </p>
          <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
            Please try again shortly.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {createCell}
            {notebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                selected={selected.has(notebook.id)}
                onToggleSelect={() => toggleSelect(notebook.id)}
                onRename={() => setRenaming(notebook)}
                onDelete={() => setDeleting(notebook)}
              />
            ))}
          </div>

          {notebooks.length === 0 && (
            <div
              data-debug="NotebookEmptyState"
              className="mt-8 flex flex-col items-center justify-center px-6 py-12 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
            >
              <p className="text-lg font-semibold text-ink-secondary dark:text-ink-secondary-dark">
                No notebooks yet
              </p>
              <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                Create your first notebook to start reading and researching.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Rename dialog ── */}
      <RenameNotebookDialog notebook={renaming} onClose={() => setRenaming(null)} />

      {/* ── Single delete dialog ── */}
      <DeleteNotebookDialog
        open={deleting !== null}
        title="Delete notebook?"
        message={`"${deleting?.title ?? ''}" and all of its sources and chat will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        isPending={singleDeleteMutation.isPending}
        onConfirm={() => deleting && singleDeleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />

      {/* ── Bulk delete dialog ── */}
      <DeleteNotebookDialog
        open={bulkOpen}
        title="Delete selected notebooks?"
        message={`${selected.size} ${selected.size === 1 ? 'notebook' : 'notebooks'} and all of their sources and chat will be permanently deleted. This cannot be undone.`}
        confirmLabel={`Delete ${selected.size}`}
        isPending={bulkDeleteMutation.isPending}
        onConfirm={() => bulkDeleteMutation.mutate([...selected])}
        onClose={() => setBulkOpen(false)}
      />

      {/* ── Cap warning dialog ── */}
      <Dialog
        open={capWarning !== null}
        onClose={() => setCapWarning(null)}
        title="Notebook limit reached"
        data-debug="CapWarningDialog"
        actions={
          <button
            type="button"
            onClick={() => setCapWarning(null)}
            data-debug="CapWarningDismiss"
            className="min-h-11 px-5 py-2 text-xs font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-brand dark:bg-brand text-ink dark:text-ink-dark rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            Dismiss
          </button>
        }
      >
        <p data-debug="CapWarningMessage" className="text-ink dark:text-ink-dark">
          You have {capWarning?.count ?? 0} of {capWarning?.cap ?? 0} notebooks. Delete a
          notebook before creating another.
        </p>
      </Dialog>
    </section>
  );
}
