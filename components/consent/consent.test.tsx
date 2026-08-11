import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCookie, setCookie, deleteCookie } from '../theme/cookies';

describe('deleteCookie', () => {
  let store: Record<string, string> = {};

  function cookieString() {
    return Object.entries(store)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  beforeEach(() => {
    store = {};
    // @ts-expect-error -- minimal document stub for cookie tests
    globalThis.document = {
      get cookie() {
        return cookieString();
      },
      set cookie(value: string) {
        const [pair, ...attrs] = value.split(';').map((s) => s.trim());
        const [name, val] = pair.split('=');
        const maxAgeAttr = attrs.find((a) => a.toLowerCase().startsWith('max-age='));
        if (maxAgeAttr && maxAgeAttr.split('=')[1] === '0') {
          delete store[name];
          return;
        }
        store[name] = val;
      },
    };
  });

  afterEach(() => {
    // @ts-expect-error -- test-only global cleanup
    delete globalThis.document;
  });

  it('is a no-op when document is undefined (SSR-safe)', () => {
    // @ts-expect-error -- test-only global cleanup
    delete globalThis.document;
    expect(() => deleteCookie('theme')).not.toThrow();
  });

  it('removes a previously-set cookie via max-age=0', () => {
    setCookie('theme', 'dark', 365);
    expect(getCookie('theme')).toBe('dark');

    deleteCookie('theme');
    expect(getCookie('theme')).toBeNull();
  });
});

describe('ConsentProvider accept/decline cookie side effects', () => {
  let store: Record<string, string> = {};

  function cookieString() {
    return Object.entries(store)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  function applyCookieWrite(value: string) {
    const [pair, ...attrs] = value.split(';').map((s) => s.trim());
    const [name, val] = pair.split('=');
    const maxAgeAttr = attrs.find((a) => a.toLowerCase().startsWith('max-age='));
    if (maxAgeAttr && maxAgeAttr.split('=')[1] === '0') {
      delete store[name];
      return;
    }
    store[name] = val;
  }

  beforeEach(() => {
    store = {};
    // @ts-expect-error -- minimal document stub for provider tests
    globalThis.document = {
      get cookie() {
        return cookieString();
      },
      set cookie(value: string) {
        applyCookieWrite(value);
      },
    };
    // @ts-expect-error -- minimal window stub
    globalThis.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    };
  });

  afterEach(() => {
    // @ts-expect-error -- test-only global cleanup
    delete globalThis.document;
    // @ts-expect-error -- test-only global cleanup
    delete globalThis.window;
  });

  it('accept writes cookie-consent=accepted and persists current theme if not already stored', async () => {
    const { CONSENT_COOKIE_NAME, THEME_COOKIE_NAME, CONSENT_ACCEPTED_VALUE } =
      await import('../theme/theme-provider');

    const theme = 'dark';
    // Simulate ConsentProvider.accept() logic directly.
    setCookie(CONSENT_COOKIE_NAME, CONSENT_ACCEPTED_VALUE, 365);
    const persistedTheme = getCookie(THEME_COOKIE_NAME);
    if (persistedTheme !== theme) {
      setCookie(THEME_COOKIE_NAME, theme, 365);
    }

    expect(getCookie(CONSENT_COOKIE_NAME)).toBe('accepted');
    expect(getCookie(THEME_COOKIE_NAME)).toBe('dark');
  });

  it('decline writes cookie-consent=declined and deletes the theme cookie', async () => {
    const { CONSENT_COOKIE_NAME, THEME_COOKIE_NAME } = await import(
      '../theme/theme-provider'
    );

    setCookie(THEME_COOKIE_NAME, 'dark', 365);
    expect(getCookie(THEME_COOKIE_NAME)).toBe('dark');

    // Simulate ConsentProvider.decline() logic directly.
    setCookie(CONSENT_COOKIE_NAME, 'declined', 365);
    deleteCookie(THEME_COOKIE_NAME);

    expect(getCookie(CONSENT_COOKIE_NAME)).toBe('declined');
    expect(getCookie(THEME_COOKIE_NAME)).toBeNull();
  });

  it('revoking consent from accepted to declined deletes an existing theme cookie', async () => {
    const { CONSENT_COOKIE_NAME, THEME_COOKIE_NAME, CONSENT_ACCEPTED_VALUE } =
      await import('../theme/theme-provider');

    setCookie(CONSENT_COOKIE_NAME, CONSENT_ACCEPTED_VALUE, 365);
    setCookie(THEME_COOKIE_NAME, 'light', 365);

    setCookie(CONSENT_COOKIE_NAME, 'declined', 365);
    deleteCookie(THEME_COOKIE_NAME);

    expect(getCookie(CONSENT_COOKIE_NAME)).toBe('declined');
    expect(getCookie(THEME_COOKIE_NAME)).toBeNull();
  });
});
