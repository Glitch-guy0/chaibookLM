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
    <div data-debug="WorkspaceSkeleton" aria-hidden="true">
      <div className="mb-8 h-4 w-40 animate-pulse rounded-default bg-ink-muted/30 dark:bg-ink-muted-dark/20" />
      <div className="mb-8 h-9 w-2/3 max-w-md animate-pulse rounded-default bg-ink-muted/30 dark:bg-ink-muted-dark/20" />
      <div className="flex -space-x-1">
        <div className="h-12 w-32 animate-pulse rounded-t-default border-2 border-border dark:border-border-dark bg-ink-muted/30 dark:bg-ink-muted-dark/20" />
        <div className="h-12 w-32 animate-pulse rounded-t-default border-2 border-border dark:border-border-dark bg-ink-muted/30 dark:bg-ink-muted-dark/20" />
        <div className="h-12 w-32 animate-pulse rounded-t-default border-2 border-border dark:border-border-dark bg-ink-muted/30 dark:bg-ink-muted-dark/20" />
      </div>
      <div className="mt-6 h-40 animate-pulse rounded-default border-2 border-border dark:border-border-dark bg-ink-muted/30 dark:bg-ink-muted-dark/20" />
    </div>
  );
}

/**
 * Notebook Workspace (Story 4.5: Responsive Multi-Surface Layouts)
 * - Desktop (≥1280px): Tri-Pane layout (25% Sources, 45% Chat, 30% Showcase side-by-side)
 * - Tablet (768px - 1279px): 50% Chat + 50% Showcase split, Sources open in slide-over Neo-Brutalist drawer
 * - Mobile (<768px, down to 320px): Single view with 3 top tabs [Sources (N)] | [Chat] | [Showcase] (touch targets ≥ 44px)
 *   - Tapping citation in Chat auto-switches to Showcase
 *   - Sticky floating [← Back to Chat] button docks at bottom center
 *   - Tapping [← Back to Chat] returns to Chat and restores exact scroll position
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

  // Chat scroll position persistence for mobile citation jumping (AC-4.5.5)
  const chatScrollPositionRef = useRef<number>(0);

  const handleOpenCitation = useCallback(
    (citation: CitationSnapshot, citationKey: string) => {
      setOpenCitation(citation);
      setRestoreFocusKey(citationKey);

      if (viewportMode === 'mobile') {
        // Record scroll offset before switching to Showcase tab
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
    <section
      data-debug="Workspace"
      data-testid="workspace-root"
      data-viewport-mode={viewportMode}
      className="mx-auto w-full max-w-7xl px-4 sm:px-6"
    >
      <ExpirationBanner className="mb-6" />

      {/* Top action bar with back link and tablet drawer toggle */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          data-debug="BackToNotebooks"
          className="inline-flex items-center gap-2 text-sm font-semibold font-sans uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark underline underline-offset-2 hover:text-ink dark:hover:text-ink-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          ← Back to notebooks
        </Link>

        {viewportMode === 'tablet' && (
          <button
            type="button"
            data-debug="TabletDrawerTrigger"
            data-testid="tablet-drawer-trigger"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-sm border-2 border-border dark:border-border-dark bg-[#FFE500] px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-ink shadow-[3px_3px_0_0_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
          >
            <span>📑</span>
            <span>Sources ({sourceCount}/10)</span>
          </button>
        )}
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
            className="mb-6 text-2xl sm:text-3xl font-display text-ink dark:text-ink-dark break-words"
          >
            {notebook.title}
          </h2>

          {/* DESKTOP (≥1280px): Tri-Pane 3-Column Split */}
          {viewportMode === 'desktop' && (
            <div
              data-debug="WorkspaceDesktopTriPane"
              data-testid="workspace-desktop-tripane"
              className="grid grid-cols-[280px_1fr_380px] gap-5 min-h-[700px] items-start"
            >
              {/* Pane 1: Sources (25% width / ~280px) */}
              <div
                data-debug="DesktopSourcesPane"
                data-testid="desktop-sources-pane"
                className="flex flex-col gap-2 rounded-default border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 shadow-[4px_4px_0_0_#111111]"
              >
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark pb-2 border-b border-border dark:border-border-dark">
                  SOURCES ({sourceCount}/10)
                </div>
                <SourcesPanel notebookId={id} />
              </div>

              {/* Pane 2: Grounded Chat (45% width) */}
              <div
                data-debug="DesktopChatPane"
                data-testid="desktop-chat-pane"
                className="flex flex-col rounded-default border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 shadow-[4px_4px_0_0_#111111]"
              >
                <ChatPanel
                  notebookId={id}
                  onOpenCitation={handleOpenCitation}
                  restoreFocusKey={restoreFocusKey}
                  onFocusRestored={handleFocusRestored}
                />
              </div>

              {/* Pane 3: Showcase (30% width) */}
              <div
                data-debug="DesktopShowcasePane"
                data-testid="desktop-showcase-pane"
                className="flex flex-col gap-2 rounded-default border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 shadow-[4px_4px_0_0_#111111]"
              >
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark pb-2 border-b border-border dark:border-border-dark">
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
          )}

          {/* TABLET (768px - 1279px): 50% Chat + 50% Showcase 2-column split with Drawer */}
          {viewportMode === 'tablet' && (
            <>
              <div
                data-debug="WorkspaceTabletSplit"
                data-testid="workspace-tablet-split"
                className="grid grid-cols-2 gap-5 min-h-[700px] items-start"
              >
                {/* 50% Chat */}
                <div
                  data-debug="TabletChatPane"
                  data-testid="tablet-chat-pane"
                  className="flex flex-col rounded-default border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 shadow-[4px_4px_0_0_#111111]"
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
                  data-debug="TabletShowcasePane"
                  data-testid="tablet-showcase-pane"
                  className="flex flex-col rounded-default border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 shadow-[4px_4px_0_0_#111111]"
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
            <div data-debug="WorkspaceMobileTabs" data-testid="workspace-mobile-tabs">
              <Tabs
                tabs={mobileTabs}
                label="Mobile workspace sections"
                data-debug="WorkspaceMobileTabsList"
                activeTab={activeTab}
                onTabChange={setActiveTab}
              >
                {(currentTab) => {
                  if (currentTab === 'sources') {
                    return (
                      <div data-debug="MobileSourcesView" data-testid="mobile-sources-view">
                        <SourcesPanel notebookId={id} />
                      </div>
                    );
                  }
                  if (currentTab === 'chat') {
                    return (
                      <div data-debug="MobileChatView" data-testid="mobile-chat-view">
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
                    <div data-debug="MobileShowcaseView" data-testid="mobile-showcase-view">
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
    </section>
  );
}
