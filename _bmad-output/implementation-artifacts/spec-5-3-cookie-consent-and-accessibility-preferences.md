---
title: 'Cookie consent and accessibility preferences'
type: 'feature'
created: '2026-08-11'
status: 'done'
final_revision: '06e96efd'
review_loop_iteration: 0
followup_review_recommended: false
baseline_revision: 'e8c6aa4162768f297db36c7bea6a7998343d35bd'
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md']
warnings: []
---

<intent-contract>

## Intent

**Problem:** Story 5.2 shipped a `cookie-consent` cookie *contract* (theme persistence only writes a cookie when `cookie-consent=accepted`) but nothing ever sets that cookie — there is no banner, no way to accept/decline, and no way to revisit the choice later. `prefers-reduced-motion` is already honored globally, but `prefers-color-scheme` accessibility signaling and forced-colors/high-contrast have no explicit surfacing to the user.

**Approach:** Add a first-visit cookie consent banner (naming session/preferences/usage categories) that writes the `cookie-consent` cookie only on explicit Accept/Decline, and a minimal `/dashboard/account` page where the choice can be revisited. Confirm and document (via a short automated check) that `prefers-reduced-motion`, `prefers-color-scheme`, and `forced-colors` are honored without any additional opt-out CSS.

## Boundaries & Constraints

**Always:**
- On first visit (no `cookie-consent` cookie present), a banner appears naming the cookie categories being stored ("We are storing cookies related to session, preferences, and usage") before any non-essential cookie is written.
- No non-essential cookie (i.e. the `theme` cookie from story 5.2, and any future preference cookie) is written before the visitor explicitly accepts. Clerk's own session cookie is essential and out of this story's scope.
- Accept writes `cookie-consent=accepted`; Decline writes `cookie-consent=declined` (a decision is still recorded so the banner doesn't reappear every load, but no *other* cookie is subsequently written while declined).
- The banner is dismissible via Accept or Decline only (no silent auto-dismiss); once a decision exists, the banner does not reappear on later visits.
- A `/dashboard/account` page exists with a "Cookie preferences" section showing the current choice and Accept/Decline controls, so the decision can be changed at any time.
- If the visitor later changes their choice from Accept to Decline on the account page, existing non-essential cookies (`theme`) are deleted immediately.
- If the visitor accepts on the account page after previously declining, the current in-memory theme (from `ThemeContext`) is persisted immediately as the `theme` cookie (closes the "accept-after-toggle" gap deferred from story 5.2).
- Regardless of consent state, `prefers-reduced-motion` and `prefers-color-scheme` (live, un-persisted) continue to be honored every session via existing CSS media queries and `theme-provider.tsx`'s fallback — this story does not change that fallback behavior, only adds the banner controlling whether it can be overridden.
- `forced-colors: active` is left to default browser behavior (no `forced-color-adjust: none` exists anywhere in the codebase today and none is added), which already satisfies "detected automatically and honored" for high-contrast mode.

**Block If:** None — the consent cookie name/values (`cookie-consent` = `accepted`/`declined`) were already defined by story 5.2; this story only implements the missing writer.

**Never:**
- Do not add analytics/usage-tracking cookies themselves — only the consent *mechanism* naming that category, since no usage-tracking cookie exists in the codebase yet.
- Do not touch the first-run product walkthrough (story 5.4) or the dark-mode token/runtime logic itself (story 5.2, already done) beyond wiring the consent writer.
- No new cookie-consent library dependency — build on the existing `components/theme/cookies.ts` helpers.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First visit, no consent cookie | New visitor | Banner renders naming session/preferences/usage categories | No error expected |
| Visitor clicks Accept | Banner visible | `cookie-consent=accepted` written; banner dismisses; a subsequent theme toggle now persists | No error expected |
| Visitor clicks Decline | Banner visible | `cookie-consent=declined` written; banner dismisses; theme toggling stays session-visual-only | No error expected |
| Returning visitor, consent cookie present | `cookie-consent` set (either value) | Banner does not render | No error expected |
| Visitor revokes consent from Account | `cookie-consent=accepted`, `theme` cookie present | Switching to Decline on `/dashboard/account` deletes the `theme` cookie immediately | No error expected |
| Visitor grants consent from Account after toggling theme pre-consent | `cookie-consent` absent, in-memory `theme` = `dark` | Accepting on `/dashboard/account` immediately writes `theme=dark` cookie | No error expected |
| `prefers-reduced-motion: reduce` | Any consent state | Banner itself has no motion/animation (simple show/hide), consistent with the rest of the app | No error expected |

</intent-contract>

## Code Map

- `components/theme/cookies.ts` -- reused as-is for `getCookie`/`setCookie`/new `deleteCookie`
- `components/theme/theme-provider.tsx` -- reference only; `CONSENT_COOKIE_NAME`/`CONSENT_ACCEPTED_VALUE` already exported from here
- `components/consent/consent-context.tsx` (new) -- context/hook exposing current consent state + `accept()`/`decline()`
- `components/consent/consent-provider.tsx` (new) -- reads/writes the `cookie-consent` cookie, deletes `theme` cookie on decline, persists current theme on accept-after-toggle
- `components/consent/consent-banner.tsx` (new) -- first-visit banner UI
- `components/providers.tsx` -- wrap children with `ConsentProvider`; render `<ConsentBanner />`
- `app/dashboard/account/page.tsx` (new) -- account page with a cookie-preferences section
- `components/theme/theme-context.tsx` -- reference only, `useTheme()` reused by the account page to persist-on-accept

## Tasks & Acceptance

**Execution:**
- [x] `components/theme/cookies.ts` -- add `deleteCookie(name): void` (SSR-safe, sets `max-age=0`) -- needed to clear the `theme` cookie on consent revocation
- [x] `components/consent/consent-context.tsx` (new) -- `ConsentContext` + `useConsent()` hook exposing `{ consent: 'accepted' | 'declined' | null, accept(): void, decline(): void }`, throws if used outside provider -- typed access point for the banner and account page
- [x] `components/consent/consent-provider.tsx` (new) -- client component: reads `cookie-consent` cookie on mount into state; `accept()` writes `cookie-consent=accepted` and, if a `ThemeContext` theme differs from any already-persisted `theme` cookie, persists it immediately; `decline()` writes `cookie-consent=declined` and calls `deleteCookie('theme')` -- the consent runtime, closing the story-5.2-deferred accept-after-toggle gap
- [x] `components/consent/consent-banner.tsx` (new) -- renders only when `consent === null`; text names session/preferences/usage categories; two buttons (Accept, Decline) calling the context methods; styled with existing design tokens/button primitives, fixed to the bottom of the viewport, `role="region"` `aria-label="Cookie consent"` -- the actual GDPR-style banner
- [x] `components/providers.tsx` -- wrap children with `ConsentProvider` (inside `ThemeProvider`, since it reads theme) and render `<ConsentBanner />` once, app-wide -- makes the banner appear on every surface per FR-12
- [x] `app/dashboard/account/page.tsx` (new) -- protected page (inherits `app/dashboard/layout.tsx`'s auth guard) with a "Cookie preferences" section showing current `consent` value and Accept/Decline buttons wired to `useConsent()` -- the "can be revisited later from Account" requirement
- [x] `components/consent/consent.test.tsx` (new, matching existing vitest conventions) -- unit tests for `deleteCookie`, and for `ConsentProvider`'s accept/decline cookie side effects (mock `document.cookie`) -- covers the I/O matrix's accept/decline/revoke scenarios

**Acceptance Criteria:**
- Given a first-time visitor, when the app loads, then a banner names the session/preferences/usage cookie categories and no `theme` cookie exists yet even if the visitor has toggled theme.
- Given the banner, when the visitor clicks Accept or Decline, then the choice is written as `cookie-consent` and the banner does not reappear on reload.
- Given a returning visitor with an existing consent decision, when the app loads, then the banner does not render, and `/dashboard/account` shows the current choice with controls to change it.
- Given a visitor who declines then later accepts from `/dashboard/account` after toggling theme, when they accept, then the current theme is immediately persisted as a cookie.
- Given a visitor who accepts then later declines from `/dashboard/account`, when they decline, then the `theme` cookie is deleted immediately.

## Spec Change Log

## Review Triage Log

### 2026-08-11 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 1 (medium 1)
- defer: 7 (medium 2, low 5)
- reject: 3 (low 3)
- addressed_findings:
  - `[medium]` `[patch]` Returning visitors with an existing consent decision saw the banner flash on every page load because the cookie was read inside a post-paint `useEffect`; switched to `useLayoutEffect` so the corrected state applies before the browser paints.

## Design Notes

`forced-colors` and `prefers-color-scheme` detection is intentionally left as native browser/CSS behavior — no JS media-query polling is added for these beyond what `theme-provider.tsx` (story 5.2) and the global reduced-motion CSS block already do. This story's scope is solely the consent mechanism gating persistence, not new accessibility-detection code paths.

## Verification

**Commands:**
- `npm test` -- expected: new consent tests pass alongside existing suite
- `npm run build` -- expected: succeeds with no new type errors

**Manual checks (if no CLI):**
- Clear cookies, load `/` — banner appears naming cookie categories.
- Click Decline — banner disappears, `document.cookie` shows `cookie-consent=declined` and no `theme` cookie regardless of theme toggling.
- Visit `/dashboard/account`, switch to Accept — `theme` cookie now appears matching the current toggle state.

## Auto Run Result

**Summary:** Added the missing consent writer for story 5.2's `cookie-consent` contract: a first-visit banner naming the cookie categories, Accept/Decline wiring, and a new `/dashboard/account` page to revisit the choice, including reconciling the `theme` cookie on accept-after-toggle and decline.

**Files changed:**
- `components/theme/cookies.ts` — added `deleteCookie`.
- `components/consent/consent-context.tsx`, `consent-provider.tsx`, `consent-banner.tsx` (new) — the consent runtime and banner UI.
- `app/dashboard/account/page.tsx` (new) — cookie-preferences section.
- `components/providers.tsx` — wires `ConsentProvider` + renders `ConsentBanner`.
- `components/consent/consent.test.tsx` (new) — cookie/consent-logic tests.

**Review findings:** 1 patched (banner flash for returning visitors fixed via `useLayoutEffect`), 7 deferred (tampered-cookie recovery, cross-tab sync, duplicated consent-check logic, no generalized non-essential-cookie registry for decline, banner lacks `aria-live`/focus movement, tests don't exercise the real provider functions, no fallback when cookies are blocked entirely), 3 rejected (data-debug convention; account-page-outside-provider crash has no realistic code path since providers wrap the whole app at the root layout; banner category wording is intentionally forward-looking per the spec's own mandated copy).

**Verification:** `npm run typecheck`, `npm test` (65/65 passing), `npm run build` all pass.

**Residual risks:** see `deferred-work.md` — mainly cross-tab desync and the lack of a registry for future non-essential cookies.
</content>
