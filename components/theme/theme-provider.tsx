'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './theme-context';
import { getCookie, setCookie } from './cookies';

export const THEME_COOKIE_NAME = 'theme';
export const CONSENT_COOKIE_NAME = 'cookie-consent';
export const CONSENT_ACCEPTED_VALUE = 'accepted';

/**
 * Resolves the theme that should be active right now, mirroring the logic
 * of the blocking inline script in `app/layout.tsx`:
 * - if consent has been given and a `theme` cookie exists, honor it
 * - otherwise fall back to the live `prefers-color-scheme` media query
 * - if `matchMedia` is unavailable (old browsers, SSR), default to light
 */
function resolveTheme(): Theme {
  if (typeof document === 'undefined') {
    return 'light';
  }

  const hasConsent = getCookie(CONSENT_COOKIE_NAME) === CONSENT_ACCEPTED_VALUE;
  if (hasConsent) {
    const stored = getCookie(THEME_COOKIE_NAME);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  }

  if (typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyThemeClass(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Client-side runtime theme engine: keeps React state, the `dark` class on
 * `<html>`, and (consent-permitting) the `theme` cookie all in sync. Pure
 * CSS var + class toggling — never remounts children, so component state
 * survives a theme switch.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('light');

  // Sync React state to whatever the blocking inline script (or live OS
  // preference) already decided, once we're on the client.
  useEffect(() => {
    const resolved = resolveTheme();
    setThemeState(resolved);
    applyThemeClass(resolved);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeClass(next);

    const hasConsent = getCookie(CONSENT_COOKIE_NAME) === CONSENT_ACCEPTED_VALUE;
    if (hasConsent) {
      setCookie(THEME_COOKIE_NAME, next, 365);
    }
    // Without consent, the change is session-visual-only for this page load
    // — no cookie is written, so a fresh load re-derives from prefers-color-scheme.
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
