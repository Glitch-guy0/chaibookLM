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
 * Query hooks. Handles create, rename, single and bulk delete, the 10-notebook cap,
 * TTL-expiry notice and empty state.
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
      className="card create flex min-h-[180px] flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-border dark:border-border-dark bg-transparent rounded-[2px] text-muted hover:text-ink dark:hover:text-ink-dark hover:border-ink dark:hover:border-ink-dark transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-[var(--citation)] focus-visible:outline-offset-2"
    >
      <span className="btn primary font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 border-2 border-border dark:border-border-dark rounded-[2px] bg-accent text-[#111111] shadow-[3px_3px_0_0_var(--border)]">
        {isCapReached ? 'Limit reached (10 max)' : '+ New Notebook'}
      </span>
    </button>
  );

  return (
    <section data-testid="notebook-grid">
      {/* ── Hero Strip (mockup-dashboard.html) ── */}
      <div className="mb-8 border-b-2 border-border dark:border-border-dark pb-6">
        <span className="eyebrow font-mono text-xs font-bold uppercase tracking-widest text-muted">
          Research workspace
        </span>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-ink-dark">
              Your notebooks
            </h2>
            <p className="mt-1 font-sans text-sm text-muted">
              Each notebook is a self-contained corpus. Add up to 10 sources, ask questions across them, and verify every answer in the original.
            </p>
          </div>
          {!creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              disabled={isCapReached}
              title={isCapReached ? 'Notebook limit reached (max 10 notebooks per user)' : undefined}
              data-testid="create-notebook-button"
              className="inline-flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider bg-[var(--accent,#FFE500)] text-[#111111] border-2 border-border dark:border-border-dark rounded-[2px] shadow-[4px_4px_0_0_var(--border)] hover:shadow-[6px_6px_0_0_var(--border)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              + New Notebook
            </button>
          )}
        </div>
      </div>

      {/* ── Grid Header (mockup-dashboard.html) ── */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <h3 className="font-mono text-sm font-bold tracking-wider uppercase text-ink dark:text-ink-dark">
          NOTEBOOKS
        </h3>
        <span className="font-mono text-xs text-muted">
          auto-delete @ 12:00 AM Asia/Kolkata
        </span>
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
          role="status"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-2 border-border dark:border-border-dark bg-accent text-ink rounded-[2px] shadow-[3px_3px_0_0_var(--border)]"
        >
          <p className="text-sm font-mono font-bold">
            {expiredRemoved} {expiredRemoved === 1 ? 'notebook' : 'notebooks'} expired and were
            removed.
          </p>
          <button
            type="button"
            onClick={() => setDismissedExpired(expiredRemoved)}
            className="min-h-11 px-3 py-1 text-xs font-bold font-mono uppercase tracking-wider underline underline-offset-2 focus-visible:outline-3 focus-visible:outline-[var(--citation)] focus-visible:outline-offset-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <div
              key={n}
              className="h-52 animate-pulse border-2 border-border dark:border-border-dark bg-muted/20 rounded-[2px]"
            />
          ))}
        </div>
      ) : isError ? (
        <div
          className="px-4 py-8 text-center border-2 border-dashed border-muted bg-surface dark:bg-surface-dark rounded-[2px]"
        >
          <p className="text-lg font-mono font-bold text-ink dark:text-ink-dark">
            Could not load your notebooks.
          </p>
          <p className="mt-2 text-sm text-muted">
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
              className="mt-8 flex flex-col items-center justify-center px-6 py-12 border-2 border-dashed border-muted bg-surface dark:bg-surface-dark rounded-[2px]"
            >
              <p className="text-lg font-mono font-bold text-ink dark:text-ink-dark">
                No notebooks yet
              </p>
              <p className="mt-2 text-sm text-muted">
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
        actions={
          <button
            type="button"
            onClick={() => setCapWarning(null)}
            className="min-h-11 px-5 py-2 text-xs font-bold font-mono uppercase tracking-wider border-2 border-border dark:border-border-dark bg-accent text-ink rounded-[2px] shadow-[2px_2px_0_0_var(--border,#111111)] focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2 cursor-pointer"
          >
            Dismiss
          </button>
        }
      >
        <p className="text-ink dark:text-ink-dark">
          You have {capWarning?.count ?? 0} of {capWarning?.cap ?? 0} notebooks. Delete a
          notebook before creating another.
        </p>
      </Dialog>
    </section>
  );
}
