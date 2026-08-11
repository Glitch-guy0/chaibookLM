import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hasSeenTour, markTourSeen, resetTour } from './tour-storage';
import { prefersReducedMotion } from '@components/landing/use-scroll-reveal';

describe('tour-storage', () => {
  let store: Record<string, string>;

  function makeLocalStorage() {
    return {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    };
  }

  beforeEach(() => {
    store = {};
    // @ts-expect-error -- minimal window/localStorage stub
    globalThis.window = { localStorage: makeLocalStorage() };
  });

  afterEach(() => {
    // @ts-expect-error -- test-only global cleanup
    delete globalThis.window;
    vi.restoreAllMocks();
  });

  it('hasSeenTour is false when no flag has been set for this user', () => {
    expect(hasSeenTour('user_1')).toBe(false);
  });

  it('markTourSeen then hasSeenTour round-trips true, scoped by userId', () => {
    markTourSeen('user_1');
    expect(hasSeenTour('user_1')).toBe(true);
    expect(hasSeenTour('user_2')).toBe(false);
  });

  it('resetTour clears a previously-set flag', () => {
    markTourSeen('user_1');
    expect(hasSeenTour('user_1')).toBe(true);

    resetTour('user_1');
    expect(hasSeenTour('user_1')).toBe(false);
  });

  it('hasSeenTour fails safe to true when localStorage.getItem throws', () => {
    // @ts-expect-error -- forcing a throwing localStorage for the fail-safe path
    globalThis.window.localStorage = {
      getItem: () => {
        throw new Error('SecurityError: storage disabled');
      },
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(hasSeenTour('user_1')).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  it('markTourSeen does not throw when localStorage.setItem throws', () => {
    // @ts-expect-error -- forcing a throwing localStorage
    globalThis.window.localStorage = {
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => markTourSeen('user_1')).not.toThrow();
    expect(spy).toHaveBeenCalled();
  });

  it('resetTour does not throw when localStorage.removeItem throws', () => {
    // @ts-expect-error -- forcing a throwing localStorage
    globalThis.window.localStorage = {
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => resetTour('user_1')).not.toThrow();
    expect(spy).toHaveBeenCalled();
  });

  it('hasSeenTour fails safe to true when window/localStorage is unavailable (SSR)', () => {
    // @ts-expect-error -- test-only global cleanup
    delete globalThis.window;
    expect(hasSeenTour('user_1')).toBe(true);
  });
});

describe('reduced-motion animate flag computation', () => {
  afterEach(() => {
    // @ts-expect-error -- test-only global cleanup
    delete globalThis.window;
  });

  it('animate is true (motion allowed) when reduced motion is not requested', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: false });
    // @ts-expect-error -- minimal window stub
    globalThis.window = { matchMedia };

    const animate = !prefersReducedMotion();
    expect(animate).toBe(true);
  });

  it('animate is false when prefers-reduced-motion: reduce is set', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    // @ts-expect-error -- minimal window stub
    globalThis.window = { matchMedia };

    const animate = !prefersReducedMotion();
    expect(animate).toBe(false);
  });
});
