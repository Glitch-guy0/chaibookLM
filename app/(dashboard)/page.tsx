import { Button } from '@components/ui';

export default function DashboardPage() {
  return (
    <section data-debug="DashboardPage" className="mx-auto max-w-5xl">
      {/* ── Header Row ── */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-display text-ink dark:text-ink-dark">
          Your Notebooks
        </h2>

        <Button
          variant="primary"
          data-debug="CreateNotebookButton"
        >
          Create Notebook
        </Button>
      </div>

      {/* ── Empty State ── */}
      <div className="flex flex-col items-center justify-center rounded-default border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark px-6 py-16">
        <p className="text-lg font-semibold text-ink-secondary dark:text-ink-secondary-dark">
          No notebooks yet
        </p>
        <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
          Create your first notebook to start reading and researching.
        </p>
      </div>

      {/* ── Placeholder Notebook Grid (populated in Epic 2) ── */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Notebook cards will render here */}
      </div>
    </section>
  );
}