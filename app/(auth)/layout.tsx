import type { ReactNode } from 'react';

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