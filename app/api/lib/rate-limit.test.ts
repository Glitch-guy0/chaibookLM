import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit, __resetRateLimitForTests } from './rate-limit';

const ORIGINAL_MAX = process.env.RATE_LIMIT_MAX_REQUESTS;
const ORIGINAL_WINDOW = process.env.RATE_LIMIT_WINDOW_MS;

describe('checkRateLimit', () => {
  beforeEach(() => {
    __resetRateLimitForTests();
  });

  afterEach(() => {
    process.env.RATE_LIMIT_MAX_REQUESTS = ORIGINAL_MAX;
    process.env.RATE_LIMIT_WINDOW_MS = ORIGINAL_WINDOW;
    vi.useRealTimers();
  });

  it('ALLOWS_UNDER_THRESHOLD: allows requests while the count stays under the configured max', () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = '3';
    process.env.RATE_LIMIT_WINDOW_MS = '10000';

    expect(checkRateLimit()).toEqual({ allowed: true, retryAfterMs: 0 });
    expect(checkRateLimit()).toEqual({ allowed: true, retryAfterMs: 0 });
    expect(checkRateLimit()).toEqual({ allowed: true, retryAfterMs: 0 });
  });

  it('REJECTS_AT_OR_OVER_THRESHOLD: rejects once count exceeds the max, returning a positive retryAfterMs', () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = '2';
    process.env.RATE_LIMIT_WINDOW_MS = '10000';

    expect(checkRateLimit().allowed).toBe(true);
    expect(checkRateLimit().allowed).toBe(true);
    const result = checkRateLimit();
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(10000);
  });

  it('RESETS_AFTER_WINDOW_ELAPSES: allows a fresh request once the window has elapsed', () => {
    vi.useFakeTimers();
    process.env.RATE_LIMIT_MAX_REQUESTS = '1';
    process.env.RATE_LIMIT_WINDOW_MS = '1000';

    expect(checkRateLimit().allowed).toBe(true);
    expect(checkRateLimit().allowed).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(checkRateLimit().allowed).toBe(true);
  });

  it('FALLS_BACK_ON_MALFORMED_ENV: falls back to the documented defaults when env values are non-numeric', () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = 'abc';
    process.env.RATE_LIMIT_WINDOW_MS = 'not-a-number';

    // Default max is 20 -- 20 allowed calls, the 21st rejected.
    for (let i = 0; i < 20; i += 1) {
      expect(checkRateLimit().allowed).toBe(true);
    }
    const result = checkRateLimit();
    expect(result.allowed).toBe(false);
    // Default window is 10000ms.
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(10000);
  });

  it('FALLS_BACK_ON_NON_POSITIVE_ENV: falls back to the documented defaults when values are zero or negative', () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = '0';
    process.env.RATE_LIMIT_WINDOW_MS = '-500';

    for (let i = 0; i < 20; i += 1) {
      expect(checkRateLimit().allowed).toBe(true);
    }
    expect(checkRateLimit().allowed).toBe(false);
  });

  it('FALLS_BACK_ON_UNSET_ENV: falls back to the documented defaults when env vars are unset', () => {
    delete process.env.RATE_LIMIT_MAX_REQUESTS;
    delete process.env.RATE_LIMIT_WINDOW_MS;

    for (let i = 0; i < 20; i += 1) {
      expect(checkRateLimit().allowed).toBe(true);
    }
    expect(checkRateLimit().allowed).toBe(false);
  });
});
