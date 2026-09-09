import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { AuthProvider } from '@components/auth-provider';
import { ThemeToggle } from '@components/theme/theme-toggle';
import { CreditBadge } from '@components/ui/credit-badge';

/**
 * Dashboard subtree requires per-request auth context (Clerk session lookup,
 * redirect on missing session), so it must always render dynamically.
 */
export const dynamic = 'force-dynamic';

/**
 * Dashboard layout — protected route shell with header and auth.
 * Redirects unauthenticated users to /sign-in.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.userId ?? null;
  } catch (err) {
    console.error('[DashboardLayout] auth() error:', err);
    redirect('/sign-in');
  }

  if (!userId) {
    console.log('[DashboardLayout] userId is null, redirecting to /sign-in');
    redirect('/sign-in');
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-bg text-fg">
        {/* ── Topbar (mockup-dashboard.html) ── */}
        <header
          className="sticky top-0 z-40 border-b-2 border-border dark:border-border-dark bg-bg/95 backdrop-blur-sm"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <a
              href="/dashboard"
              className="flex items-center gap-2.5 font-mono text-base font-bold tracking-tight text-ink dark:text-ink-dark no-underline"
            >
              <span
                className="inline-grid place-items-center h-7 w-7 border-2 border-border dark:border-border-dark bg-accent text-ink shadow-[2px_2px_0_0_var(--border,#111111)]"
                aria-hidden="true"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 8h6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              CONTEXTUAL
            </a>

            <div className="flex items-center gap-3">
              <CreditBadge />
              <ThemeToggle />
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-8 h-8 rounded-sm border-2 border-border dark:border-border-dark shadow-[2px_2px_0_0_var(--border,#111111)]',
                    userButtonTrigger: 'focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2',
                    userButtonPopoverCard: 'bg-surface dark:bg-surface-dark border-2 border-border dark:border-border-dark shadow-[6px_6px_0_0_var(--border,#111111)] rounded-sm font-sans',
                    userButtonPopoverActionItem: 'text-ink dark:text-ink-dark text-sm hover:bg-bg dark:hover:bg-surface',
                    userButtonPopoverActionItemText: 'text-ink dark:text-ink-dark font-mono text-xs',
                    userButtonPopoverFooter: 'hidden',
                  },
                }}
              />
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1">{children}</main>
      </div>
    </AuthProvider>
  );
}