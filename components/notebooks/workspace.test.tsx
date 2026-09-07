import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Workspace } from './workspace';
import { SourcesDrawer } from './sources-drawer';
import { FloatingBackButton } from './floating-back-button';
import * as clerk from '@clerk/nextjs';
import * as nav from 'next/navigation';

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'user-test-123' }, isLoaded: true }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'nb-123' }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  queryClient.setQueryData(['notebook', 'nb-123'], {
    notebook: {
      id: 'nb-123',
      title: 'Consensus Protocols',
      sourceCount: 3,
      createdAt: '2026-09-07T00:00:00Z',
      expiresAt: '2026-09-08T00:00:00Z',
    },
  });
  queryClient.setQueryData(['sources', 'nb-123'], {
    sources: [
      { id: 'src-1', notebookId: 'nb-123', userId: 'u1', type: 'pdf', title: 'raft.pdf', status: 'ready', size: 100, failReason: null, createdAt: '' },
      { id: 'src-2', notebookId: 'nb-123', userId: 'u1', type: 'youtube', title: 'lecture', status: 'ready', size: 100, failReason: null, createdAt: '' },
      { id: 'src-3', notebookId: 'nb-123', userId: 'u1', type: 'web', title: 'docs', status: 'ready', size: 100, failReason: null, createdAt: '' },
    ],
  });
  return renderToStaticMarkup(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Story 4.5: Responsive Multi-Surface Layouts: Tablet Drawer & Mobile 3-Tab Workspace', () => {
  it('renders Desktop Tri-Pane layout with 3 side-by-side columns (AC-4.1.1 & AC-4.5)', () => {
    const html = renderWithClient(<Workspace viewportMode="desktop" />);

    expect(html).toContain('data-testid="workspace-desktop-tripane"');
    expect(html).toContain('data-testid="desktop-sources-pane"');
    expect(html).toContain('data-testid="desktop-chat-pane"');
    expect(html).toContain('data-testid="desktop-showcase-pane"');
    expect(html).toContain('SOURCES (3/10)');
    expect(html).toContain('ORIGINAL VIEW SHOWCASE');
  });

  it('renders Tablet 2-column layout (50% Chat + 50% Showcase) with Drawer trigger (AC-4.5.1)', () => {
    const html = renderWithClient(<Workspace viewportMode="tablet" />);

    expect(html).toContain('data-testid="workspace-tablet-split"');
    expect(html).toContain('data-testid="tablet-chat-pane"');
    expect(html).toContain('data-testid="tablet-showcase-pane"');
    expect(html).toContain('data-testid="tablet-drawer-trigger"');
    expect(html).toContain('Sources (3/10)');
  });

  it('renders Mobile 3-tab layout with touch targets and count badge (AC-4.5.2)', () => {
    const html = renderWithClient(<Workspace viewportMode="mobile" />);

    expect(html).toContain('data-testid="workspace-mobile-tabs"');
    expect(html).toContain('Sources (3)');
    expect(html).toContain('Chat');
    expect(html).toContain('Showcase');
  });

  it('renders slide-over SourcesDrawer correctly (AC-4.5.1)', () => {
    const html = renderWithClient(
      <SourcesDrawer
        isOpen={true}
        onClose={() => {}}
        notebookId="nb-123"
        sourceCount={3}
      />,
    );

    expect(html).toContain('data-testid="sources-drawer"');
    expect(html).toContain('data-testid="drawer-panel"');
    expect(html).toContain('data-testid="drawer-close-button"');
    expect(html).toContain('Sources (3/10)');
  });

  it('renders sticky floating [← Back to Chat] action button with min 44px touch target (AC-4.5.3 & AC-4.5.4)', () => {
    const html = renderToStaticMarkup(<FloatingBackButton onClick={() => {}} />);

    expect(html).toContain('data-testid="floating-back-button"');
    expect(html).toContain('←');
    expect(html).toContain('Back to Chat');
    expect(html).toContain('min-h-[48px]'); // >= 44px touch target standard
  });
});
