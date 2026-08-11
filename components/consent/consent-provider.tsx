'use client';

import { useCallback, useLayoutEffect, useState, type ReactNode } from 'react';
import { ConsentContext, type Consent } from './consent-context';
import { deleteCookie, getCookie, setCookie } from '../theme/cookies';
import { useTheme } from '../theme/theme-context';
import {
  CONSENT_ACCEPTED_VALUE,
  CONSENT_COOKIE_NAME,
  THEME_COOKIE_NAME,
} from '../theme/theme-provider';

const CONSENT_DECLINED_VALUE = 'declined';

interface ConsentProviderProps {
  children: ReactNode;
}

/**
 * Client-side consent runtime: reads the `cookie-consent` cookie on mount,
 * and on accept/decline writes the decision plus reconciles the `theme`
 * cookie (persist-on-accept-after-toggle, delete-on-decline).
 */
export function ConsentProvider({ children }: ConsentProviderProps) {
  const [consent, setConsent] = useState<Consent>(null);
  const { theme } = useTheme();

  // useLayoutEffect (not useEffect) so a returning visitor's stored decision
  // is applied before the browser paints, avoiding a visible banner flash.
  useLayoutEffect(() => {
    const stored = getCookie(CONSENT_COOKIE_NAME);
    if (stored === CONSENT_ACCEPTED_VALUE || stored === CONSENT_DECLINED_VALUE) {
      setConsent(stored);
    }
  }, []);

  const accept = useCallback(() => {
    setCookie(CONSENT_COOKIE_NAME, CONSENT_ACCEPTED_VALUE, 365);
    setConsent(CONSENT_ACCEPTED_VALUE);

    const persistedTheme = getCookie(THEME_COOKIE_NAME);
    if (persistedTheme !== theme) {
      setCookie(THEME_COOKIE_NAME, theme, 365);
    }
  }, [theme]);

  const decline = useCallback(() => {
    setCookie(CONSENT_COOKIE_NAME, CONSENT_DECLINED_VALUE, 365);
    setConsent(CONSENT_DECLINED_VALUE);
    deleteCookie(THEME_COOKIE_NAME);
  }, []);

  return (
    <ConsentContext.Provider value={{ consent, accept, decline }}>
      {children}
    </ConsentContext.Provider>
  );
}
