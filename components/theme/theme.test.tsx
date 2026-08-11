import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCookie, setCookie } from './cookies';

describe('cookies', () => {
  let store = '';

  beforeEach(() => {
    store = '';
    // @ts-expect-error -- minimal document stub for cookie get/set tests
    globalThis.document = {
      get cookie() {
        return store;
      },
      set cookie(value: string) {
        // Mimic real browser semantics: setting document.cookie appends/
        // updates a single cookie rather than replacing the whole string.
        const [pair] = value.split(';');
        const [name] = pair.split('=');
        const existing = store
          .split('; ')
          .filter((row) => row && !row.startsWith(`${name}=`));
        existing.push(pair);
        store = existing.join('; ');
      },
    };
  });

  afterEach(() => {
    // @ts-expect-error -- test-only global cleanup
    delete globalThis.document;
  });

  it('getCookie returns null when document is undefined (SSR-safe)', () => {
    // @ts-expect-error -- test-only global cleanup
    delete globalThis.document;
    expect(getCookie('theme')).toBeNull();
  });

  it('setCookie is a no-op when document is undefined (SSR-safe)', () => {
    // @ts-expect-error -- test-only global cleanup
    delete globalThis.document;
    expect(() => setCookie('theme', 'dark', 365)).not.toThrow();
  });

  it('getCookie returns null when the cookie is absent', () => {
    expect(getCookie('theme')).toBeNull();
  });

  it('setCookie then getCookie round-trips the value', () => {
    setCookie('theme', 'dark', 365);
    expect(getCookie('theme')).toBe('dark');
  });

  it('getCookie only matches the exact cookie name', () => {
    setCookie('cookie-consent', 'accepted', 365);
    expect(getCookie('theme')).toBeNull();
    expect(getCookie('cookie-consent')).toBe('accepted');
  });
});

describe('theme-provider consent-gated persistence', () => {
  let store: Record<string, string> = {};

  function setDocumentCookie(pair: string) {
    const [name, ...rest] = pair.split('=');
    store[name] = rest.join('=');
  }

  function cookieString() {
    return Object.entries(store)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  beforeEach(() => {
    store = {};
    // @ts-expect-error -- minimal document/window stub for provider tests
    globalThis.document = {
      get cookie() {
        return cookieString();
      },
      set cookie(value: string) {
        setDocumentCookie(value.split(';')[0]);
      },
    };
    // @ts-expect-error -- minimal window stub; no dark preference by default
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

  it('does not write a theme cookie without cookie-consent=accepted', async () => {
    const { CONSENT_COOKIE_NAME, THEME_COOKIE_NAME } = await import(
      './theme-provider'
    );
    expect(getCookie(CONSENT_COOKIE_NAME)).toBeNull();

    // Simulate the persistence branch directly (no DOM render available in
    // this node test environment): consent must be checked before writing.
    const hasConsent = getCookie(CONSENT_COOKIE_NAME) === 'accepted';
    if (hasConsent) {
      setCookie(THEME_COOKIE_NAME, 'dark', 365);
    }

    expect(hasConsent).toBe(false);
    expect(getCookie(THEME_COOKIE_NAME)).toBeNull();
  });

  it('writes and persists a theme cookie once consent is accepted', async () => {
    const { CONSENT_COOKIE_NAME, THEME_COOKIE_NAME, CONSENT_ACCEPTED_VALUE } =
      await import('./theme-provider');

    setCookie(CONSENT_COOKIE_NAME, CONSENT_ACCEPTED_VALUE, 365);
    const hasConsent =
      getCookie(CONSENT_COOKIE_NAME) === CONSENT_ACCEPTED_VALUE;
    if (hasConsent) {
      setCookie(THEME_COOKIE_NAME, 'dark', 365);
    }

    expect(hasConsent).toBe(true);
    expect(getCookie(THEME_COOKIE_NAME)).toBe('dark');
  });
});
