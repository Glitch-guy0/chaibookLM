---
title: 'Story 4.4 — Refuse Honestly and Offer Approval-Gated Fetch-on-Refusal'
type: 'feature'
created: '2026-08-10'
status: 'done'
baseline_revision: 2c1058d282e074896900d4f9c5b2505b3eaffb54
final_revision: 276b976e99ba84875519e25212f0d6db159ba08d
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** `ChatService.ask()` already produces a structural refusal (`NOT_IN_SOURCES_ANSWER`, when retrieval returns zero chunks) but represents it as an ordinary `done` event with no explicit marker, and the client renders it as plain markdown text indistinguishable from a normal answer — no "Not in your sources." framing, no way to search the web for it. `WebSearchTool.searchWeb` and `JinaAdapter.query` are both unimplemented stubs (`throw new Error('Not implemented')`); there is no server-side path that turns a user's approval into new indexed sources.

**Approach:** Add an explicit `refusal: true` field to `ChatService.ask()`'s refusal-path `done` event (never string-matching) and stream it to the client via a `CHAT_REFUSAL:` trailer, mirroring the existing `CHAT_CITATIONS:`/`CHAT_ERROR:` sentinel pattern. `ChatPanel` renders a refusal turn with "Not in your sources." plus a single "Find related web pages" button instead of markdown content. Implement `JinaAdapter.query` against jina's `s.jina.ai` search endpoint (top-5 results) and `WebSearchTool.searchWeb`. Add a `FetchOnRefusalService.approve(notebookId, userId, query)` that runs the search, creates a Web Source per result through the existing `SourceService.create` (so per-notebook/per-user caps apply identically to any other source), and — deviating from `SourceService.create`'s normal fire-and-forget ingestion, since this is a rare, explicitly user-approved action rather than the hot path — awaits each created source's ingestion to settle before responding, so the reported count reflects sources that actually got created (not just the search results returned). Wire this behind a new `POST /api/notebooks/[id]/search-fetch` route and a pending → "Added N sources" → retryable-failure UI on the refusal turn.

## Boundaries & Constraints

**Always:**
- Refusal is detected via the explicit `refusal: true` field `ChatService.ask()` sets on its zero-retrieved-chunks `done` event — never by comparing `fullText` against the `NOT_IN_SOURCES_ANSWER` string constant, on either the server or the client.
- The model never invokes web search itself — `WebSearchTool.searchWeb`/`JinaAdapter.query` are only ever called from the new `POST /api/notebooks/[id]/search-fetch` route, triggered exclusively by the user clicking "Find related web pages" (AD-13).
- Every page the search returns is created as a Web Source via the existing `SourceService.create(...)` call (not a new/parallel creation path), so it is subject to the exact same per-notebook (`maxSourcesPerNotebook`) and per-user (`maxSourcesPerUser`) caps as any manually-added source; cap rejections for individual candidates are skipped silently (not surfaced as separate errors) and simply reduce the final "Added N sources" count.
- The fetch-on-refusal route awaits each created source's ingestion (`SourceIndexer.index`, already an awaitable promise) to settle before responding — the reported count and "Added N sources" announcement reflect settled creation, not just an enqueued/fire-and-forget response.
- If zero sources end up created (search itself throws, search returns no results, or every candidate is rejected by caps), the refusal UI is restored with a retryable "Try again" button and no partial/inconsistent state is left visible.
- While a fetch-on-refusal is pending for a turn, the composer is disabled (same gate as an in-flight chat turn) so a second question can't be sent mid-fetch.
- All new interactive elements carry a unique `data-debug` name, consistent with the rest of the app.

**Block If:**
- None identified — additive on top of Story 4.1's refusal path and Epic 3's existing `SourceService`/`LimitsService` infrastructure.

**Never:**
- No auto-retry of the original question after a successful fetch — the AC only requires that "subsequent answers may cite" the newly added sources, not that this turn automatically re-asks itself. The user asks again manually.
- No citation-attach/click-through or fetch-on-refusal telemetry — no telemetry infrastructure exists yet (same call made in Stories 4.2/4.3); do not fabricate a call that logs nowhere meaningful.
- No changes to `CitationMapper`, `ShowcasePanel`, or the citation marker syntax (Stories 4.2/4.3's scope).
- No paginated chat history changes (Story 4.5).
- No new search provider/adapter beyond jina's `s.jina.ai` endpoint (matches the epic's documented technical decision).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| REFUSAL_SHOWN | A question whose retrieval returns zero chunks (below `minScore`/`topK` gate) | "Not in your sources." renders with a single "Find related web pages" button; zero citation markers | none |
| APPROVE_SUCCESS | User clicks the button; search returns results and ≥1 is successfully created + indexed | Pending state, then "Added N sources"; new sources appear in the Sources section | none |
| APPROVE_ZERO_RESULTS | Search succeeds but returns no results | Refusal UI restored with a "No related pages found." message and a retryable "Try again" button; no sources created | Treated as a clean no-op, not an error |
| APPROVE_SEARCH_FAILS | The jina search call throws (network/API error) | Refusal UI restored with "Try again"; no sources created | Error swallowed into the retryable state, not surfaced as a raw exception |
| APPROVE_ALL_CAPPED | Search succeeds but every candidate is rejected by the per-notebook/per-user cap | Refusal UI restored with a cap-specific message (reusing the existing "source limit reached" wording) and no retry button (retrying won't help until the user frees up capacity) | none |
| APPROVE_PARTIAL | Search returns 5 results; 3 succeed, 2 are capped or fail to create | "Added 3 sources" -- the actual settled count, never the raw search-result count | none |
| CONCURRENT_QUESTION_BLOCKED | User attempts to send a new question while a fetch-on-refusal is pending | Composer stays disabled until the fetch settles (same gate as an in-flight answer) | none |

</intent-contract>

## Code Map

- `backend/src/ports/search.ts` -- no change (existing `Search`/`SearchResult` shape already fits).
- `backend/src/adapters/jina/index.ts` -- implement `JinaAdapter.query(q)`: `GET https://s.jina.ai/{encodeURIComponent(q)}` with `X-Return-Format: markdown` (or `Accept: application/json` if jina's search endpoint supports structured JSON -- verify against jina's documented response shape and parse into `SearchResult[]`, else parse the markdown result list), same `JINA_API_KEY` bearer-auth convention as `fetchReader`, top-5 results, clear thrown errors on non-2xx/empty (mirroring `fetchReader`'s existing error conventions).
- `backend/src/templates/WebSearchTool.ts` -- implement `searchWeb(q)`: delegates to `this.search.query(q)`, returns `SearchResult[]` (fix the current `Promise<unknown[]>` return type to the real `SearchResult[]`).
- `backend/src/contexts/chat/index.ts` -- add `refusal?: boolean` to `ChatTurnEvent`; set `refusal: true` on the existing zero-chunks `done` event (the `chunks.length === 0` branch already at line ~159-168).
- `backend/src/contexts/fetch-on-refusal/index.ts` -- NEW `FetchOnRefusalService`: `approve(notebookId, userId, query)` calls `webSearchTool.searchWeb(query)`, creates a Web Source per result via the injected `SourceService.create`, awaits `SourceIndexer.index` for each created source, and returns `{ ok: true, added: number } | { ok: false, reason: 'search_failed' | 'no_results' | 'capped' }`.
- `app/api/notebooks/[id]/search-fetch/route.ts` -- NEW `POST`: auth + notebook ownership check (mirrors `app/api/notebooks/[id]/sources/route.ts`), body `{ query: string }`, calls `FetchOnRefusalService.approve`, returns the result as JSON.
- `app/api/notebooks/[id]/chat/route.ts` -- add a `CHAT_REFUSAL_SENTINEL = 'CHAT_REFUSAL:'` trailer (mirroring `CHAT_CITATIONS_SENTINEL`), appended when the `done` event carries `refusal: true`.
- `components/notebooks/api.ts` -- extend `streamChatMessage`'s sentinel scan to also detect `CHAT_REFUSAL:`, adding `refusal?: boolean` to `StreamChatResult`; add `approveFetchOnRefusal(notebookId, query): Promise<{ok:true, added:number} | {ok:false, reason:string}>` calling the new route.
- `components/chat/chat-panel.tsx` -- add `refusal?: boolean` and `fetchOnRefusal?: { status: 'idle'|'pending'|'done'|'failed', added?: number, reason?: string }` to `Turn`; on `result.refusal`, set the turn's `refusal` flag instead of treating it as normal markdown content; render a new conditional block (alongside the existing `status === 'failed'` retry block) showing the button/pending/result states, gated on `turn.refusal && turn.status === 'done'`; disable the composer while any turn's `fetchOnRefusal.status === 'pending'`.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/adapters/jina/index.ts` -- implement `query()` against `s.jina.ai`, top-5 `SearchResult[]`, matching `fetchReader`'s auth/error conventions.
- [x] `backend/src/templates/WebSearchTool.ts` -- implement `searchWeb()` delegating to `Search.query`, fix return type to `SearchResult[]`.
- [x] `backend/src/contexts/chat/index.ts` -- add `refusal: true` to the zero-chunks `done` event.
- [x] `backend/src/contexts/fetch-on-refusal/index.ts` -- NEW `FetchOnRefusalService.approve`: search → per-result `SourceService.create` (cap-aware) → await ingestion settle → return `{ok, added}` or a typed failure reason.
- [x] `app/api/notebooks/[id]/search-fetch/route.ts` -- NEW `POST` route wiring `FetchOnRefusalService.approve` with auth/ownership handling.
- [x] `app/api/notebooks/[id]/chat/route.ts` -- `CHAT_REFUSAL:` trailer on a refusal `done` event.
- [x] `components/notebooks/api.ts` -- parse `CHAT_REFUSAL:` into `StreamChatResult.refusal`; add `approveFetchOnRefusal` client call.
- [x] `components/chat/chat-panel.tsx` -- refusal-turn rendering (button → pending → "Added N sources"/error+retry), composer disabled while pending.
- [x] Unit test edge cases from the I/O matrix at the `ChatService`/`FetchOnRefusalService` level (refusal flag set correctly; search-fails/zero-results/all-capped/partial-success outcomes).

**Acceptance Criteria:**
- Given a question the notebook's chunks cannot support, when no retrieved chunk clears `minScore`, then the answer is "Not in your sources." with zero fabricated citations and a single "Find related web pages" button.
- Given the fetch-on-refusal offer, when the user approves, then `WebSearchTool` runs via the server (the model never invokes it) and results re-enter through the existing `SourceIndexer`/`SourceService` path, counting against the same per-notebook/per-user limits as any other source.
- Given the fetch running, when new pages are indexed, then a pending state is shown, completion announces "Added N sources", and the new sources appear in the Sources section.
- Given a fetch failure (search error, zero results, or every candidate capped), when it resolves, then the refusal state is restored with an appropriate message, no sources are added, and the notebook is never left in a half-fetched/inconsistent state.

## Design Notes

Refusal-as-explicit-event vs. string-matching: Story 4.1 already defined `NOT_IN_SOURCES_ANSWER` as a magic-string convention checked nowhere except where it's produced. Formalizing it as a `refusal: true` field (rather than having the client string-match `fullText`) avoids a second in-band-string fragility class alongside the already-deferred `CHAT_ERROR:`/`CHAT_CITATIONS:` sentinel-collision risk (see `deferred-work.md`) and is a one-line, low-risk addition since `ChatTurnEvent` is a plain discriminated-ish object, not a wire format.

`s.jina.ai` response shape is unverified in this codebase (only `r.jina.ai`'s reader endpoint has prior art here). If `s.jina.ai` doesn't return clean structured JSON with `X-Return-Format: markdown` requested, `JinaAdapter.query` may need to parse a markdown-formatted result list (jina's search reader typically returns numbered `[Title](url)\n> snippet` blocks) instead of assuming a JSON array -- implementer should probe the actual response format during implementation and adapt the parsing accordingly; the `SearchResult[]` return contract (`title`, `url`, `content`) stays fixed regardless of which parsing path is needed.

Awaiting ingestion synchronously in the approval route is a deliberate deviation from `SourceService.create`'s existing fire-and-forget `void this.indexer.index(...).catch(() => {})` convention (used for the interactive single-source-add path, where the UI doesn't want to block on ingestion). Fetch-on-refusal is a rarer, already-pending-state action where "Added N sources" needs to reflect real outcomes, so blocking here is the right tradeoff -- do not change `SourceService.create`'s own fire-and-forget behavior to match; call `SourceIndexer.index` directly and await it per created source from within `FetchOnRefusalService`.

## Verification

**Commands:**
- `npm run typecheck` -- expected: no type errors.
- `npm run build` -- expected: production build succeeds with all routes, including `/api/notebooks/[id]/search-fetch`.
- `npm test` -- expected: all tests pass, including new `FetchOnRefusalService`/refusal-flag cases.

**Manual checks (if no CLI):**
- Ask a question unrelated to any indexed source; confirm "Not in your sources." with the "Find related web pages" button, no citation chips.
- Click the button; confirm a pending state, then "Added N sources", and that the new sources appear (with normal `queued → processing → ready` status) in the Sources tab.
- Trigger a case where the per-notebook cap is already at/near its limit; confirm the reported count reflects only what actually got created.

## Review Triage Log

### 2026-08-11 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 5: (medium N2, low N3)
- defer: 1: (low N1)
- reject: 8: (low N8)
- addressed_findings:
  - `[medium]` `[patch]` `FetchOnRefusalService.approve` mislabeled every zero-added outcome as `'capped'` (suppressing the retry button) even when the underlying cause was an unexpected create-path exception (e.g. DB failure) rather than a genuine cap/size rejection. Fixed: track whether any candidate failed via exception vs. `ok:false`; report `'search_failed'` (retryable) unless every failure was a true cap/size rejection.
  - `[medium]` `[patch]` No deduplication of search results by URL before creating sources — duplicate/near-duplicate jina results would create duplicate Web Sources and inflate the "Added N" count while needlessly consuming cap headroom. Fixed: dedupe by `result.url` via a `Set` before the create loop.
  - `[low]` `[patch]` `parseSearchMarkdown` (the most format-fragile piece of this change, per its own Design Notes caveat about the unverified `s.jina.ai` response shape) had zero test coverage. Fixed: added `backend/src/adapters/jina/__tests__/jina-adapter.test.ts` covering well-formed blocks, out-of-order indices, missing-title/missing-url skip behavior, missing-Description defaulting, and garbage/empty input.
  - `[low]` `[patch]` The `search-fetch` route validated `query.trim()` for emptiness but forwarded the untrimmed `query` to `FetchOnRefusalService.approve`, so leading/trailing whitespace reached the jina search call inconsistently with the validation. Fixed: pass `query.trim()` through.
  - `[low]` `[patch]` `ChatPanel`'s "Find related web pages" button had no guard against a double-click firing `approveFetch` twice before the pending state re-render committed. Fixed: `approveFetch` now early-returns if the turn's `fetchOnRefusal.status` is already `'pending'`.
- Deferred to `deferred-work.md`: the `CHAT_REFUSAL:` sentinel scan in `components/notebooks/api.ts` extends the same tail-buffered sentinel-matching scheme already used for `CHAT_ERROR:`/`CHAT_CITATIONS:`, and therefore inherits the same pre-existing sentinel-collision risk already on record — not a new risk introduced by this story, so no code change here.
- Rejected as spec-compliant or out-of-scope: swallowing search-failure detail into a generic retryable state (explicitly required by the I/O matrix); top-5 cap enforced only in `JinaAdapter` (no second adapter exists, per spec's "no new search provider" constraint); counting a created-but-failed-to-index source as "added" (the spec's own wording is "sources that actually got created," which indexing failure doesn't unwind, consistent with the rest of the app's tolerance for async indexing failure); raw-URL title fallback (harmless, not in the I/O matrix); `encodeURIComponent` path-segment URL construction (mirrors the existing `fetchReader` convention already in this codebase).

## Auto Run Result

Status: done

**Summary:** Implemented Story 4.4 end-to-end: an explicit `refusal: true` flag on `ChatService.ask()`'s zero-retrieved-chunks event, streamed to the client via a `CHAT_REFUSAL:` trailer; a real `JinaAdapter.query`/`WebSearchTool.searchWeb` against `s.jina.ai`; a new `FetchOnRefusalService` that turns an approved search into Web Sources via the existing `SourceService.create` (cap-aware, deduped by URL) with awaited ingestion; a `POST /api/notebooks/[id]/search-fetch` route; and `ChatPanel`/`components/notebooks/api.ts` client wiring for the button → pending → "Added N sources" / retryable-failure UI, with the composer gated while a fetch is pending.

**Files changed:**
- `backend/src/adapters/jina/index.ts` — implemented `query()` and `parseSearchMarkdown()`.
- `backend/src/templates/WebSearchTool.ts` — implemented `searchWeb()`, fixed return type to `SearchResult[]`.
- `backend/src/contexts/chat/index.ts` — added `refusal: true` on the zero-chunks `done` event.
- `backend/src/contexts/fetch-on-refusal/index.ts` — new `FetchOnRefusalService.approve` (search → dedupe → cap-aware create → await index → typed result).
- `app/api/notebooks/[id]/search-fetch/route.ts` — new `POST` route (auth/ownership + trimmed query).
- `app/api/notebooks/[id]/chat/route.ts` — `CHAT_REFUSAL:` trailer.
- `app/api/lib/backend.ts` — wired `FetchOnRefusalService` into the backend factory.
- `components/notebooks/api.ts` — `CHAT_REFUSAL:` sentinel parsing, `approveFetchOnRefusal` client call.
- `components/chat/chat-panel.tsx` — refusal-turn rendering, pending/done/failed states, double-click guard, composer gating.
- `backend/src/contexts/chat/__tests__/chat-service.test.ts` — refusal-flag cases.
- `backend/src/contexts/fetch-on-refusal/__tests__/fetch-on-refusal-service.test.ts` — new, covers the full I/O matrix plus dedup and capped-vs-search_failed distinction.
- `backend/src/adapters/jina/__tests__/jina-adapter.test.ts` — new, covers `parseSearchMarkdown` edge cases.

**Review findings breakdown:** 5 patches applied (2 medium: capped/search_failed mislabeling, missing URL dedup; 3 low: missing parser tests, untrimmed query, double-click guard), 1 deferred (sentinel-collision risk extension, pre-existing pattern), 8 rejected (spec-compliant or out-of-scope).

**Verification:** `npm run typecheck` — pass. `npm run build` — pass, `/api/notebooks/[id]/search-fetch` listed among built routes. `npm test` — 5 test files, 43 tests, all pass.

**Residual risks:** `s.jina.ai`'s actual response format was never verified against a live call (no network access in this environment) — `parseSearchMarkdown` is implemented and tested against the documented/assumed markdown shape but should be spot-checked against a real response post-deploy. The pre-existing in-band sentinel-collision risk (now three sentinels deep) remains deferred, tracked in `deferred-work.md`.
