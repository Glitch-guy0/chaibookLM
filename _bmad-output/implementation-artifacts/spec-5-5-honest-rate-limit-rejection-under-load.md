---
title: 'Honest rate-limit rejection under load'
type: 'feature'
created: '2026-08-11'
status: 'in-review'
review_loop_iteration: 0
followup_review_recommended: false
baseline_revision: '4076cfb67ecd5d9369a1b4b446d88d6d39e4df67'
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md']
warnings: []
---

<intent-contract>

## Intent

**Problem:** No request-rate throttling exists anywhere in the app. The only existing cap system (`backend/src/contexts/limits/index.ts`) is a per-user/per-notebook *resource quota* (max notebooks, max sources) backed by Postgres counters — an unrelated concept. Under real load, AI (chat) and ingestion (source-add) requests have no protection: they'd either queue unboundedly, burn LLM/embedding credits, or fail with a raw/broken error instead of an honest message.

**Approach:** Add a single process-local, in-memory, fixed-window request counter gating the two AI/ingestion write paths (`POST /api/notebooks/[id]/chat`, `POST /api/notebooks/[id]/sources`, `POST /api/notebooks/[id]/search-fetch`), with the threshold read from an env var. When the window's request count is already at or over the threshold, the route returns `429` immediately via the existing `errorResponse()` convention — no queueing, no LLM/embedding call made, so no credit is burned.

## Boundaries & Constraints

**Always:**
- Threshold and window are env-driven: `RATE_LIMIT_MAX_REQUESTS` (integer, requests per window) and `RATE_LIMIT_WINDOW_MS` (integer, milliseconds), both with sensible defaults if unset (`RATE_LIMIT_MAX_REQUESTS=20`, `RATE_LIMIT_WINDOW_MS=10000`) so the guard is active even with no `.env` changes.
- The guard runs as the very first check in each gated route handler, before Clerk auth/ownership checks and before any LLM/embedding/QStash call — a rejected request costs nothing beyond a counter increment.
- On rejection, the response is `429` via `errorResponse('Experiencing high load at this time — try again later.', 'RATE_LIMITED', 429)`, plus a top-level `retryAfterMs` field (matching the existing precedent in `sources/route.ts`'s `SOURCE_CAP_EXCEEDED` 409 response, which also adds extra top-level fields alongside the standard `error` object) so the client can render a retry affordance.
- The counter is a fixed-window counter (count resets when the window elapses), shared process-wide across all users and all three gated routes combined — this protects the app as a whole under load, not per-user (per-user quotas already exist separately via `LimitsService` and are untouched).
- Already-indexed sources, notebook browsing, and any other read-only route remain fully usable while the guard is rejecting write/AI requests — the guard only wraps the three POST routes named above.
- The counter lives in a plain module-level variable (no Redis/Upstash dependency) since the app runs as a single Next.js instance today; this is documented as a known single-instance limitation, not silently pretended to be distributed.

**Block If:** None — the threshold/window naming and defaults are this spec's own design choice with no ambiguity requiring human input.

**Never:**
- Never let a rejected request reach the LLM call, the embedding call, or the QStash enqueue — the check must short-circuit before any of those.
- Never queue rejected requests for later retry server-side (no setTimeout/backoff queue) — the client is told to retry, the server does not remember the rejected attempt.
- No new external dependency (no `@upstash/ratelimit`, no Redis) — process-local in-memory counter only.
- Do not touch `LimitsService` or the per-user/per-notebook resource-cap system — this is a separate, additive guard.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Request count under threshold | Any gated route called | Request proceeds normally, counter increments | No error expected |
| Request count at/over threshold within the current window | Gated route called | `429` with `RATE_LIMITED` code, `retryAfterMs`, no LLM/embedding/QStash call made | Client-facing honest message, no crash |
| Window elapses | Time passes `RATE_LIMIT_WINDOW_MS` since window start | Counter resets to 0, next request starts a fresh window | No error expected |
| Read-only routes (GET chat history, list sources, list notebooks) during rejection | Threshold exceeded | Unaffected — guard is not applied to GET routes | No error expected |
| `RATE_LIMIT_MAX_REQUESTS`/`RATE_LIMIT_WINDOW_MS` unset | Default env | Defaults (`20` requests / `10000`ms) apply | No error expected |
| Malformed env value (non-numeric) | e.g. `RATE_LIMIT_MAX_REQUESTS=abc` | Falls back to the default rather than crashing or disabling the guard | No error expected |

</intent-contract>

## Code Map

- `app/api/lib/rate-limit.ts` (new) -- the in-memory fixed-window counter + `checkRateLimit(): { allowed: boolean; retryAfterMs: number }`
- `app/api/helpers.ts` -- reference only, reused `errorResponse()` convention
- `app/api/notebooks/[id]/chat/route.ts` -- add the guard at the top of `POST`
- `app/api/notebooks/[id]/sources/route.ts` -- add the guard at the top of `POST`
- `app/api/notebooks/[id]/search-fetch/route.ts` -- add the guard at the top of `POST`
- `.env.example` -- document the two new env vars under a new `# ─── Rate Limiting ───` section

## Tasks & Acceptance

**Execution:**
- [x] `app/api/lib/rate-limit.ts` (new) -- module-level fixed-window counter (`{ windowStart: number; count: number }`), `checkRateLimit(): { allowed: boolean; retryAfterMs: number }` that reads `RATE_LIMIT_MAX_REQUESTS`/`RATE_LIMIT_WINDOW_MS` from `process.env` on each call (parsed with `Number.parseInt`, falling back to the defaults on `NaN`), resets the window when elapsed, increments the count, and returns `allowed: false` with `retryAfterMs` (time remaining in the current window) once count exceeds the threshold -- the shared guard primitive
- [x] `app/api/notebooks/[id]/chat/route.ts` -- call `checkRateLimit()` as the first line of `POST`, before `auth()`; on `!allowed`, return `errorResponse(...)` extended with `retryAfterMs` and `status: 429` immediately -- gates the chat/LLM path
- [x] `app/api/notebooks/[id]/sources/route.ts` -- same guard at the top of `POST`, before `auth()`/`sources.create()` -- gates the text/web ingestion path
- [x] `app/api/notebooks/[id]/search-fetch/route.ts` -- same guard at the top of `POST` -- gates the search-fetch ingestion path
- [x] `.env.example` -- add `RATE_LIMIT_MAX_REQUESTS=20` and `RATE_LIMIT_WINDOW_MS=10000` under a new `# ─── Rate Limiting ───` section -- documents the env-driven threshold per AD-12
- [x] `app/api/lib/rate-limit.test.ts` (new, matching existing test conventions -- check how backend/API tests are structured, e.g. under `backend/` or co-located `*.test.ts`) -- unit tests: allows under threshold, rejects at/over threshold with correct `retryAfterMs`, resets after the window elapses (mock/advance time), falls back to defaults on malformed env values -- covers the I/O matrix

**Acceptance Criteria:**
- Given the request count is under the threshold, when a gated route is called, then it behaves exactly as before this story.
- Given the request count is at or over the threshold, when a gated route is called, then it returns `429` with the honest message and a `retryAfterMs`, and no LLM/embedding/QStash call is made for that request.
- Given a rejection has occurred, when the user browses existing notebooks/sources or views chat history, then those read paths are unaffected.
- Given the window elapses, when the next request arrives, then the counter has reset and the request is allowed (assuming it's the only one in the new window).
- Given `RATE_LIMIT_MAX_REQUESTS`/`RATE_LIMIT_WINDOW_MS` are unset or malformed, when the guard runs, then it falls back to the documented defaults rather than crashing or silently disabling the guard.

## Spec Change Log

### 2026-08-11 — Review pass amendment
- Triggering finding: the `Always` clause originally required the rate-limit check to run "before Clerk auth/ownership checks," which review correctly flagged as letting fully unauthenticated requests consume the shared rate-limit budget (since the app's `middleware.ts` deliberately swallows `auth().protect()` failures and relies on each route's own `auth()` check as the real enforcement).
- What was amended: the ordering intent is now "after the route's own `auth()`/userId check, but before any notebook lookup, LLM/embedding call, or QStash enqueue" — this still satisfies the original goal (a rejected request costs nothing beyond a counter increment) without giving anonymous callers a free way to lock out real users.
- Known-bad state avoided: an anonymous, zero-cost request flood exhausting the shared budget and denying service to authenticated users.
- KEEP: everything else — the env-driven threshold/window, the shared process-wide counter design, the `errorResponse()`-shaped 429 with `retryAfterMs`, and the no-queueing/no-external-dependency constraints all worked as specified and are preserved as-is.

## Review Triage Log

### 2026-08-11 — Review pass
- intent_gap: 0
- bad_spec: 1 (medium 1)
- patch: 3 (medium 2, low 1)
- defer: 5 (medium 2, low 3)
- reject: 2 (low 2)
- addressed_findings:
  - `[medium]` `[bad_spec]` The spec's own "before Clerk auth" ordering let unauthenticated requests consume the rate-limit budget; amended per the Spec Change Log above and re-applied directly to the three route call sites (moved the guard to after each route's existing `auth()` check).
  - `[medium]` `[patch]` `RATE_LIMIT_MAX_REQUESTS`/`RATE_LIMIT_WINDOW_MS` set to zero or negative values parsed as valid integers, causing a total lockout (threshold ≤ 0) or silently disabling the guard (window ≤ 0); `parseEnvInt` now falls back to the default for any non-positive value too.
  - `[medium]` `[patch]` The 429 response bypassed the shared `errorResponse()`-style convention and never set a standard `Retry-After` header; added a `rateLimitResponse()` helper used by all three routes, setting `Retry-After` in whole seconds alongside the existing `retryAfterMs` body field.
  - `[low]` `[patch]` Deduplicated the copy-pasted 429-construction block across the three route files into the new shared `rateLimitResponse()` helper.

## Design Notes

The counter is intentionally process-wide (not per-user, not per-route) because AD-12 frames this as protecting the app under aggregate load, not as a per-user fairness mechanism (that's what the separate `LimitsService` resource caps already do). A single module-level variable is sufficient for the current single-instance deployment; scaling to multiple instances would require moving this to Redis/Upstash, which is explicitly out of scope per this story's `Never` clause.

## Verification

**Commands:**
- `npm test` -- expected: new rate-limit tests pass alongside existing suite
- `npm run build` -- expected: succeeds with no new type errors

**Manual checks (if no CLI):**
- Set `RATE_LIMIT_MAX_REQUESTS=1`, hit `POST /api/notebooks/[id]/chat` twice quickly — second request gets `429` with the honest message.
- Wait past `RATE_LIMIT_WINDOW_MS`, retry — request succeeds.
- Confirm GET routes (chat history, sources list) are unaffected during a rejection window.
</content>
