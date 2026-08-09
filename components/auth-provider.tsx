'use client';

import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';

/**
 * Wraps children with ClerkProvider for authentication.
 * Used in (auth) and (dashboard) route groups so Clerk
 * is only loaded on pages that actually need it.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}