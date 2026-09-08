'use client';

import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';

/**
 * Wraps children with ClerkProvider for authentication.
 * Used in (auth) and dashboard routes so Clerk
 * is only loaded on pages that actually need it.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isPlaceholderKey =
    !publishableKey ||
    publishableKey.includes('placeholder') ||
    publishableKey.startsWith('pk_test_eyJpc3MiOiJodHRwczovL2NsZXJr');

  if (isPlaceholderKey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-bg text-fg">
        <div className="w-full max-w-md p-6 sm:p-8 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-[6px_6px_0_0_var(--border,#111111)] dark:shadow-[6px_6px_0_0_var(--border-dark,#E4E4E7)] rounded-sm font-mono text-left">
          <div className="inline-block px-2.5 py-1 bg-accent text-ink font-bold text-xs uppercase tracking-wider mb-4 border border-border">
            ⚡ Clerk Setup Required
          </div>
          <h2 className="text-xl font-bold text-ink dark:text-ink-dark mb-2">Configure Clerk Authentication</h2>
          <p className="font-sans text-sm text-ink-secondary dark:text-ink-secondary-dark leading-relaxed mb-4">
            A valid Clerk publishable key is needed to authenticate sessions. Please provide your real Clerk keys in <code className="bg-bg dark:bg-surface px-1 py-0.5 border border-border text-xs font-mono">.env.local</code>:
          </p>
          <div className="p-3 bg-bg dark:bg-surface border border-border text-[11px] leading-relaxed mb-6 font-mono text-ink-muted dark:text-ink-muted-dark overflow-x-auto">
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...<br />
            CLERK_SECRET_KEY=sk_test_...
          </div>
          <a
            href="https://dashboard.clerk.com/last-active?path=api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-border dark:border-border-dark bg-accent text-ink font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0_0_var(--border,#111111)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
          >
            Get Keys from Clerk Dashboard ↗
          </a>
        </div>
      </div>
    );
  }

  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}