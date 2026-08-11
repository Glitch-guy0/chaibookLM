import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { AuthProvider } from '@components/auth-provider';

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
    userId = session.userId;
  } catch {
    redirect('/sign-in');
  }

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-surface dark:bg-surface-dark">
        {/* ── Header ── */}
        <header
          data-debug="DashboardHeader"
          className="flex items-center justify-between border-b-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark px-6 py-4"
        >
          <h1 className="text-2xl font-display text-ink dark:text-ink-dark tracking-tight">
            chaibookLM
          </h1>

          <div className="flex items-center gap-4">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  userButtonAvatarBox: 'w-9 h-9',
                  userButtonTrigger: 'focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 rounded-full',
                  userButtonPopoverCard: 'bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border dark:border-border-dark shadow-card dark:shadow-card-dark rounded-default',
                  userButtonPopoverActionItem: 'text-ink dark:text-ink-dark text-sm hover:bg-surface dark:hover:bg-surface-dark',
                  userButtonPopoverActionItemText: 'text-ink dark:text-ink-dark',
                  userButtonPopoverFooter: 'hidden',
                },
              }}
            />
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </AuthProvider>
  );
}