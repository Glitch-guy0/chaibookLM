import type { ReactNode } from 'react';

/**
 * Clerk's sign-in/sign-up widgets need runtime request context and must not
 * be statically prerendered (root layout no longer forces this globally now
 * that `/` is a public, statically-optimized landing page).
 */
export const dynamic = 'force-dynamic';

/**
 * Auth layout — centered content on cream canvas, no dashboard chrome.
 */
export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}