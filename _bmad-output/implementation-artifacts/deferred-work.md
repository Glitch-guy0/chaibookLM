# Deferred Work

- source_spec: `_bmad-output/implementation-artifacts/spec-5-6-harden-the-design-system-across-all-surfaces.md`
  summary: `--color-ink-muted-dark` (#7A7263) on `--color-surface-dark` (#16130D) fails the 4.5:1 WCAG AA floor for muted/body text, computing to 3.90:1.
  evidence: `app/design-system.contrast.test.ts`'s "ink-muted-dark on surface-dark meets 4.5:1" assertion fails with the exact ratio; per this spec's `Never` clause, the token hex value was not changed to force a pass — darkening `--color-ink-muted-dark` (or lightening `--color-surface-dark`) is a design decision deferred to a future story.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-6-harden-the-design-system-across-all-surfaces.md`
  summary: `--color-ink-dark` (#F5F0E8) on `--color-brand-dark` (#FF864F) fails the 4.5:1 WCAG AA floor for the active-notebook chip's text-on-brand-fill, computing to 2.11:1.
  evidence: `app/design-system.contrast.test.ts`'s "ink-dark on brand-dark meets 4.5:1" assertion fails with the exact ratio; per this spec's `Never` clause, no token hex value was changed — this pairing needs either a darker/higher-contrast text color on brand fills in dark mode or a different brand-dark shade, both design decisions out of this story's scope.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-5-honest-rate-limit-rejection-under-load.md`
  summary: The rate limiter's in-memory counter is process-local; in any multi-instance/serverless-scaled deployment, each instance gets its own independent budget, so the effective aggregate limit is multiplied by instance count instead of being a true shared cap.
  evidence: `app/api/lib/rate-limit.ts` uses module-level variables with no Redis/Upstash-backed shared store, documented as a known single-instance limitation in the spec's own Design Notes.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-5-honest-rate-limit-rejection-under-load.md`
  summary: A fixed-window counter allows roughly 2x the intended throughput in a short burst straddling a window boundary (max requests at the tail of one window, then another max immediately after reset).
  evidence: `checkRateLimit()` resets the window on a hard cutoff (`now - windowStart >= windowMs`) rather than using a sliding-window or token-bucket algorithm.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-5-honest-rate-limit-rejection-under-load.md`
  summary: One shared global bucket covers three endpoints with very different cost profiles (LLM chat, source ingestion, search-fetch); a burst on one route can starve the others' budget with no per-route allocation.
  evidence: All three routes call the same module-level `checkRateLimit()` with no route-scoped counter.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-5-honest-rate-limit-rejection-under-load.md`
  summary: No logging/metrics on throttled requests, making it hard to tell how often the limit is hit or to tune the threshold without adding instrumentation after the fact.
  evidence: `checkRateLimit()`/`rateLimitResponse()` have no logging call on the rejection path.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-5-honest-rate-limit-rejection-under-load.md`
  summary: No route-level/integration tests verify that the three gated routes actually return 429 with the correct shape when throttled — only the isolated `rate-limit.ts` module is unit-tested.
  evidence: `app/api/lib/rate-limit.test.ts` tests `checkRateLimit()` directly; none of `chat/route.ts`, `sources/route.ts`, `search-fetch/route.ts` have route-level tests for the 429 path.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-4-first-run-product-walkthrough.md`
  summary: If the tour is interrupted by a hard exit (tab closed, crash) before `onDestroyed`/`onCloseClick` fires, `resetTour` already ran but the flag is never re-marked seen, so the user gets involuntarily treated as first-run and auto-tour-started again on their next visit.
  evidence: `use-product-tour.ts` calls `resetTour(userId)` before `buildAndDrive`, and only calls `markTourSeen` from driver.js exit callbacks that require the instance to actually fire an exit event.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-4-first-run-product-walkthrough.md`
  summary: No test exercises `useProductTour`'s actual auto-start/replay branching, driver.js instantiation, or cleanup — `tour.test.tsx` only covers the storage helpers and the reused `prefersReducedMotion` function.
  evidence: Same pattern as the story-5.2/5.3 deferred items — the riskiest new hook logic ships untested.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-4-first-run-product-walkthrough.md`
  summary: The account page's "most recent notebook" selection assumes `fetchNotebooks` returns results most-recent-first, asserted only in a comment with no verification against the actual API/query ordering.
  evidence: `app/dashboard/account/page.tsx`'s `handleReplayTour` takes `notebooks[0]` as the replay target based on a comment reference to `fetchNotebooks`/`NotebookGrid`, not a verified sort contract.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-4-first-run-product-walkthrough.md`
  summary: `useProductTour`'s exported `replay()` function is unused dead code — the Account page's replay flow goes through a `?tour=replay` query param and the hook's `autoReplay` option instead of calling `replay()` directly.
  evidence: `account/page.tsx`'s `handleReplayTour` only calls `router.push`; nothing in the diff imports or calls the hook's `replay`.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-4-first-run-product-walkthrough.md`
  summary: `localStorage`-unavailable fails safe by treating the tour as already seen, with no product-analytics signal that a cohort of users (private-mode/storage-disabled) will never see onboarding.
  evidence: `tour-storage.ts`'s `hasSeenTour` returns `true` on any thrown error, logged only via `console.error`.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-3-cookie-consent-and-accessibility-preferences.md`
  summary: A tampered/unrecognized `cookie-consent` cookie value leaves `consent` stuck at `null` forever (the banner reappears every visit) instead of treating it as "no decision" and clearing the stray cookie.
  evidence: `ConsentProvider`'s mount effect only calls `setConsent` for exactly `'accepted'`/`'declined'`; any other stored value is silently ignored rather than reset.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-3-cookie-consent-and-accessibility-preferences.md`
  summary: No cross-tab sync — accepting/declining consent or toggling theme in one tab doesn't update state in another already-open tab.
  evidence: `ConsentProvider`/`ThemeProvider` only read cookies once on mount; no `storage`/`visibilitychange` listener re-reads them.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-3-cookie-consent-and-accessibility-preferences.md`
  summary: The "has consent → persist theme" cookie check is duplicated independently in `theme-provider.tsx`'s `setTheme` and `consent-provider.tsx`'s `accept`, risking drift if the rule changes.
  evidence: Both re-derive `getCookie(CONSENT_COOKIE_NAME) === CONSENT_ACCEPTED_VALUE` inline rather than sharing a helper.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-3-cookie-consent-and-accessibility-preferences.md`
  summary: `decline()` only deletes the `theme` cookie by name; there's no generalized list of non-essential cookies to purge, so a future second preference cookie needs to be hand-wired into this function or it will survive a decline.
  evidence: `consent-provider.tsx`'s `decline` calls `deleteCookie(THEME_COOKIE_NAME)` directly with no registry of "non-essential" cookies.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-3-cookie-consent-and-accessibility-preferences.md`
  summary: The consent banner has no `aria-live` announcement or focus movement on mount, so screen-reader users aren't proactively notified a new actionable element appeared.
  evidence: `consent-banner.tsx` uses `role="region"` `aria-label` only, no `aria-live` or focus management.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-3-cookie-consent-and-accessibility-preferences.md`
  summary: No component-level tests render the real `ConsentProvider`/`ConsentBanner`/`AccountPage`; `consent.test.tsx` re-implements the accept/decline cookie logic inline rather than exercising the actual exported functions.
  evidence: Same pattern as the story-5.2 deferred item — `theme.test.tsx` has the same gap for `ThemeProvider`.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-3-cookie-consent-and-accessibility-preferences.md`
  summary: If a browser blocks/clears cookies entirely, the consent banner reappears on every load indefinitely with no in-memory session-only dismissal fallback.
  evidence: `setCookie`/`getCookie` silently no-op when writes don't take effect; nothing detects that case to avoid re-showing the banner within the same session.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-2-dark-mode-across-all-surfaces.md`
  summary: Cookie-reading logic is duplicated between the blocking inline script string in `app/layout.tsx` and the real implementation in `components/theme/cookies.ts`, so a fix to one won't propagate to the other.
  evidence: `THEME_INIT_SCRIPT` in `app/layout.tsx` hand-parses `document.cookie` inline rather than sharing `getCookie`, since it must run before any React/module code loads.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-2-dark-mode-across-all-surfaces.md`
  summary: The `-dark`-suffixed tokens in `app/globals.css` `@theme` are hand-copied literal duplicates of the values in the `.dark {}` override block; the two will drift if one is edited without the other.
  evidence: Both blocks encode the same hex values independently with no single source of truth or build-time generation step.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-2-dark-mode-across-all-surfaces.md`
  summary: `resolveTheme()` reads `prefers-color-scheme` once on mount with no `matchMedia` `change` listener, so a live OS theme flip while the tab is open (and no consent-based override is set) never updates the UI until reload.
  evidence: `components/theme/theme-provider.tsx`'s effect calls `matchMedia(...).matches` once with no listener registered.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-2-dark-mode-across-all-surfaces.md`
  summary: No test exercises `ThemeProvider`'s actual `setTheme`/`resolveTheme` functions directly; `theme.test.tsx` re-implements the consent-gating logic inline in the test rather than calling the real provider, so a regression in the real `setTheme` would not be caught.
  evidence: `components/theme/theme.test.tsx`'s "provider" describe block asserts against hand-rolled test logic, not an import from `theme-provider.tsx`.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-2-dark-mode-across-all-surfaces.md`
  summary: If a user changes theme before accepting cookie consent, then accepts consent later (story 5.3), the theme they're currently viewing is not retroactively persisted — only the next toggle after consent gets written to a cookie.
  evidence: `setTheme` only writes the `theme` cookie inside its own call; there's no consent-acceptance listener that persists the current in-memory theme.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-1-public-landing-page-with-scroll-storytelling.md`
  summary: `RevealSection`, `LandingStory`, and `LandingCta` have no unit test coverage; only `LandingHero` and `prefersReducedMotion` are tested.
  evidence: `components/landing/landing.test.tsx` only asserts a `/sign-in` link on `LandingHero` and mocks `matchMedia`; the reveal transition logic itself ships unverified.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-1-public-landing-page-with-scroll-storytelling.md`
  summary: `useScrollReveal` reads `prefersReducedMotion()` only once on mount, so a live OS-level toggle of reduced-motion while the tab is open has no effect until reload.
  evidence: `components/landing/use-scroll-reveal.ts` calls `prefersReducedMotion()` inside a `useEffect` with an empty dependency array and no `matchMedia` change listener.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-1-public-landing-page-with-scroll-storytelling.md`
  summary: The `skewX` CTA button decoration is duplicated verbatim in `landing-hero.tsx` and `landing-cta.tsx` instead of being factored into a shared class/component.
  evidence: Both files hardcode the same arbitrary Tailwind skew value; a future style change requires editing both call sites.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-1-public-landing-page-with-scroll-storytelling.md`
  summary: `vitest.config.ts` runs under `environment: 'node'`, so DOM/browser-API-driven logic (`IntersectionObserver`, `matchMedia`, effect lifecycle) in the new landing components structurally cannot be unit tested without adding a jsdom environment.
  evidence: `landing.test.tsx` works around this via `renderToStaticMarkup` instead of exercising the client hooks directly.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-1-public-landing-page-with-scroll-storytelling.md`
  summary: Removing root-level `force-dynamic` from `app/layout.tsx` in favor of per-segment opt-in means any future route added outside `(auth)`/`dashboard` that needs per-request auth context must remember to set `force-dynamic` itself, with no safety net.
  evidence: The prior root layout comment stated `force-dynamic` existed because "chaibookLM requires authentication for all pages"; that blanket guarantee is now gone.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-1-public-landing-page-with-scroll-storytelling.md`
  summary: `app/middleware.ts` marking `'/'` as an exact public route has no automated test confirming it doesn't inadvertently widen to other paths.
  evidence: `isPublicRoute` is a `createRouteMatcher(['/', ...])` array with no accompanying middleware test in the diff.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: NeonRepository delete/rename are not user-scoped (TOCTOU defense-in-depth); ownership enforced only at the route/service layer.
  evidence: `deleteNotebook`/`renameNotebook` issue `DELETE/UPDATE ... WHERE id = $1` with no `user_id` predicate; a re-pointed id between check and repo call could bypass scoping.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: `NotebookService.create` calls `createUser(userId, '')`, which clobbers the user's email via `ON CONFLICT ... DO UPDATE SET email = EXCLUDED.email`.
  evidence: Pre-existing in Epic 1; every notebook create overwrites a real user's email with an empty string.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: Limits counters can only reconcile downward and `decrementCounter`/`reconcileCounter` silently no-op when no counter row exists.
  evidence: `reconcileCounter` sets `count = $3` unconditionally with no row guard; a stale-low counter can let a user exceed the persisted cap.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: GET /api/notebooks is destructive (prunes expired rows) and prunes per-notebook with N+1 queries on every dashboard load.
  evidence: Lazy TTL prune per AD-11 is by design, but the per-id delete loop and re-fetch add N+1 cost on GET.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: Denormalized `notebooks.source_count` is never maintained on any delete path.
  evidence: `source_count` column exists but no delete updates it; sources are added in Epic 3, at which point it will be wrong.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: No title-length cap on create or rename.
  evidence: A client can store arbitrarily long titles; rendered with `break-words`, so cosmetic but unbounded.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: POST create does not prune expired notebooks before the cap check, so expired-but-unpruned rows can block creation with 409.
  evidence: Pruning runs only on GET; a create landing between a GET and expiry can see a false cap.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: `getBackend` throws an unhandled 500 when `DATABASE_URL` is absent.
  evidence: Composition root throws on missing env rather than a graceful error; acceptable but not graceful.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-bring-and-index-your-sources.md`
  summary: The per-notebook source cap check is a non-atomic read-then-compare (`countSourcesByNotebook`), unlike the atomic per-user counter.
  evidence: `LimitsService.checkSourceCap` reads a live COUNT then compares, with an explicit comment noting no separate counter is used; two concurrent creates near the cap can both pass and exceed `maxSourcesPerNotebook`. Fixing requires adding a `sources_per_notebook` atomic counter akin to `sources_per_user`.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-bring-and-index-your-sources.md`
  summary: No recovery path for a source stuck in `processing` if the serverless function is killed mid-ingest.
  evidence: `void this.indexer.index(source.id).catch(() => {})` is fire-and-forget with no cron/worker sweep to retry or fail stuck sources; the UI shows an indefinite "Indexing" spinner with no recourse but delete-and-recreate.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-bring-and-index-your-sources.md`
  summary: `SourceService.create` swallows all `createUser`/`storage.put` errors identically to expected "already exists"/"unconfigured" cases, hiding genuine DB or storage failures.
  evidence: Both are wrapped in bare `.catch(() => {})`/`try { } catch { }` with no error-type discrimination; a real DB outage on `createUser` is indistinguishable from the idempotent no-op case.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-bring-and-index-your-sources.md`
  summary: No outbound timeouts on any adapter fetch call (Embeddings, Filebase, Qdrant, Jina reader).
  evidence: None of the four adapters use `AbortController`/timeout; a hung upstream blocks ingestion until the platform's own function timeout fires with no graceful "ingestion failed: timeout" message.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-bring-and-index-your-sources.md`
  summary: The 409 size-limit and count-limit rejections share the same `SOURCE_CAP_EXCEEDED` error code, so the client can't distinguish them to tailor messaging.
  evidence: `CreateSourceResult`'s `ok: false` branch has no `reasonCode` field; both size-exceeded and cap-exceeded paths return the identical shape from the route.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-ask-questions-and-get-grounded-streaming-answers.md`
  summary: `findRecentChatMessages` orders by `created_at DESC` with no tiebreaker, so same-millisecond rows (rapid consecutive turns) have unstable ordering.
  evidence: `chat_messages.id` is a random UUID (not sortable by insertion order) and there is no serial/sequence column; fixing requires a schema change to add a monotonic tiebreaker column.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-ask-questions-and-get-grounded-streaming-answers.md`
  summary: The plain-text stream's `CHAT_ERROR:` sentinel and the persisted `[[failed]]` content marker are in-band string matches with no framing, so genuine model output containing either literal substring would be misclassified as an error.
  evidence: Both `components/notebooks/api.ts` and `backend/src/contexts/chat/index.ts` scan raw text for these markers; the Design Notes explicitly chose plain-text streaming over structured framing (SSE/NDJSON) for simplicity until a later story needs richer event types — fixing this properly requires that framing change.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-ask-questions-and-get-grounded-streaming-answers.md`
  summary: `QdrantAdapter.search` trusts `data.result` and each point's payload fields (`span`, `text`, etc.) without runtime validation.
  evidence: A Qdrant schema drift or corrupted payload would surface as an `undefined` leaking into a prompt or a raw exception rather than a clear "retrieval failed" error; no validation/parsing layer exists between the REST response and `ScoredChunk[]`.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-ask-questions-and-get-grounded-streaming-answers.md`
  summary: No maximum length is enforced on the chat message body before it is persisted and forwarded to the LLM.
  evidence: `app/api/notebooks/[id]/chat/route.ts` only checks that `message` is a non-empty trimmed string; an arbitrarily long message increases LLM cost/latency unbounded, mirroring the same class of gap already deferred for source size limits.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-2-render-verifiable-citation-chips.md`
  summary: Both stream sentinels (`CHAT_ERROR:` and `CHAT_CITATIONS:`) parse their trailing payload as soon as the sentinel string is found in the buffered chunk, with no handling for the payload itself being split across multiple stream reads.
  evidence: `components/notebooks/api.ts`'s `streamChatMessage` holds back a tail long enough for a partial *sentinel* match, but once a sentinel is found it immediately slices/parses everything after it and breaks — if the JSON/text payload for either sentinel arrives split across two `reader.read()` calls, `CHAT_CITATIONS:`'s `JSON.parse` throws and is silently caught into `citations = []` (real citations silently dropped), and `CHAT_ERROR:`'s errorMessage would just be truncated. Fixing requires buffering both sentinels' payloads until the stream closes rather than parsing on first sight.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-2-render-verifiable-citation-chips.md`
  summary: Sentinel detection for both `CHAT_ERROR:` and `CHAT_CITATIONS:` is a plain substring search against raw streamed model text, so a model response that legitimately quotes either literal string would be misinterpreted as a trailer boundary.
  evidence: Pre-existing for `CHAT_ERROR_SENTINEL` (already deferred under spec-4-1); this story adds a second sentinel with the identical unframed-text risk, doubling the surface area. A proper fix needs structured stream framing (e.g. SSE/NDJSON) instead of in-band string sentinels.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-3-open-the-original-view-from-a-citation.md`
  summary: A Web Source's HTML snapshot fallback is rendered via `srcDoc` with no `<base href>`, so relative CSS/image/link assets in the captured page will render broken.
  evidence: The snapshot is a plain `fetch(url)` of the raw HTML response body (explicitly scoped as "not a rendered screenshot"); without a base URL, any relative asset reference in that HTML resolves against the app's own origin instead of the source page's, and nothing in the UI warns the user the fallback view may look visually broken.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-3-open-the-original-view-from-a-citation.md`
  summary: `ShowcasePanel`'s text-highlight span clamping silently absorbs an out-of-range or stale `span` without indicating the highlighted passage may be wrong.
  evidence: If a Text Source's content changes after a citation was generated (unlikely today since sources are immutable post-ingest, but not structurally prevented), `TextShowcase` clamps `span.start`/`span.end` into the current text's bounds and highlights whatever falls in that clamped range with no signal to the user that the citation may no longer point at the right passage.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-3-open-the-original-view-from-a-citation.md`
  summary: `ShowcasePanel` has no dedicated handling for a cited source whose `status` is no longer `'ready'` (e.g. reverted to `processing`/`failed` after the citing answer was given).
  evidence: The panel's not-found check only covers "source row missing entirely"; a source that still exists but is no longer `ready` falls through to whatever `SourceService.getContent` returns (which doesn't check `status`), rather than a dedicated "this source is currently unavailable" message.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-3-open-the-original-view-from-a-citation.md`
  summary: The SSRF guard on the ingestion-time snapshot fetch (`isUnsafeHost`) and the actual `fetch()` call perform independent DNS resolutions, so it doesn't fully close a DNS-rebinding/TOCTOU race — an attacker controlling DNS for a cited hostname (with a low TTL) could pass the pre-check with a public address and have `fetch` connect to a different, private/internal one moments later.
  evidence: `backend/src/contexts/ingestion/index.ts`'s `isUnsafeHost` resolves via `dns.lookup(hostname, { all: true })` and checks every returned address, then `captureSnapshot` calls `fetch(current, ...)` which performs its own, unrelated resolution — the two are not pinned to the same address. A full fix requires a custom low-level dispatcher/connect hook that resolves once and reuses that exact address for the actual connection, which is a more invasive change than this story's scope.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-3-open-the-original-view-from-a-citation.md`
  summary: Esc cannot close the Showcase panel while keyboard focus is inside the live cross-origin `<iframe>` embedding a Web Source.
  evidence: `ShowcasePanel`'s Esc handling is a `window`-level `keydown` listener; a cross-origin iframe's document never bubbles its key events to the parent window (a browser security boundary, not a bug in this code) — a user who tabs/clicks into the embedded page and presses Esc there sees nothing happen. No fix is possible without cooperation from the framed page (e.g. `postMessage`), which is out of this story's control.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-3-open-the-original-view-from-a-citation.md`
  summary: Switching from the Chat tab to any other tab (including the new Showcase navigation this story adds) fully unmounts `ChatPanel`, silently resetting the visible conversation to empty on return, since chat history is local `useState` with no server-side reload on mount.
  evidence: `components/ui/tabs.tsx`'s `Tabs` renders only the active tab's content (`children(active)`), and `ChatPanel`'s `turns` state (`components/chat/chat-panel.tsx`) has no effect that fetches persisted history back from `chat_messages` on mount — that reload is explicitly Story 4.5's scope ("persist chat history with a sliding window"). This gap pre-dates Story 4.3, but 4.3's core interaction (click a citation → navigate away from Chat) makes it load-bearing on the primary happy path for the first time (previously a user had little reason to leave a mid-conversation Chat tab). Verify this handoff explicitly once Story 4.5 lands — the Showcase → Esc → Chat round trip must not lose the conversation.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-4-refuse-honestly-and-fetch-on-refusal.md`
  summary: The new `CHAT_REFUSAL:` sentinel scan in `components/notebooks/api.ts` extends the same in-band, unframed substring-sentinel scheme already used for `CHAT_ERROR:`/`CHAT_CITATIONS:`, so it inherits the identical risk of a legitimate model response that quotes the literal string being misread as a trailer boundary.
  evidence: Same root cause as the pre-existing `CHAT_ERROR_SENTINEL`/`CHAT_CITATIONS_SENTINEL` entry above (already deferred under spec-4-1/4-2); this story adds a third sentinel via the identical tail-buffered scan in `streamChatMessage`, further widening the surface area a structured stream-framing fix (SSE/NDJSON) would need to cover.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-5-persist-chat-history-with-a-sliding-window.md`
  summary: `ChatPanel`'s history-loading fetches (`loadInitialHistory`/`loadOlderHistory`) have no `AbortController`/cancellation tied to `notebookId`, and `initialHistoryLoadedRef` guards the mount-load effect to fire at most once per component instance -- if a user navigates between two notebooks' chat views without `ChatPanel` unmounting (e.g. a client-side route transition that preserves component identity across a dynamic-segment change), the new notebook's history never (re)loads, and any history fetch still in flight for the previous notebook could resolve afterward and contaminate the new notebook's turn list.
  evidence: `components/chat/chat-panel.tsx`'s `turns` state was never reset on a `notebookId` prop change even before this story (a pre-existing gap this story's mount-once load semantics now makes load-bearing for the first time, since previously an unrefreshed chat was simply and harmlessly empty). Whether this is reachable depends on Next.js App Router's actual remount behavior for `/notebook/[id]` navigations, which was not verified at implementation time -- confirm whether `Workspace`/`ChatPanel` remounts on notebook switch, and if not, key `ChatPanel` by `notebookId` or add an effect that resets pagination state and aborts in-flight history fetches when `notebookId` changes.
