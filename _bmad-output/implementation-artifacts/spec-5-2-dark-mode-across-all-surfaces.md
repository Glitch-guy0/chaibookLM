---
title: 'Dark mode across all surfaces'
type: 'feature'
created: '2026-08-11'
status: 'in-review'
review_loop_iteration: 0
followup_review_recommended: false
baseline_revision: '1c41bc9fd496b431301bd72411fc0089eb303f4f'
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md']
warnings: []
---

<intent-contract>

## Intent

**Problem:** Components throughout the app (`app/dashboard/layout.tsx`, `app/(auth)/sign-in/page.tsx`, etc.) already reference `dark:bg-surface-dark`, `dark:border-border-dark`, `dark:text-ink-dark`, and similar Tailwind dark-variant utilities, but `app/globals.css`'s `@theme` block never defines the matching `-dark`-suffixed color tokens — so those utilities generate no CSS and are silently inert. There is also no mechanism anywhere that ever adds a `dark` class to `<html>`, so dark mode has never actually activated on any surface, and there is no theme toggle or persistence.

**Approach:** Add the missing `-dark`-suffixed tokens to the `@theme` block in `app/globals.css` (values already exist in the `.dark { ... }` override block — copy them across as parallel `-dark` tokens rather than switched originals) so every existing `dark:*-dark` utility across the codebase starts resolving. Add a small client-side theme system: a blocking inline script in `app/layout.tsx` that sets the `dark` class on `<html>` before paint (from a stored preference cookie if present, else `prefers-color-scheme`), a `ThemeToggle` component with a React context/hook for reading and flipping the current theme, and a `color-scheme` declaration kept in sync on both `:root`/`html` and `body`.

## Boundaries & Constraints

**Always:**
- On any surface, when `prefers-color-scheme: dark` and no stored override exists, the `dark` class is present on `<html>` before first paint (via a blocking inline script in `<head>`, not a post-hydration `useEffect`) — no flash of light UI.
- `color-scheme` is set to `light`/`dark` matching the active theme on both `html` and `body` (`app/globals.css` currently sets it only via the `:root`/`.dark` selectors, which target `html` already — add the same declaration scoped to `body` so both roots agree, since some UA form-control styling keys off the nearest ancestor).
- The `@theme` block in `app/globals.css` gains one `-dark` token per existing `.dark { --color-x: ... }` override (e.g. `--color-surface-dark`, `--color-surface-elevated-dark`, `--color-ink-dark`, `--color-ink-secondary-dark`, `--color-ink-muted-dark`, `--color-border-dark`, `--color-focus-ring-dark`, `--color-brand-dark` [already exists], `--color-cite-dark` [already exists], `--color-accent-yellow-dark` [already exists], `--color-accent-pink-dark` [already exists], `--color-success-dark`, `--color-warning-dark`, `--color-error-dark`, `--shadow-card-dark`, `--shadow-dialog-dark`, `--shadow-button-dark`) using the exact values already present in the `.dark` block, so every existing `dark:token-dark` utility class in the codebase resolves without touching component files.
- A manual theme toggle exists (`ThemeToggle` component) and is mounted in `app/dashboard/layout.tsx`'s header (next to `UserButton`) — the only persistent chrome surface in the app today.
- Manual toggle writes a `theme` cookie (`'light' | 'dark'`) ONLY if a `cookie-consent` cookie is already present and set to `accepted`; if no consent cookie exists, the toggle still updates the in-memory/`<html>` state for the current page load (session-visual-only) without writing any cookie — this is the integration seam for story 5.3's consent banner, which does not exist yet.
- If cookies are declined or absent, every fresh page load re-derives theme from live `prefers-color-scheme` (no stale persisted override without consent).
- Switching theme must not remount/reset component state (pure CSS var + class toggle, no page reload).

**Block If:** None — the consent cookie contract (`cookie-consent=accepted`) is a name this spec defines for story 5.3 to implement against; no ambiguity blocks this story's own scope.

**Never:**
- No new theming library dependency (no `next-themes`) — the existing manual `.dark`-class-on-`html` + CSS-custom-property approach is kept, just completed with the missing tokens.
- Do not build the cookie consent banner itself, or accessibility-preference detection beyond `prefers-color-scheme` — those are story 5.3.
- Do not change token *values* — only add the missing `-dark`-suffixed declarations using values already defined in the existing `.dark` block.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First visit, OS dark mode on, no cookies | `prefers-color-scheme: dark`, no `theme`/`cookie-consent` cookies | `<html>` has `dark` class before first paint; no flash of light UI | No error expected |
| First visit, OS light mode, no cookies | `prefers-color-scheme: light` | `<html>` has no `dark` class | No error expected |
| Manual toggle, consent already accepted | `cookie-consent=accepted` cookie present | Toggling sets/removes `dark` class immediately and persists a `theme` cookie that is honored on next visit | No error expected |
| Manual toggle, no consent cookie | No `cookie-consent` cookie | Toggling still updates the current page's theme, but no `theme` cookie is written; next fresh load reverts to live `prefers-color-scheme` | No error expected |
| Theme switch mid-session | User has state in a form/notebook view, toggles theme | Component state (e.g. current notebook, in-progress source removal) is preserved; only visual theme changes | No error expected |
| `prefers-color-scheme` unsupported (old browser) | `matchMedia` unavailable | Defaults to light theme, no crash | No error expected |

</intent-contract>

## Code Map

- `app/globals.css` -- add missing `-dark` tokens to `@theme`; add `color-scheme` on `body`
- `app/layout.tsx` -- add blocking inline theme-init script in `<head>`
- `components/theme/theme-context.tsx` (new) -- React context + `useTheme()` hook exposing `{ theme, setTheme }`
- `components/theme/theme-toggle.tsx` (new) -- toggle button UI, uses `useTheme()`
- `components/theme/theme-provider.tsx` (new) -- client component wiring context state to the `<html>` class + cookie read/write
- `components/theme/cookies.ts` (new) -- tiny cookie get/set helpers (`getCookie`, `setCookie`) shared by theme (and reusable by story 5.3's consent banner)
- `components/providers.tsx` -- wrap children with the new `ThemeProvider`
- `app/dashboard/layout.tsx` -- mount `<ThemeToggle />` in the header

## Tasks & Acceptance

**Execution:**
- [x] `app/globals.css` -- add the missing `-dark`-suffixed color/shadow tokens to `@theme` (copying values from the existing `.dark {}` block) and add `body { color-scheme: inherit; }`-equivalent explicit light/dark declaration scoped to `body` under `.dark body`/default -- makes every existing `dark:*-dark` utility class in the codebase resolve, and aligns `color-scheme` on both roots
- [x] `components/theme/cookies.ts` (new) -- `getCookie(name): string | null` and `setCookie(name, value, days)` helpers, SSR-safe (no-op / return null when `document` is undefined) -- shared cookie primitive for theme and (later) consent
- [x] `components/theme/theme-context.tsx` (new) -- `ThemeContext` + `useTheme()` hook throwing if used outside the provider -- typed access point for the toggle
- [x] `components/theme/theme-provider.tsx` (new) -- client component: on mount, reads `theme` cookie if `cookie-consent=accepted`, else falls back to `window.matchMedia('(prefers-color-scheme: dark)')`; exposes `setTheme` that toggles the `dark` class on `document.documentElement`, updates state, and conditionally persists per the consent rule above -- the runtime theme engine
- [x] `app/layout.tsx` -- add an inline `<script>` (via `dangerouslySetInnerHTML`, no external file, executed synchronously in `<head>` before `body` renders) that reads the `theme` cookie or `prefers-color-scheme` and sets `document.documentElement.classList` accordingly, then wrap `children` with the new `ThemeProvider` inside `Providers` -- eliminates flash-of-light-UI, matching the "no FOUC" requirement
- [x] `components/theme/theme-toggle.tsx` (new) -- button using `useTheme()`, accessible label ("Switch to dark/light mode"), styled with existing button primitives -- the manual override control
- [x] `components/providers.tsx` -- wrap `children` with `ThemeProvider` -- makes `useTheme()` available app-wide
- [x] `app/dashboard/layout.tsx` -- render `<ThemeToggle />` next to `<UserButton />` in the header -- gives users a reachable manual override on the one persistent chrome surface today
- [x] `components/theme/theme.test.tsx` (new, matching existing vitest conventions) -- unit tests for `cookies.ts` helpers and for the consent-gated persistence branch in `theme-provider.tsx` (mock `document.cookie`, assert no write occurs without `cookie-consent=accepted`, and that state still updates)

**Acceptance Criteria:**
- Given `prefers-color-scheme: dark` and no cookies, when any page loads, then `<html>` carries the `dark` class before first paint with no flash of light UI.
- Given a user without a `cookie-consent` cookie, when they use the manual theme toggle, then the visual theme changes for the current page but no `theme` cookie is written, and a fresh reload reverts to the live OS preference.
- Given a user with `cookie-consent=accepted`, when they toggle theme, then a `theme` cookie persists the choice and it is honored on the next visit.
- Given any theme, when `color-scheme` is inspected on both `html` and `body`, then both report the same value matching the active theme.
- Given a user mid-interaction (e.g. viewing a notebook), when they toggle theme, then no component state is lost or reset.

## Spec Change Log

## Review Triage Log

### 2026-08-11 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 4 (medium 2, low 2)
- defer: 5 (medium 1, low 4)
- reject: 8 (low 8)
- addressed_findings:
  - `[medium]` `[patch]` `ThemeProvider`'s mount effect resolved theme into React state but never called `applyThemeClass`, risking DOM/state divergence if `resolveTheme()` disagreed with what the blocking inline script had already set; the effect now applies the class too.
  - `[medium]` `[patch]` `resolveTheme()` had an unreachable `typeof window === 'undefined'` branch after already checking `typeof document === 'undefined'`; removed the dead check.
  - `[low]` `[patch]` `ThemeToggle` was missing `aria-pressed` on its two-state control; added.
  - `[low]` `[patch]` `setCookie` didn't set the `Secure` flag on HTTPS origins; added conditionally on `location.protocol`.

## Design Notes

`-dark` tokens are added as *parallel* tokens (not replacing the existing `.dark { --color-x: ... }` same-name override pattern already used by the majority of components that write plain `bg-surface dark:bg-surface-dark`-style pairs referencing the *same* CSS variable name under both selectors). Both mechanisms coexist safely: `--color-surface-dark` (new, static value, used by `dark:bg-surface-dark` Tailwind utility) and `--color-surface` (existing, value swapped by the `.dark` class selector, used by plain `bg-surface`). They resolve to the same colors by construction since both are copied from the same design tokens, so visually there is no conflict — this spec only fixes utilities that were referencing the nonexistent `-dark` variant, without touching the working `.dark`-class-swap components.

## Verification

**Commands:**
- `npm test` -- expected: new theme tests pass alongside existing suite
- `npm run build` -- expected: succeeds with no new type errors

**Manual checks (if no CLI):**
- Set OS to dark mode, reload `/dashboard` — header, cards, and text render in dark tokens immediately, no flash.
- Toggle theme via the new button with no consent cookie set — theme changes, `document.cookie` shows no `theme` entry; reload reverts to OS preference.
- Set a `cookie-consent=accepted` cookie manually via devtools, toggle theme, reload — theme choice persists.
</content>
