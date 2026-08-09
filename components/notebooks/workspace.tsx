'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Tabs, type TabItem } from '@components/ui/tabs';
import { fetchNotebook } from './api';

const TABS: TabItem[] = [
  { id: 'sources', label: 'Sources' },
  { id: 'chat', label: 'Chat' },
  { id: 'showcase', label: 'Showcase' },
];

/**
 * Cold-load skeleton matching the tabbed workspace layout.
 */
function WorkspaceSkeleton() {
  return (
    <div data-debug="WorkspaceSkeleton" aria-hidden="true">
      <div className="mb-8 h-4 w-40 animate-pulse rounded-default bg-ink-muted/30 dark:bg-ink-muted-dark/20" />
      <div className="mb-8 h-9 w-2/3 max-w-md animate-pulse rounded-default bg-ink-muted/30 dark:bg-ink-muted-dark/20" />
      <div className="flex -space-x-1">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className="h-12 w-32 min-w-28 sm:min-w-40 animate-pulse rounded-t-default border-2 border-border dark:border-border-dark bg-ink-muted/30 dark:bg-ink-muted-dark/20"
          />
        ))}
      </div>
      <div className="mt-6 h-40 animate-pulse rounded-default border-2 border-border dark:border-border-dark bg-ink-muted/30 dark:bg-ink-muted-dark/20" />
    </div>
  );
}

/**
 * Notebook workspace. Exactly three tabs — Sources | Chat | Showcase — with real
 * tablist semantics (aria-selected, arrow keys), a "Back to notebooks" link,
 * cold-load skeletons and empty states. Content panels are placeholders for
 * Epic 3/4 but the structure, a11y and responsiveness are real.
 */
export function Workspace() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notebook', id],
    queryFn: () => fetchNotebook(id),
    enabled: Boolean(id),
  });

  const notebook = data?.notebook;

  return (
    <section data-debug="Workspace" className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link
          href="/"
          data-debug="BackToNotebooks"
          className="inline-flex items-center gap-2 text-sm font-semibold font-sans uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark underline underline-offset-2 hover:text-ink dark:hover:text-ink-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          ← Back to notebooks
        </Link>
      </div>

      {isError ? (
        <div
          data-debug="WorkspaceError"
          className="flex flex-col items-center justify-center px-6 py-16 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
        >
          <p className="text-lg font-semibold text-ink-secondary dark:text-ink-secondary-dark">
            Notebook not found
          </p>
          <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
            It may have been deleted or you may not have access to it.
          </p>
        </div>
      ) : isLoading || !notebook ? (
        <WorkspaceSkeleton />
      ) : (
        <>
          <h2
            data-debug="WorkspaceTitle"
            className="mb-8 text-3xl font-display text-ink dark:text-ink-dark break-words"
          >
            {notebook.title}
          </h2>

          <Tabs tabs={TABS} label="Notebook sections" data-debug="WorkspaceTabs">
            {(activeTab) => {
              if (activeTab === 'sources') {
                return (
                  <div
                    data-debug="WorkspaceSourcesPanel"
                    className="flex flex-col items-center justify-center px-6 py-16 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
                  >
                    <p className="text-lg font-semibold text-ink-secondary dark:text-ink-secondary-dark">
                      {notebook.sourceCount === 0
                        ? 'This notebook has no sources yet.'
                        : `${notebook.sourceCount} ${
                            notebook.sourceCount === 1 ? 'source' : 'sources'
                          } in this notebook.`}
                    </p>
                    <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                      Add sources to ground your research and chat.
                    </p>
                    <button
                      type="button"
                      data-debug="AddFirstSourceButton"
                      className="mt-6 min-h-11 px-6 py-3 text-sm font-semibold font-sans uppercase tracking-wider border-2 border-border dark:border-border-dark bg-brand dark:bg-brand text-ink dark:text-ink-dark rounded-default focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                    >
                      Add your first source
                    </button>
                  </div>
                );
              }
              if (activeTab === 'chat') {
                return (
                  <div
                    data-debug="WorkspaceChatPanel"
                    className="flex flex-col items-center justify-center px-6 py-16 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
                  >
                    <p className="text-lg font-semibold text-ink-secondary dark:text-ink-secondary-dark">
                      Ask anything about your sources.
                    </p>
                    <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                      Chat will be available here.
                    </p>
                  </div>
                );
              }
              return (
                <div
                  data-debug="WorkspaceShowcasePanel"
                  className="flex flex-col items-center justify-center px-6 py-16 border-2 border-dashed border-ink-muted dark:border-ink-muted-dark bg-surface-elevated dark:bg-surface-elevated-dark rounded-default"
                >
                  <p className="text-lg font-semibold text-ink-secondary dark:text-ink-secondary-dark">
                    Your showcase will appear here.
                  </p>
                  <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                    Showcase is coming in a future update.
                  </p>
                </div>
              );
            }}
          </Tabs>
        </>
      )}
    </section>
  );
}
