---
title: 'First-run product walkthrough'
type: 'feature'
created: '2026-08-11'
status: 'in-review'
review_loop_iteration: 0
followup_review_recommended: false
baseline_revision: 'c8ef8518dbd8d06e25eaa77e5eed134c5508a5eb'
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md']
warnings: []
---

<intent-contract>

## Intent

**Problem:** A signed-in user's first visit to a notebook workspace (`app/dashboard/notebook/[id]/page.tsx`, rendering `components/notebooks/workspace.tsx`'s three tabs: Sources, Chat, Showcase) has no orientation — nothing explains the trust loop (source → ask → citation → original view) that is central to the product. `driver.js` (1.8.0) is already an installed dependency but unused anywhere in the codebase.

**Approach:** Add a `driver.js`-powered walkthrough that runs automatically the first time a signed-in user opens any notebook, highlighting the Sources, Chat, and Showcase tabs (`#tab-sources`, `#tab-chat`, `#tab-showcase` — real DOM ids already rendered by `components/ui/tabs.tsx`). Track "has seen the tour" in `localStorage` keyed by the Clerk user id (not a cookie — this is first-run UI state, not a persisted preference gated by the story 5.3 consent banner). Add a "Replay tour" control to the `/dashboard/account` page (built in story 5.3) that resets the flag and re-triggers the tour.

## Boundaries & Constraints

**Always:**
- The tour runs automatically on a signed-in user's first notebook visit (no `hasSeenTour:<userId>` entry in `localStorage`), highlighting `#tab-sources`, `#tab-chat`, `#tab-showcase` in that order with one short explanatory line each.
- Completing or dismissing the tour (any exit path) sets `hasSeenTour:<userId>` in `localStorage` so it never auto-runs again for that user.
- The tour is dismissible at any point (driver.js's built-in close button, Escape, and overlay click all end it and mark it seen).
- `/dashboard/account` gets a "Replay product tour" button that clears the flag and immediately re-triggers the tour on the current page (or, if not on a notebook page, navigates to the most recently used notebook — see Block If).
- Under `prefers-reduced-motion: reduce`, disable driver.js's built-in popover/highlight animation (`animate: false` in its config) — steps still appear, just without motion.
- The tour overlay uses `role="dialog"` `aria-modal="true"`, traps focus within the active popover, and closes on Escape — matching the existing `components/ui/dialog.tsx` convention (driver.js supports `overlayOpacity`/custom popover class; the popover's ARIA attributes are configured via driver.js's `popoverClass` + a rendered wrapper, since driver.js does not natively emit `role="dialog"`/`aria-modal`, so this spec requires setting them explicitly via driver.js's `onPopoverRender` hook).
- Tour copy and popover styling reuse the existing neo-brutalist design tokens (2px ink border, hard shadow, no rounded corners) via driver.js's `popoverClass` CSS hook rather than its default theme.

**Block If:** If "Replay tour" is clicked while the user has zero notebooks (nothing to highlight tabs on), skip navigation and show an inline message ("Create a notebook first to replay the tour") instead of guessing a destination — this is not a human-input block, it's a deterministic empty-state the implementation must handle, listed here only because it changes the button's behavior; no HALT needed.

**Never:**
- No new dependency beyond the already-installed `driver.js`.
- Do not change the Sources/Chat/Showcase tab implementation itself (`components/ui/tabs.tsx`, `components/notebooks/workspace.tsx`) beyond reading their existing DOM ids as tour targets.
- Do not gate the tour's first-run flag behind cookie consent (story 5.3) — it is `localStorage`-based UI state, not a tracked preference.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First notebook visit, no flag set | `localStorage` has no `hasSeenTour:<userId>` | Tour auto-starts, highlights the 3 tabs in order | No error expected |
| Return visit, flag set | `hasSeenTour:<userId>` = `'true'` | Tour does not auto-start | No error expected |
| User dismisses mid-tour (Escape/overlay/close button) | Tour active | Tour ends immediately, flag is set, no further auto-start | No error expected |
| `prefers-reduced-motion: reduce` | Tour would run | Tour runs without highlight/popover animation | No error expected |
| Replay from Account, has notebooks | User clicks "Replay product tour" | Flag cleared, tour re-triggers on the most recently visited notebook | No error expected |
| Replay from Account, zero notebooks | User clicks "Replay product tour" | Inline message shown, no navigation, no crash | No error expected |
| `localStorage` unavailable (e.g. private-mode restrictions throwing) | Any tour check | Falls back to never auto-starting the tour (fails safe, no crash) rather than showing it on every load | Caught and logged, no user-facing error |

</intent-contract>

## Code Map

- `components/notebooks/workspace.tsx` -- mount the tour trigger once the three tabs exist in the DOM
- `components/tour/use-product-tour.ts` (new) -- hook encapsulating driver.js setup, first-run check, and reduced-motion handling
- `components/tour/tour-config.ts` (new) -- step definitions targeting `#tab-sources`, `#tab-chat`, `#tab-showcase`
- `components/tour/tour-storage.ts` (new) -- `hasSeenTour(userId)`/`markTourSeen(userId)`/`resetTour(userId)`, SSR/localStorage-unavailable-safe
- `app/globals.css` -- scoped `driver.js`-popover override classes matching design tokens
- `app/dashboard/account/page.tsx` -- add "Replay product tour" control
- `components/ui/tabs.tsx` -- reference only, confirms `#tab-{id}` DOM ids already exist

## Tasks & Acceptance

**Execution:**
- [x] `components/tour/tour-storage.ts` (new) -- `hasSeenTour(userId): boolean`, `markTourSeen(userId): void`, `resetTour(userId): void`; every function wrapped in try/catch around `localStorage` access, returning safe defaults (`hasSeenTour` → `true`, i.e. fail-safe-never-show, on any thrown error) -- the first-run flag primitive
- [x] `components/tour/tour-config.ts` (new) -- exports an ordered array of `{ element: '#tab-sources' | '#tab-chat' | '#tab-showcase', popover: { title, description } }` driver.js step objects with one short sentence each describing the source → chat → citation/showcase trust loop -- the actual tour content
- [x] `components/tour/use-product-tour.ts` (new) -- client hook: takes `userId`; on mount, if `!hasSeenTour(userId)` and all three tab elements exist in the DOM, dynamically imports `driver.js`, configures it with `animate: !prefersReducedMotion()` (reuse `prefersReducedMotion` from `components/landing/use-scroll-reveal.ts`), `onPopoverRender` to set `role="dialog"` and `aria-modal="true"` on the rendered popover element, and an `onDestroyed`/`onCloseClick` callback that calls `markTourSeen(userId)`; also exposes a `replay(): { ok: boolean }` function that calls `resetTour(userId)` and restarts the drive -- the orchestration hook
- [x] `components/notebooks/workspace.tsx` -- call `useProductTour(userId)` (userId sourced the same way the rest of the authenticated app does; if no existing client-side user-id source exists in this component, read it via Clerk's `useUser()` client hook) once the three tab buttons are rendered -- wires the auto-run trigger into the one page where all three tabs exist
- [x] `app/globals.css` -- add a small `.chai-tour-popover` rule block (2px ink border, hard offset shadow, no border-radius, ink/surface tokens with `.dark` pairing) and pass `popoverClass: 'chai-tour-popover'` from `use-product-tour.ts` -- keeps the tour visually consistent with the rest of the neo-brutalist UI instead of driver.js's default theme
- [x] `app/dashboard/account/page.tsx` -- add a "Replay product tour" button; if the user has zero notebooks (check via the existing notebooks list query already used elsewhere, e.g. the same query `components/notebooks/notebook-grid.tsx` uses), disable the button and show "Create a notebook first to replay the tour" instead of navigating; otherwise navigate to `/dashboard/notebook/[mostRecentId]` and pass a query param or session flag the workspace reads to call `replay()` immediately on load -- the account-page replay entry point
- [x] `components/tour/tour.test.tsx` (new, matching existing vitest conventions) -- unit tests for `tour-storage.ts`'s try/catch fallback behavior when `localStorage` throws, and for the reduced-motion `animate` flag computation -- covers the I/O matrix's `localStorage`-unavailable and reduced-motion edge cases

**Acceptance Criteria:**
- Given a signed-in user's first notebook visit, when the workspace renders, then the tour auto-starts and highlights Sources, Chat, and Showcase tabs in order.
- Given the tour is dismissed by any exit path, when the user revisits any notebook later, then the tour does not auto-start again.
- Given `prefers-reduced-motion: reduce`, when the tour runs, then no highlight/popover animation plays.
- Given the tour is active, when the user presses Escape or clicks the overlay, then it closes, focus is not left stranded, and the popover was marked `role="dialog"` `aria-modal="true"` while open.
- Given a user on `/dashboard/account`, when they click "Replay product tour" with at least one notebook, then the tour re-runs; with zero notebooks, then an inline message appears instead of a crash or dead navigation.

## Spec Change Log

## Review Triage Log

### 2026-08-11 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 3 (medium 2, low 1)
- defer: 5 (medium 1, low 4)
- reject: 1 (low 1)
- addressed_findings:
  - `[medium]` `[patch]` A React Strict Mode / effect-re-invocation edge could fall through from the `autoReplay` branch into the first-run branch and start a second `driver.js` instance after `resetTour` ran; added a `startedRef`-style guard (`if (autoReplayedRef.current) return;`) to prevent the fallthrough.
  - `[medium]` `[patch]` `buildAndDrive`'s dynamic `import('driver.js')` could resolve after the component/effect had already unmounted, driving a tour on a dead DOM; added an abort-ref checked immediately after the import resolves.
  - `[low]` `[patch]` The account page's zero-notebooks empty state didn't distinguish a real fetch error from "no notebooks yet," and `mostRecent.id` wasn't guarded against being falsy; added an `isError` branch with its own message and a guard before navigating.

## Design Notes

driver.js does not emit ARIA dialog semantics itself — `onPopoverRender(popover)` is called with the rendered DOM node, which is where `role`/`aria-modal` are set imperatively. This is a documented driver.js extension point, not a hack around its internals.

## Verification

**Commands:**
- `npm test` -- expected: new tour tests pass alongside existing suite
- `npm run build` -- expected: succeeds with no new type errors

**Manual checks (if no CLI):**
- Clear `localStorage`, open a notebook — tour auto-starts across the three tabs.
- Reload the same notebook — tour does not restart.
- Set OS reduced-motion, clear the flag, reopen — tour appears without animated transitions.
- From `/dashboard/account`, click "Replay product tour" — tour restarts on the most recent notebook.
</content>
