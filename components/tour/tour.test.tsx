import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hasSeenTour, markTourSeen, resetTour } from './tour-storage';
import { prefersReducedMotion } from '@components/landing/use-scroll-reveal';
import { TOUR_STEPS } from './tour-config';

describe('TOUR_STEPS config (AC-1.6.1)', () => {
  it('defines exactly 4 onboarding walkthrough steps', () => {
    expect(TOUR_STEPS).toHaveLength(4);
  });

  it('covers the 4 required onboarding steps in order', () => {
    // 1. Sources Pane
    expect(TOUR_STEPS[0].element).toBe('#tab-sources');
    expect(TOUR_STEPS[0].popover?.title).toContain('Start with your sources');

    // 2. Grounded Chat Composer
    expect(TOUR_STEPS[1].element).toBe('#tab-chat');
    expect(TOUR_STEPS[1].popover?.title).toContain('Grounded Chat Composer');

    // 3. Original View Showcase Pane
    expect(TOUR_STEPS[2].element).toBe('#tab-showcase');
    expect(TOUR_STEPS[2].popover?.title).toContain('Original View Showcase');

    // 4. Daily Credit Counter & Midnight Expiration Notice
    expect(TOUR_STEPS[3].element).toBe('[data-testid="expiration-banner"]');
    expect(TOUR_STEPS[3].popover?.title).toContain('Credits & Midnight Reset');
  });
});

describe('tour-storage (AC-1.6.2, AC-1.6.3)', () => {
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

  it('markTourSeen then hasSeenTour round-trips true, scoped by userId (AC-1.6.2)', () => {
    markTourSeen('user_1');
    expect(hasSeenTour('user_1')).toBe(true);
    expect(hasSeenTour('user_2')).toBe(false);
  });

  it('resetTour clears a previously-set flag so user can re-trigger tour (AC-1.6.3)', () => {
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
