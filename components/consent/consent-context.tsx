'use client';

import { createContext, useContext } from 'react';

export type Consent = 'accepted' | 'declined' | null;

export interface ConsentContextValue {
  consent: Consent;
  accept: () => void;
  decline: () => void;
}

export const ConsentContext = createContext<ConsentContextValue | null>(null);

/**
 * Typed access point for reading/setting the visitor's cookie-consent
 * decision. Must be used within a `ConsentProvider` — throws otherwise so
 * misuse fails loudly.
 */
export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);

  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }

  return context;
}
