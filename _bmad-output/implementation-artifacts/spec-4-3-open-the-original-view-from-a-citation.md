---
title: 'Story 4.3 — Open the Original View from a Citation'
type: 'feature'
created: '2026-08-10'
status: 'done'
baseline_revision: 5188d9a9ea23424ce7d8b0fe87963f8c904fe3e5
review_loop_iteration: 1
followup_review_recommended: true
context: []
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** Story 4.2 shipped citation chips whose `onOpenCitation` is a no-op placeholder, and `Workspace`'s Showcase tab is a static "coming in a future update" stub with no wiring — clicking or Enter-ing a chip does nothing, and there is no way to fetch a source's full raw content (only chunk-level text lives in Qdrant) or a stored HTML fallback for web pages.

**Approach:** Add a `GET /api/sources/[id]/content` route + `SourceService.getContent` that reads a Text Source's full raw text from storage, or a Web Source's URL (already stored as the raw content today) plus a best-effort HTML snapshot captured at ingest time. Lift `Workspace`'s tab state to controlled and add `openCitation`/`invokingChipRef` state; wire a real `onOpenCitation` callback through `ChatPanel` → `CitationChip` that stores the citation + the clicked chip element, then switches to the Showcase tab. Build a `ShowcasePanel` that renders a Web Source as a live iframe (loading state; falls back to the stored HTML snapshot via `srcDoc` if the iframe doesn't load within a timeout) or a Text Source as its full text with the cited span wrapped in `<mark>` and scrolled into view. Esc returns to Chat and restores focus to the invoking chip; an `aria-live="polite"` region announces "Showcase: {title}" (and the highlighted passage for text sources), mirroring the existing chat announcement pattern.

## Boundaries & Constraints

**Always:**
- The Showcase panel is driven by controlled `Workspace` state (`activeTab`, `openCitation: CitationSnapshot | null`) — `Tabs` already supports controlled `activeTab`/`onTabChange`; use it instead of `Tabs`' internal state.
- `onOpenCitation` (threaded `Workspace` → `ChatPanel` → `AssistantMessageContent` → `CitationChip`, replacing `handleOpenCitationPlaceholder`) receives the `CitationSnapshot` and switches to Showcase; it also captures the clicked chip's DOM node (e.g. via the click/keydown event's `currentTarget`) for focus restore.
- Source content is fetched only when the Showcase panel needs it (on citation open), via a new `fetchSourceContent(sourceId)` client call — never bundled into the existing `fetchSources` list call.
- Text Source highlighting uses `<mark>` semantics + a highlight background/border combination (never color alone), and scrolls the marked element into view once rendered.
- Web Source embedding is attempted first (iframe `src` = the stored URL); if the iframe has not fired `load` within a fixed timeout (5s), treat it as blocked and switch to rendering the stored HTML snapshot (if one exists) via `srcDoc`; if no snapshot exists either, show an inline "can't be embedded" message with a link to open the URL in a new tab.
- Esc while the Showcase tab is active and holds an open citation switches `activeTab` back to `'chat'` and calls `.focus()` on the stored invoking-chip node (skip silently if the node is no longer in the DOM).
- An `aria-live="polite"` `sr-only` region in the Showcase panel is set to `Showcase: {title}` when a citation opens (and additionally references the highlighted passage for text sources), mirroring `chat-panel.tsx`'s existing announcement pattern.
- All new interactive elements carry a unique `data-debug` name, consistent with the rest of the app.

**Block If:**
- None identified — additive on top of Story 4.2's citation contract and Epic 3's existing storage/source infrastructure.

**Never:**
- No citation click-through telemetry event (SM-2) — no telemetry infrastructure exists yet (same call made in Story 4.2 for the citation-attach event); do not fabricate a call that logs nowhere meaningful.
- No changes to `CitationMapper`, the citation marker syntax, or how citations are computed/persisted (Story 4.2's scope).
- No fetch-on-refusal or refusal UI changes (Story 4.4).
- No paginated chat history changes (Story 4.5).
- No headless-browser/screenshot-based snapshot capture — the HTML snapshot is a best-effort plain `fetch(url)` of the page response body, not a rendered screenshot.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| WEB_EMBED_OK | Citation on a ready Web Source whose page allows framing | Iframe loads within timeout; loading state clears; no snapshot fetch needed | none |
| WEB_EMBED_BLOCKED | Citation on a ready Web Source that blocks framing (e.g. `X-Frame-Options`) | Iframe never fires `load`; after timeout, falls back to the stored HTML snapshot rendered via `srcDoc` | none |
| WEB_NO_SNAPSHOT | Embed blocked and no snapshot was captured at ingest time (fetch failed/timed out) | Inline "can't be embedded" message with a link to open the URL in a new tab; no crash | none |
| TEXT_HIGHLIGHT | Citation on a ready Text Source with a valid `span` | Full text renders with the `[span.start, span.end)` slice wrapped in `<mark>`, scrolled into view | none |
| SOURCE_REMOVED | Citation references a `sourceId` no longer present in the notebook (deleted after the answer was given) | Showcase shows a "This source is no longer available" message instead of attempting to fetch content | Content fetch 404 handled inline, not thrown |
| ESC_RETURN | Showcase tab open with a citation, user presses Esc | Returns to Chat tab; focus restored to the invoking citation chip (or silently no-ops if that chip is no longer mounted) | none |
| REOPEN_DIFFERENT_CITATION | A second citation is clicked while Showcase is already open | Showcase content and announcement update to the new citation/source; previous content is replaced, not appended | none |

</intent-contract>

## Code Map

- `backend/src/contexts/sources/index.ts` -- add `SourceService.getContent(id, userId)`: loads the `Source` row (404/ownership check), then for `type: 'text'` reads `RAW_KEY(id)` from storage and returns `{ type: 'text', text }`; for `type: 'web'` returns `{ type: 'web', url: <stored raw content>, snapshotHtml: <SNAPSHOT_KEY(id) content, if present> }`.
- `backend/src/contexts/ingestion/index.ts` -- in `loadContent` for `type: 'web'`, after fetching the URL, best-effort `fetch(url)` the raw HTML response body (capped at the same `MAX_WEB_CONTENT_BYTES`) and `storage.put(SNAPSHOT_KEY(sourceId), html, 'text/html')`; swallow any failure (timeout/non-200/oversized) without failing ingestion — the jina markdown fetch remains the source of truth for chunking.
- `app/api/sources/[id]/content/route.ts` -- NEW `GET`: auth + ownership check (mirrors `app/api/sources/[id]/route.ts`'s `DELETE`), calls `sources.getContent`, returns 404 if the source doesn't exist or isn't owned by the caller.
- `components/notebooks/api.ts` -- add `fetchSourceContent(sourceId): Promise<SourceContent>` (`SourceContent` = `{ type: 'text', text: string } | { type: 'web', url: string, snapshotHtml: string | null }`).
- `components/notebooks/workspace.tsx` -- lift `Tabs` to controlled (`activeTab`/`onTabChange` state); add `openCitation: CitationSnapshot | null` and `restoreFocusKey: string | null` state (see Design Notes -- **not** a raw DOM node ref, which does not survive `Tabs` unmounting the inactive panel); pass `onOpenCitation` + `restoreFocusKey`-clearing down to `ChatPanel`; render `ShowcasePanel` (replacing the static stub) when `activeTab === 'showcase'`; pass `sourcesQuery`'s `isLoading` state down so `ShowcasePanel` can distinguish "still loading the source list" from "source genuinely not found."
- `components/notebooks/showcase-panel.tsx` -- NEW: given `citation` + the notebook's already-fetched `SourceRecord[]` + `sourcesLoading: boolean`, fetches content via `fetchSourceContent`, renders the web-iframe-with-fallback or text-with-highlight views, owns the `aria-live` announcement, and Esc handling (calling back up to `Workspace` to switch tabs + trigger focus restore). Only treats a citation as "source no longer available" when `!sourcesLoading && !source` -- never while the source list is still in flight.
- `components/chat/chat-panel.tsx` -- accept an `onOpenCitation: (citation: CitationSnapshot, citationKey: string) => void` prop and a `restoreFocusKey: string | null` prop from `Workspace`; thread `onOpenCitation` down through `AssistantMessageContent` to `CitationChip` in place of `handleOpenCitationPlaceholder`; add an effect that, when `restoreFocusKey` is set (i.e. right after remounting on returning from Showcase), queries for the chip via `document.querySelector('[data-citation-key="..."]')` and calls `.focus()` on it, then reports back up (via a `onFocusRestored` callback) so `Workspace` clears `restoreFocusKey` -- this re-query-after-mount approach is what survives the unmount/remount cycle that a stored DOM node reference does not.
- `components/chat/citation-chip.tsx` -- add a `citationKey: string` prop (a stable id unique to this rendered occurrence, e.g. `${turn.id}-${citation.chunkId}-${occurrenceIndex}`, passed from `AssistantMessageContent`), set it as `data-citation-key={citationKey}` on the chip's `<button>`, and pass `citationKey` (not a DOM node) through to `onOpenCitation`.
- `backend/src/contexts/ingestion/index.ts` -- `captureSnapshot`'s `fetch(url)` call must pass `{ signal: AbortSignal.timeout(8_000) }` so a slow/hanging origin cannot stall ingestion indefinitely (still awaited -- "best-effort" means failures are swallowed, not that the call is unbounded); before fetching, resolve the URL's hostname and reject (skip snapshot, no throw) if it is `localhost`, a loopback/link-local/private-range IP (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`, `::1`, `fc00::/7`, `fe80::/10`) -- this is a direct server-side fetch of a user-supplied URL and must not be usable to probe internal network/metadata endpoints; check the response's `Content-Length` header (if present) against `MAX_WEB_CONTENT_BYTES` before calling `res.text()`, in addition to the existing post-fetch byte check (defense in depth -- a missing/lying `Content-Length` still falls through to the existing check).
- `backend/src/contexts/sources/index.ts` -- `getContent`: wrap **both** the text-source and web-source `storage.get(RAW_KEY(id))` calls in the same `.catch(() => null)` pattern already used for the snapshot lookup (consistent error handling -- a storage failure must never throw an unhandled error out of this method); if the raw content read returns `null` for either type (missing/corrupted blob, as opposed to a missing/not-owned `Source` row), return `{ ok: false, reason: 'content_unavailable' }` instead of masking it as an empty-string success.
- `app/api/sources/[id]/content/route.ts` -- wrap the `sources.getContent` call in try/catch, returning `errorResponse('Could not load source content', 'INTERNAL_ERROR', 500)` on an unexpected throw (matching the existing route conventions in `app/api/notebooks/[id]/sources/route.ts`), and map `reason: 'content_unavailable'` to a distinct 404-family response (or 500, since it indicates real data loss) rather than silently succeeding with empty content.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/contexts/ingestion/index.ts` -- best-effort HTML snapshot capture for Web Sources at ingest time, stored under a new `SNAPSHOT_KEY`, with a bounded fetch timeout, a private/loopback-address guard, and a `Content-Length` pre-check -- OQ-U1 resolution.
- [x] `backend/src/contexts/sources/index.ts` -- `getContent(id, userId)`: text → raw text; web → url + optional snapshot; consistent storage-error handling across both branches; `content_unavailable` distinguished from not-found.
- [x] `app/api/sources/[id]/content/route.ts` -- NEW `GET` route wiring `getContent` with auth/ownership/404 handling and a try/catch around the service call.
- [x] `components/notebooks/api.ts` -- `fetchSourceContent` client call + `SourceContent` type.
- [x] `components/notebooks/workspace.tsx` -- controlled tabs, `openCitation`/`restoreFocusKey` state, thread `sourcesQuery.isLoading` + `onOpenCitation` into `ChatPanel`, render `ShowcasePanel`.
- [x] `components/notebooks/showcase-panel.tsx` -- NEW: web iframe (with a `sandbox` attribute matching the snapshot iframe's) + timeout-based blocked-embed fallback to snapshot `srcDoc`; a loading-vs-not-found distinction driven by `sourcesLoading`; text full-view with `<mark>` span highlight + scroll-into-view; distinct `aria-live` announcements for the found vs. not-available cases; Esc handler.
- [x] `components/chat/chat-panel.tsx` / `components/chat/citation-chip.tsx` -- real `onOpenCitation` wiring replacing the Story 4.2 placeholder, using a stable `citationKey` (data attribute + re-query-on-remount) instead of a raw DOM node reference for focus restore.
- [x] Unit test edge cases from the I/O matrix at the `SourceService.getContent` level (text, web with/without snapshot, not-found/not-owned, storage-read-failure → `content_unavailable`).

**Acceptance Criteria:**
- Given a citation on a Web Source, when the user clicks it, then the Showcase section opens the live webpage in a sandboxed iframe with a loading state, falling back to the stored HTML snapshot if the iframe doesn't load within the timeout.
- Given a citation on a Text Source, when the user clicks it, then the Showcase opens the full text with the cited span highlighted via `<mark>` semantics + a highlight style (not color alone), scrolled into view.
- Given the Showcase tab is open from a citation, when the user presses Esc, then it returns to Chat (which remounts, per `Tabs`' existing single-active-panel behavior) with focus restored to the citation chip matching the citation that was open, once that chip has re-rendered.
- Given Showcase navigation, when it opens, then an `aria-live="polite"` region announces "Showcase: {title}" (and the highlighted passage, for text sources) -- or a distinct "source no longer available" announcement when the cited source can't be found.
- Given the notebook's source list is still loading when a citation is opened, when the Showcase panel renders, then it shows a loading state, never the "source no longer available" message.

## Design Notes

Iframe blocked-embed detection: attach `onLoad` to the iframe and start an 8s `setTimeout` on mount; if `onLoad` fires first, clear the timeout and show the iframe; if the timeout fires first, assume the embed is blocked (most `X-Frame-Options`/CSP blocks never fire `onLoad` at all, so a load-race timeout is the practical signal available without server-side header inspection) and swap to the snapshot view. This is the OQ-U1 assumption already flagged in the architecture readiness report — acceptable for this story; a more precise signal (e.g. a HEAD request checking response headers server-side before deciding) is a reasonable future improvement but out of scope here. Both the live iframe and the snapshot `srcDoc` iframe use a `sandbox` attribute (the live one needs `allow-scripts allow-same-origin allow-popups allow-forms` to remain usable for typical pages; the snapshot one can stay fully locked down at `sandbox=""` since it's static markup) -- an unsandboxed iframe embedding arbitrary third-party pages is a clickjacking/script exposure this story must not introduce.

Snapshot capture is bounded, not just "best-effort": `fetch(url, { signal: AbortSignal.timeout(8_000) })` caps how long ingestion can be delayed by a slow origin, a `Content-Length` pre-check avoids buffering an oversized body via `res.text()` before the existing byte-length check runs, and a private/loopback/link-local address guard prevents this new server-side fetch of a user-supplied URL from being usable as an SSRF probe against internal infrastructure. All of these failures (timeout, blocked address, oversized, non-200) are still swallowed silently -- ingestion's primary job (chunking/embedding via the jina markdown extract) must never fail because this fallback capture didn't work.

Text highlighting: split the fetched full text into three parts at `span.start`/`span.end`, render `{before}<mark>{highlighted}</mark>{after}`, and scroll the `<mark>` ref into view with `scrollIntoView({ block: 'center' })` once mounted.

Focus restore across the Chat ↔ Showcase tab switch: `Tabs` renders exactly one tab's content at a time (`children(active)` returns a single `ReactNode`), so switching to Showcase fully unmounts `ChatPanel` -- any DOM node reference captured before the switch (e.g. `event.currentTarget` from the click/keydown handler) is detached and useless by the time the user presses Esc and switches back. The fix is a stable, re-queryable identifier instead of a node reference: each rendered `CitationChip` gets a `data-citation-key` derived from `${turn.id}-${citation.chunkId}-${occurrenceIndex}` (stable across remounts because turn ids and chunk ids don't change), `Workspace` stores that string (not a node) in `restoreFocusKey` when a citation opens, and after switching back to `'chat'`, `ChatPanel`'s effect re-queries `document.querySelector('[data-citation-key="..."]')` once its own content has (re)rendered and focuses it -- silently no-op if that exact chip no longer exists (e.g. the turn was cleared).

## Spec Change Log

### 2026-08-10 — Review pass 1 (bad_spec loopback)
- Triggering finding: the first implementation followed this spec's Code Map literally -- capturing the clicked citation chip's raw DOM node (`event.currentTarget`) in a ref, to `.focus()` on Esc. Both adversarial reviewers independently confirmed this cannot work: `Tabs` (`components/ui/tabs.tsx`) renders exactly one tab's content at a time via `children(active)`, so switching from Chat to Showcase fully unmounts `ChatPanel` and detaches the captured node from the DOM before Esc is ever pressed -- the "focus restored to the invoking citation chip" acceptance criterion was unimplementable as specified.
- What was amended: Code Map, Tasks & Acceptance, and Design Notes (all outside `<intent-contract>`) now specify a stable `data-citation-key` identifier + re-query-after-remount mechanism instead of a stored DOM node reference. Also folded in, to avoid a second review cycle re-discovering the same class of issue: a bounded/guarded snapshot fetch (timeout, private-address SSRF guard, `Content-Length` pre-check) in ingestion; a `sandbox` attribute on the live iframe (previously only the snapshot iframe had one); a `sourcesLoading`-aware not-found check in `ShowcasePanel` (previously could false-positive "source no longer available" while the source list was still in flight); consistent storage-error handling in `SourceService.getContent` (previously one branch swallowed storage errors via `.catch(() => null)` while the other let them throw); a `content_unavailable` outcome distinct from not-found; and a differentiated aria-live announcement for the not-found case (previously identical to the found case).
- Known-bad state avoided: shipping a Showcase feature whose signature keyboard-accessibility acceptance criterion silently never fires (Esc always no-ops on focus restore), plus a new unbounded/unguarded server-side fetch of user-supplied URLs (ingestion stall risk + SSRF surface) and an unsandboxed third-party iframe embed.
- KEEP: the backend split (`getContent` on `SourceService`, thin `GET` route mirroring the existing `DELETE` route's auth/ownership/404 style), the `SNAPSHOT_KEY` capture-at-ingest-time approach itself (just needs bounding/guarding, not redesigning), the iframe-timeout-then-snapshot-fallback UX flow, the `<mark>`-based text highlighting with clamped span math, and the overall `Workspace` → `ShowcasePanel` data flow (citation + already-fetched source list, content fetched on demand) all worked and should carry forward unchanged into re-implementation.

## Review Triage Log

### 2026-08-10 — Review pass 1
- intent_gap: 0
- bad_spec: 1 (high 1)
- patch: 0 (mooted by bad_spec this pass; the issues below were folded into the bad_spec amendment instead of patched independently, since re-implementation was already required)
- defer: 4 (medium 2, low 2)
- reject: 2 (low 2)
- addressed_findings:
  - `[high]` `[bad_spec]` Esc-focus-restore relies on a raw DOM node ref that `Tabs` invalidates by unmounting the inactive panel on every tab switch, making the acceptance criterion unimplementable as specified — see Spec Change Log entry above for the full amendment (also folded in: snapshot-fetch bounding/SSRF guard, iframe sandboxing, sourcesLoading race, consistent storage-error handling, content_unavailable outcome, differentiated aria-live).
  - `[medium]` `defer` — `SourceService.getContent` returning `{ok:true, text:''}`/`{ok:true, url:''}` when the raw content blob is missing (as opposed to the `Source` row being missing) is masked as success rather than surfaced; **superseded** — this is now addressed directly in the bad_spec amendment (`content_unavailable` outcome) rather than deferred, since re-implementation was already in motion.
  - `[medium]` `defer` — snapshot `srcDoc` has no base URL, so relative assets (CSS/images/links) in a captured HTML snapshot will render broken; acceptable per this story's explicit "plain fetch, not a screenshot" scope, but not called out to the user anywhere. Recorded in `deferred-work.md`.
  - `[low]` `defer` — `TextShowcase`'s span clamping silently absorbs an out-of-range/stale `span` (e.g. source content changed since the citation was generated) without indicating to the user that the highlighted passage may be wrong. Recorded in `deferred-work.md`.
  - `[low]` `defer` — `ShowcasePanel` has no explicit handling for a cited source whose `status` isn't `'ready'` (e.g. reverted to `processing`/`failed` after the citing answer was given); falls through to whatever `getContent` returns rather than a dedicated message. Recorded in `deferred-work.md`.
  - `[low]` `reject` — `RAW_KEY`/`SNAPSHOT_KEY` string-prefix relationship (`sources/{id}` vs `sources/{id}/snapshot.html`) raised as a possible storage key collision; verified against `FilebaseAdapter` (S3-compatible object storage, `backend/src/adapters/filebase/index.ts`) — object storage keys are opaque strings with no real directory semantics, so there is no actual collision risk.
  - `[low]` `reject` — no automated frontend test coverage for `ShowcasePanel`'s Esc handling, focus restoration, or iframe-timeout fallback: this story's own Verification section scopes automated tests to the `SourceService.getContent` level and defers UI behavior to manual checks, consistent with the precedent set in Story 4.2's review pass — not a gap.

### 2026-08-10 — Review pass 2
- intent_gap: 0
- bad_spec: 0
- patch: 8 (high 3, medium 5, low 0)
- defer: 3 (medium 1, low 2)
- reject: 1 (low 1)
- addressed_findings:
  - `[high]` `[patch]` The ingestion-time snapshot fetch followed HTTP redirects automatically with no re-validation of the redirect target, letting a URL that first passes the SSRF hostname check 302 to a private/metadata address and still be fetched — changed `captureSnapshot` to `redirect: 'manual'` with a bounded (5-hop) manual redirect loop that re-runs the private/loopback guard on every hop before following it.
  - `[high]` `[patch]` The live web-embed iframe's `sandbox="allow-scripts allow-same-origin allow-popups allow-forms"` combined `allow-scripts` with `allow-same-origin` on an iframe embedding an arbitrary third-party URL — a documented sandbox-escape pattern if the framed origin is ever same-origin with the app. Removed `allow-same-origin` from the live iframe's sandbox attribute (kept on the snapshot iframe's, which stays at `sandbox=""`).
  - `[high]` `[patch]` `captureSnapshot` buffered the full response body via `res.text()` before checking it against `MAX_WEB_CONTENT_BYTES`, so a server with a missing/lying `Content-Length` could still force an unbounded in-memory buffer — replaced with `readBodyWithCap`, a streaming reader that aborts and discards the moment accumulated bytes exceed the cap, never trusting the header alone.
  - `[medium]` `[patch]` `isPrivateOrLoopbackIp`'s IPv6 branch never unwrapped IPv4-mapped addresses (`::ffff:127.0.0.1`, `::ffff:169.254.169.254`) or checked `0.0.0.0`/`::`, letting them bypass the SSRF guard — added IPv4-mapped unwrapping (delegating to the v4 check) and the two missing addresses.
  - `[medium]` `[patch]` `isUnsafeHost` resolved only the first address `dns.lookup` returned, so a multi-A-record hostname could present a safe address to the guard while a different (possibly unsafe) record served the actual request — changed to `dns.lookup(hostname, { all: true })`, rejecting if *any* resolved address is private/loopback (documented as narrowing, not eliminating, the residual DNS-rebinding/TOCTOU gap between this check and `fetch`'s own independent resolution — see Design Notes).
  - `[medium]` `[patch]` `ShowcasePanel`'s Esc listener was registered unconditionally rather than only "while the Showcase tab is active and holds an open citation" as specified, so pressing Esc on the empty Showcase stub also triggered the tab-switch/focus-restore path — gated the effect on `Boolean(citation)`.
  - `[medium]` `[patch]` The differentiated-aria-live amendment from pass 1 fixed the found-vs-not-found wording but dropped the "and the highlighted passage, for text sources" half of the requirement entirely — `TextShowcase` now carries its own `aria-live` region announcing the highlighted passage, restoring the two-tier announcement pattern from the originally-intended design.
  - `[medium]` `[patch]` `AssistantMessageContent`'s `components` object (react-markdown's renderer map) regressed from `useMemo`'d to a plain object literal rebuilt every render, because the citation occurrence counter was a mutable closure variable requiring a fresh object each pass — refactored `transformMarkersToChipLinks` to compute and encode the occurrence index directly into the transformed markdown link's href (`citation:chunkId:occurrenceIndex`) once, up front, making the `a` renderer a pure function of its href and safely memoizable again.
  - `[medium]` `[patch]` Removed a dead/unreachable validation branch in `isPrivateOrLoopbackIp`'s v4 check (`parts.length !== 4 || parts.some(Number.isNaN)`, unreachable given `isIP(ip) === 4` already guarantees a well-formed dotted-quad) during the v4/v6 refactor above.
  - `[medium]` `defer` — Full DNS-rebinding/TOCTOU closure (pinning the exact IP `isUnsafeHost` validated to the actual `fetch` connection) requires a custom low-level dispatcher/connect hook, not a self-contained code change; the per-hop redirect guard and multi-address check narrow this pass's exposure but don't eliminate it. Recorded in `deferred-work.md`.
  - `[low]` `defer` — Esc cannot be caught while keyboard focus is inside the live cross-origin `<iframe>` (a `window`-level `keydown` listener never receives events from a cross-origin frame's document; this is a browser-level limitation, not fixable without cooperation from the framed page). Recorded in `deferred-work.md`.
  - `[low]` `defer` — Switching from the Chat tab to the Showcase tab (or any other tab) fully unmounts `ChatPanel`, whose conversation `turns` are local `useState` with no server-side reload on mount — every citation click today resets the visible conversation to empty once the user returns to Chat. This is a pre-existing gap (chat history is only ever persisted, never re-fetched, until Story 4.5's sliding-window persistence lands) that this story's core interaction (click a citation → leave Chat) makes far more load-bearing and visible than before. Recorded in `deferred-work.md` with a flag to verify explicitly once Story 4.5 ships.
  - `[low]` `reject` — the I/O matrix's `REOPEN_DIFFERENT_CITATION` scenario is unreachable by construction (citation chips only exist in `ChatPanel`, which is unmounted while Showcase is active, so there is no way to click a second citation while the first is showing) — a spec-accuracy nit inside `<intent-contract>`, which is read-only; no code or behavior is wrong because of it.

## Verification

**Commands:**
- `npm run typecheck` -- expected: no type errors.
- `npm run build` -- expected: production build succeeds with all routes, including the new `/api/sources/[id]/content` route.
- `npm test` -- expected: all tests pass, including new `SourceService.getContent` cases.

**Manual checks (if no CLI):**
- Open a citation on a Text Source; confirm the passage is highlighted and scrolled into view.
- Open a citation on a Web Source that allows framing (e.g. a permissive test page); confirm the live iframe loads.
- Open a citation on a Web Source known to block framing (e.g. a site sending `X-Frame-Options: DENY`); confirm it falls back to the snapshot (or the "can't be embedded" message if no snapshot was captured).
- From the Showcase tab, press Esc and confirm focus returns to the citation chip that was clicked.

## Auto Run Result

**Summary:** Implemented Story 4.3 end-to-end: `SourceService.getContent` + a new `GET /api/sources/[id]/content` route serve a Text Source's full raw text or a Web Source's URL + best-effort HTML snapshot (captured, guarded, and bounded at ingest time); `Workspace` lifts tab state to controlled and wires a real `onOpenCitation` through `ChatPanel`/`CitationChip`; `ShowcasePanel` renders a sandboxed live iframe with timeout-based snapshot fallback for Web Sources, or full text with a `<mark>`-highlighted cited span for Text Sources, with `aria-live` announcements and Esc-to-return. Went through one `bad_spec` loopback (pass 1: the originally-specified DOM-node-ref focus-restore mechanism was unimplementable given `Tabs`' unmount-on-switch behavior) and one further `patch` pass (pass 2: 3 high-severity security/robustness fixes plus 5 medium fixes to the re-implementation).

**Files changed:**
- `backend/src/contexts/ingestion/index.ts` — `SNAPSHOT_KEY`, SSRF-guarded (`isUnsafeHost`/`isPrivateOrLoopbackIp`, all-addresses + IPv4-mapped-v6 aware) and redirect-revalidating, timeout-bounded, streaming-byte-capped `captureSnapshot()`.
- `backend/src/contexts/sources/index.ts` — `getContent(id, userId)` with consistent storage-error handling and a `content_unavailable` outcome distinct from not-found.
- `app/api/sources/[id]/content/route.ts` (new) — `GET` route with auth/ownership/try-catch handling.
- `backend/src/contexts/sources/__tests__/source-service.test.ts` (new) — `getContent` coverage across text/web/snapshot/not-found/not-owned/storage-failure cases.
- `components/notebooks/api.ts` — `fetchSourceContent` + `SourceContent` type.
- `components/notebooks/workspace.tsx` — controlled tabs, `openCitation`/`restoreFocusKey` state, `sourcesLoading` threading.
- `components/notebooks/showcase-panel.tsx` (new) — web iframe (sandboxed, `allow-same-origin` intentionally excluded) with snapshot fallback; text view with highlight + its own `aria-live` region; citation-gated Esc handling.
- `components/chat/chat-panel.tsx` — real `onOpenCitation`/`restoreFocusKey` wiring via a stable `citationKey` (occurrence index encoded into the transformed markdown href, keeping the `react-markdown` renderer map memoizable) instead of a DOM node reference.
- `components/chat/citation-chip.tsx` — `citationKey` prop + `data-citation-key` attribute.

**Review findings breakdown:** Pass 1 — 1 `bad_spec` (focus-restore mechanism unimplementable as specified) triggering a full spec amendment + re-implementation; 2 findings superseded by that amendment; 2 deferred (snapshot `srcDoc` missing base URL; span-clamping silence); 2 rejected (storage key collision — verified non-issue; missing frontend tests — out of stated scope). Pass 2 (post-amendment) — 8 patches applied (3 high: redirect-based SSRF bypass, `allow-scripts`+`allow-same-origin` sandbox combo, unbounded body buffering; 5 medium: IPv4-mapped-v6/`0.0.0.0` gaps, single-address DNS check, unconditional Esc handler, dropped passage aria-live, `useMemo` regression + dead-code cleanup); 3 deferred (residual DNS-rebinding/TOCTOU risk, cross-origin-iframe Esc limitation, pre-existing chat-history-reset-on-tab-switch now made load-bearing by this story's interaction pattern — flagged for explicit verification once Story 4.5 lands); 1 rejected (an I/O-matrix scenario proven unreachable by `Tabs`' architecture — a spec-accuracy nit, not a behavior defect).

**Follow-up review recommendation:** `true` — the pass-2 fixes included three high-severity security-relevant findings (SSRF redirect bypass, iframe sandbox escape combination, unbounded memory buffering) touching a new server-side fetch of user-supplied URLs; that volume and severity of security-adjacent changes in a single pass warrants an independent follow-up look before this is considered fully settled.

**Verification performed:** `npm run typecheck` (clean), `npm test` (26/26 passing across 3 files, including new `SourceService.getContent` cases), `npm run build` (production build succeeds, `/api/sources/[id]/content` present in the route list) — re-run after both the initial implementation and the pass-2 patches. UI-facing behavior (iframe fallback, `<mark>` highlighting, Esc/focus-restore, aria-live wording) was verified by code inspection only, per this spec's own manual-check scope — not exercised in a live browser this run.

**Residual risks:** (1) DNS-rebinding/TOCTOU gap in the SSRF guard remains — narrowed (redirect re-validation, all-address checking) but not eliminated; would need a custom fetch dispatcher to close fully. (2) Esc cannot reach the Showcase panel while focus is inside the live cross-origin iframe — a browser-level limitation, not fixable from this codebase alone. (3) The pre-existing chat-history-reset-on-tab-switch gap (Story 4.5's scope) is now on the primary citation-click path; this should be explicitly regression-tested once 4.5 lands. All three are recorded in `deferred-work.md`.
