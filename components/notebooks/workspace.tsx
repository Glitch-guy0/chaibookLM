'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Tabs, type TabItem } from '@components/ui/tabs';
import { fetchNotebook, fetchSources, type CitationSnapshot } from './api';
import { SourcesPanel } from '@components/sources/sources-panel';
import { ChatPanel } from '@components/chat/chat-panel';
import { ShowcasePanel } from './showcase-panel';
import { SourcesDrawer } from './sources-drawer';
import { FloatingBackButton } from './floating-back-button';
import { ExpirationBanner } from './expiration-banner';
import { useProductTour } from '@components/tour/use-product-tour';

export type ViewportMode = 'mobile' | 'tablet' | 'desktop';

export function useViewportMode(overrideMode?: ViewportMode): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>(overrideMode ?? 'desktop');

  useEffect(() => {
    if (overrideMode) {
      setMode(overrideMode);
      return;
    }
    const updateMode = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setMode('mobile');
      } else if (width < 1280) {
        setMode('tablet');
      } else {
        setMode('desktop');
      }
    };
    updateMode();
    window.addEventListener('resize', updateMode);
    return () => window.removeEventListener('resize', updateMode);
  }, [overrideMode]);

  return mode;
}

interface WorkspaceProps {
  /** Optional viewport mode override for testing or fixed surface rendering */
  viewportMode?: ViewportMode;
}

/**
 * Cold-load skeleton matching workspace layout.
 */
function WorkspaceSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-8 h-4 w-40 animate-pulse rounded-[2px] bg-muted/20" />
      <div className="mb-8 h-9 w-2/3 max-w-md animate-pulse rounded-[2px] bg-muted/20" />
      <div className="flex -space-x-1">
        <div className="h-12 w-32 animate-pulse rounded-t-[2px] border-2 border-border dark:border-border-dark bg-muted/20" />
        <div className="h-12 w-32 animate-pulse rounded-t-[2px] border-2 border-border dark:border-border-dark bg-muted/20" />
        <div className="h-12 w-32 animate-pulse rounded-t-[2px] border-2 border-border dark:border-border-dark bg-muted/20" />
      </div>
      <div className="mt-6 h-40 animate-pulse rounded-[2px] border-2 border-border dark:border-border-dark bg-muted/20" />
    </div>
  );
}

/**
 * Notebook Workspace
 * - Desktop (≥1280px): Tri-Pane layout (26% Sources, 44% Chat, 30% Showcase side-by-side)
 * - Tablet (768px - 1279px): 50% Chat + 50% Showcase split, Sources open in slide-over Neo-Brutalist drawer
 * - Mobile (<768px, down to 320px): Single view with 3 top tabs [Sources (N)] | [Chat] | [Showcase]
 */
export function Workspace({ viewportMode: overrideMode }: WorkspaceProps = {}) {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const searchParams = useSearchParams();
  const { user } = useUser();
  const viewportMode = useViewportMode(overrideMode);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notebook', id],
    queryFn: () => fetchNotebook(id),
    enabled: Boolean(id),
  });

  const notebook = data?.notebook;

  useProductTour(user?.id, {
    ready: Boolean(notebook),
    autoReplay: searchParams?.get('tour') === 'replay',
  });

  const sourcesQuery = useQuery({
    queryKey: ['sources', id],
    queryFn: () => fetchSources(id),
    enabled: Boolean(id),
  });

  const sourceCount = sourcesQuery.data?.sources.length ?? notebook?.sourceCount ?? 0;

  const [activeTab, setActiveTab] = useState('chat');
  const [openCitation, setOpenCitation] = useState<CitationSnapshot | null>(null);
  const [restoreFocusKey, setRestoreFocusKey] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Chat scroll position persistence for mobile citation jumping
  const chatScrollPositionRef = useRef<number>(0);

  const handleOpenCitation = useCallback(
    (citation: CitationSnapshot, citationKey: string) => {
      setOpenCitation(citation);
      setRestoreFocusKey(citationKey);

      if (viewportMode === 'mobile') {
        chatScrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
        setActiveTab('showcase');
      }
    },
    [viewportMode],
  );

  const handleShowcaseEsc = useCallback(() => {
    if (viewportMode === 'mobile') {
      setActiveTab('chat');
      setTimeout(() => {
        window.scrollTo({ top: chatScrollPositionRef.current, behavior: 'instant' });
      }, 30);
    }
  }, [viewportMode]);

  const handleBackToChat = useCallback(() => {
    setActiveTab('chat');
    setTimeout(() => {
      window.scrollTo({ top: chatScrollPositionRef.current, behavior: 'instant' });
    }, 30);
  }, []);

  const handleFocusRestored = useCallback(() => {
    setRestoreFocusKey(null);
  }, []);

  const mobileTabs: TabItem[] = useMemo(
    () => [
      { id: 'sources', label: `Sources (${sourceCount})` },
      { id: 'chat', label: 'Chat' },
      { id: 'showcase', label: 'Showcase' },
    ],
    [sourceCount],
  );

  return (
    <div
      data-testid="workspace-root"
      data-viewport-mode={viewportMode}
      className="flex flex-col min-h-screen bg-bg text-fg"
    >
      {/* ── Full-width Auto-deletion Banner (mockup-workspace-desktop.html) ── */}
      <ExpirationBanner />

      {/* ── Workspace Breadcrumb Topbar ── */}
      <div className="border-b-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 sm:px-6 py-2.5">
        <div className="mx-auto w-full max-w-7xl flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              data-testid="crumb-back"
              className="inline-flex items-center gap-1 font-bold text-muted hover:text-ink dark:hover:text-ink-dark no-underline focus-visible:outline-2 focus-visible:outline-[var(--citation)]"
            >
              ← Notebooks
            </Link>
            <span className="text-muted">/</span>
            <span className="font-bold text-ink dark:text-ink-dark truncate max-w-md">
              {notebook?.title ?? 'Consensus Protocols'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {viewportMode === 'tablet' && (
              <button
                type="button"
                data-testid="tablet-drawer-trigger"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-2 rounded-[2px] border-2 border-border dark:border-border-dark bg-accent px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-ink shadow-[2px_2px_0_0_var(--border)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none cursor-pointer"
              >
                <span>📑</span>
                <span>Sources ({sourceCount}/10)</span>
              </button>
            )}
            <span className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 border-2 border-border dark:border-border-dark bg-bg text-muted cursor-not-allowed opacity-65 rounded-[2px]">
              Share · soon
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-4">
        {isError ? (
          <div
            className="flex flex-col items-center justify-center px-6 py-16 border-2 border-dashed border-border dark:border-border-dark bg-surface dark:bg-surface-dark rounded-[2px]"
          >
            <p className="text-lg font-mono font-bold text-ink dark:text-ink-dark">
              Notebook not found
            </p>
            <p className="mt-2 text-sm text-muted">
              It may have been deleted or you may not have access to it.
            </p>
          </div>
        ) : isLoading || !notebook ? (
          <WorkspaceSkeleton />
        ) : (
          <>
            <h2 className="sr-only">
              {notebook.title}
            </h2>

            {/* DESKTOP (≥1280px): Tri-Pane 3-Column Split (mockup-workspace-desktop.html) */}
            {viewportMode === 'desktop' && (
              <div
                data-testid="workspace-desktop-tripane"
                className="grid grid-cols-[25%_45%_30%] border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-[6px_6px_0_0_var(--border)] divide-x-2 divide-border dark:divide-border-dark min-h-[750px] h-[calc(100vh-140px)] items-stretch rounded-[2px] overflow-hidden"
              >
                {/* Pane 1: Sources (25% width) */}
                <div
                  data-testid="desktop-sources-pane"
                  className="pane flex flex-col min-h-0 bg-surface dark:bg-surface-dark"
                >
                  <div className="pane-head font-mono text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark p-3 border-b-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark flex items-center justify-between">
                    <span>SOURCES ({sourceCount}/10)</span>
                  </div>
                  <div className="pane-scroll p-3 flex-1 overflow-y-auto min-h-0">
                    <SourcesPanel notebookId={id} />
                  </div>
                </div>

                {/* Pane 2: Grounded Chat (45% width) */}
                <div
                  data-testid="desktop-chat-pane"
                  className="pane flex flex-col min-h-0 bg-surface dark:bg-surface-dark"
                >
                  <div className="pane-head font-mono text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark p-3 border-b-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark flex items-center justify-between">
                    <span>GROUNDED CHAT</span>
                    <span className="font-mono text-[10px] text-muted lowercase tracking-normal">
                      queries draw from credits
                    </span>
                  </div>
                  <div className="pane-scroll p-4 flex-1 flex flex-col justify-between overflow-y-auto min-h-0">
                    <ChatPanel
                      notebookId={id}
                      onOpenCitation={handleOpenCitation}
                      restoreFocusKey={restoreFocusKey}
                      onFocusRestored={handleFocusRestored}
                    />
                  </div>
                </div>

                {/* Pane 3: Showcase (30% width) */}
                <div
                  data-testid="desktop-showcase-pane"
                  className="pane flex flex-col min-h-0 bg-surface dark:bg-surface-dark"
                >
                  <div className="pane-head font-mono text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark p-3 border-b-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
                    ORIGINAL VIEW SHOWCASE
                  </div>
                  <div className="pane-scroll p-3 flex-1 overflow-y-auto min-h-0">
                    <ShowcasePanel
                      citation={openCitation}
                      sources={sourcesQuery.data?.sources ?? []}
                      sourcesLoading={sourcesQuery.isLoading}
                      onEsc={handleShowcaseEsc}
                    />
                  </div>
                </div>
              </div>
            )}

          {/* TABLET (768px - 1279px): 50% Chat + 50% Showcase 2-column split with Drawer */}
          {viewportMode === 'tablet' && (
            <>
              <div
                data-testid="workspace-tablet-split"
                className="grid grid-cols-2 gap-5 min-h-[700px] items-start"
              >
                {/* 50% Chat */}
                <div
                  data-testid="tablet-chat-pane"
                  className="flex flex-col rounded-[2px] border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 shadow-[4px_4px_0_0_var(--border,#111111)]"
                >
                  <ChatPanel
                    notebookId={id}
                    onOpenCitation={handleOpenCitation}
                    restoreFocusKey={restoreFocusKey}
                    onFocusRestored={handleFocusRestored}
                  />
                </div>

                {/* 50% Showcase */}
                <div
                  data-testid="tablet-showcase-pane"
                  className="flex flex-col rounded-[2px] border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 shadow-[4px_4px_0_0_var(--border,#111111)]"
                >
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark pb-2 border-b border-border dark:border-border-dark mb-3">
                    ORIGINAL VIEW SHOWCASE
                  </div>
                  <ShowcasePanel
                    citation={openCitation}
                    sources={sourcesQuery.data?.sources ?? []}
                    sourcesLoading={sourcesQuery.isLoading}
                    onEsc={handleShowcaseEsc}
                  />
                </div>
              </div>

              {/* Slide-over Sources Drawer */}
              <SourcesDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                notebookId={id}
                sourceCount={sourceCount}
              />
            </>
          )}

          {/* MOBILE (<768px): 3 Top Tabs [Sources (N)] | [Chat] | [Showcase] */}
          {viewportMode === 'mobile' && (
            <div data-testid="workspace-mobile-tabs">
              <Tabs
                tabs={mobileTabs}
                label="Mobile workspace sections"
                activeTab={activeTab}
                onTabChange={setActiveTab}
              >
                {(currentTab) => {
                  if (currentTab === 'sources') {
                    return (
                      <div data-testid="mobile-sources-view">
                        <SourcesPanel notebookId={id} />
                      </div>
                    );
                  }
                  if (currentTab === 'chat') {
                    return (
                      <div data-testid="mobile-chat-view">
                        <ChatPanel
                          notebookId={id}
                          onOpenCitation={handleOpenCitation}
                          restoreFocusKey={restoreFocusKey}
                          onFocusRestored={handleFocusRestored}
                        />
                      </div>
                    );
                  }
                  return (
                    <div data-testid="mobile-showcase-view">
                      <ShowcasePanel
                        citation={openCitation}
                        sources={sourcesQuery.data?.sources ?? []}
                        sourcesLoading={sourcesQuery.isLoading}
                        onEsc={handleShowcaseEsc}
                      />
                    </div>
                  );
                }}
              </Tabs>

              {/* Sticky Floating [← Back to Chat] button active when on Showcase tab */}
              {activeTab === 'showcase' && (
                <FloatingBackButton onClick={handleBackToChat} />
              )}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
