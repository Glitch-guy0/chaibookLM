/**
 * Process-local, in-memory fixed-window request-rate guard for the app's
 * AI/ingestion write paths (chat, sources, search-fetch). Not a per-user
 * quota -- that's LimitsService's job, untouched by this module. Shared
 * process-wide across all users and all gated routes combined, per AD-12
 * and spec-5-5. Single-instance limitation: this counter is not distributed
 * (no Redis/Upstash); scaling to multiple instances would require moving
 * this state to a shared store.
 */

import { NextResponse } from 'next/server';

const DEFAULT_MAX_REQUESTS = 20;
const DEFAULT_WINDOW_MS = 10000;

let windowStart = Date.now();
let count = 0;

function parseEnvInt(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  // A zero/negative threshold would reject every request outright, and a
  // zero/negative window would reset on every call and silently disable
  // rate limiting entirely -- both are config typos, not valid settings.
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

/**
 * Checks and increments the shared fixed-window counter. Reads the
 * threshold/window from `process.env` on every call so tests (and ops) can
 * change them at runtime. When the window has elapsed since `windowStart`,
 * it resets to a fresh window before counting this request.
 */
export function checkRateLimit(): RateLimitResult {
  const maxRequests = parseEnvInt(process.env.RATE_LIMIT_MAX_REQUESTS, DEFAULT_MAX_REQUESTS);
  const windowMs = parseEnvInt(process.env.RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS);

  const now = Date.now();
  if (now - windowStart >= windowMs) {
    windowStart = now;
    count = 0;
  }

  count += 1;

  if (count > maxRequests) {
    const retryAfterMs = Math.max(0, windowStart + windowMs - now);
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Test-only helper to reset the module-level counter state between test
 * cases, since the counter is a shared module-level variable by design.
 */
export function __resetRateLimitForTests(): void {
  windowStart = Date.now();
  count = 0;
}

/**
 * Builds the standard 429 response for a rejected `RateLimitResult`, reusing
 * the app's `errorResponse()` envelope shape (`{ error: { message, code } }`)
 * plus a top-level `retryAfterMs` field, and setting the standard HTTP
 * `Retry-After` header (in whole seconds, rounded up) so standards-compliant
 * clients/proxies get a usable backoff signal too.
 */
export function rateLimitResponse(result: RateLimitResult) {
  const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
  return NextResponse.json(
    {
      error: {
        message: 'Experiencing high load at this time — try again later.',
        code: 'RATE_LIMITED',
      },
      retryAfterMs: result.retryAfterMs,
    },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  );
}
