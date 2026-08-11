---
title: 'Public landing page with scroll storytelling'
type: 'feature'
created: '2026-08-11'
status: 'in-review'
review_loop_iteration: 0
followup_review_recommended: false
baseline_revision: '3ee0a014aebd1766aa3d1995c1e8f1d237c99fdc'
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md']
warnings: []
---

<intent-contract>

## Intent

**Problem:** `/` currently renders the authenticated dashboard directly (`app/(dashboard)/page.tsx`), so unauthenticated visitors are forced through Clerk auth with no explanation of the product. There is no public page telling the "grounded, verifiable" story before sign-in.

**Approach:** Move the authenticated dashboard from `/` to `/dashboard` (the env already declares `CLERK_AFTER_SIGN_IN_URL=/dashboard`/`CLERK_AFTER_SIGN_UP_URL=/dashboard`, confirming this target), add `/` and `/dashboard` handling to middleware, and build a new public `/` landing page with scroll-triggered reveal sections (no animation library — use `IntersectionObserver` + CSS transitions) that explains the product and links to `/sign-in`.

## Boundaries & Constraints

**Always:**
- `/` must render for unauthenticated visitors without triggering Clerk's `auth().protect()` redirect.
- Scroll reveal implemented via `IntersectionObserver` toggling a CSS class (opacity/translate transition), not a new animation library dependency.
- Respect `prefers-reduced-motion`: when set, sections render fully visible immediately (no observer-driven transition, no smooth-scroll).
- `scroll-behavior: smooth` only applied outside reduced-motion (global CSS already forces `scroll-behavior: auto` under reduced-motion at `app/globals.css` ~line 136-144 — reuse that, don't fight it).
- Fully responsive from 320px up; use existing Tailwind v4 tokens/design system (`components/ui/button.tsx`, `-dark` token pairs) — no new colors.
- Landing page links to `/sign-in` for the primary CTA.
- Update every existing reference to the old dashboard root path so nothing 404s: `app/(dashboard)/page.tsx` moves to `app/dashboard/page.tsx`, `app/(dashboard)/notebook/[id]/page.tsx` moves to `app/dashboard/notebook/[id]/page.tsx`, `app/(dashboard)/layout.tsx` moves to `app/dashboard/layout.tsx`, and `components/notebooks/workspace.tsx`'s "Back to notebooks" link (`href="/"`) updates to `href="/dashboard"`.
- `app/middleware.ts` `isPublicRoute` gains `'/'` as an exact match (not `/(.*)`, so `/dashboard` and other paths stay protected).
- `app/layout.tsx` currently forces `dynamic = 'force-dynamic'` for the whole app on the assumption every route needs auth context; since `/` is now public and static-renderable, remove that root-level `force-dynamic` and instead set it on `app/dashboard/layout.tsx` (the actually-dynamic authenticated subtree) so the landing page can be statically optimized.

**Block If:** None — target path is already declared in `.env.example` (`CLERK_AFTER_SIGN_IN_URL=/dashboard`), so no ambiguity in the dashboard's new location.

**Never:**
- No new npm dependency (no Framer Motion/GSAP) for the scroll effect.
- No autoplay, celebratory, or non-scroll-triggered animation (UX-DR3, UX-DR21).
- Do not touch dark-mode token definitions, cookie consent, or the walkthrough — those are separate stories (5.2, 5.3, 5.4).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Unauthenticated visit to `/` | No Clerk session | Landing page renders, no redirect | No error expected |
| Authenticated visit to `/` | Active Clerk session | Landing page still renders (public route); user can navigate to `/dashboard` via any dashboard link/nav | No error expected |
| Authenticated visit to `/dashboard` | Active Clerk session | Dashboard (`NotebookGrid`) renders as before | No error expected |
| Unauthenticated visit to `/dashboard` | No Clerk session | Clerk `auth().protect()` redirects to `/sign-in` | Existing middleware behavior, unchanged |
| `prefers-reduced-motion: reduce` | Visitor OS/browser setting | All landing sections visible immediately, no `IntersectionObserver`-driven transition classes applied, smooth scroll skipped | No error expected |
| Viewport 320px width | Mobile visitor | Landing content reflows without horizontal overflow or clipped text | No error expected |
| JS disabled / `IntersectionObserver` unsupported | Rare/old browser | Sections must default to visible (progressive enhancement: base CSS state is visible; JS only adds the reveal-then-show effect) | No error expected |

</intent-contract>

## Code Map

- `app/middleware.ts` -- add `/` as an exact public route
- `app/layout.tsx` -- remove `force-dynamic`, trim now-stale comment
- `app/page.tsx` (new) -- public landing page route
- `app/dashboard/layout.tsx` (moved from `app/(dashboard)/layout.tsx`) -- add `force-dynamic` here
- `app/dashboard/page.tsx` (moved from `app/(dashboard)/page.tsx`) -- unchanged content
- `app/dashboard/notebook/[id]/page.tsx` (moved from `app/(dashboard)/notebook/[id]/page.tsx`) -- unchanged content
- `components/notebooks/workspace.tsx` -- update `href="/"` to `href="/dashboard"`
- `components/landing/` (new dir) -- landing page sections + `useScrollReveal` hook
- `app/globals.css` -- reference only, confirms reduced-motion baseline already forces `scroll-behavior: auto`

## Tasks & Acceptance

**Execution:**
- [x] `app/dashboard/` -- create by moving `app/(dashboard)/layout.tsx`, `app/(dashboard)/page.tsx`, `app/(dashboard)/notebook/[id]/page.tsx` into it (remove the old `(dashboard)` route group directory entirely) -- relocates the authenticated dashboard off `/`
- [x] `app/dashboard/layout.tsx` -- add `export const dynamic = 'force-dynamic'` with a short comment explaining auth requires runtime context -- preserves prior dynamic-rendering guarantee for authenticated pages
- [x] `app/layout.tsx` -- remove `export const dynamic = 'force-dynamic'` and its comment -- allows the new public landing page to be statically optimized
- [x] `app/middleware.ts` -- add `'/'` to the `isPublicRoute` matcher array -- stops Clerk from protecting the new landing page
- [x] `components/notebooks/workspace.tsx` -- change `href="/"` to `href="/dashboard"` on the "Back to notebooks" link -- keeps in-app navigation correct after the route move
- [x] `components/landing/use-scroll-reveal.ts` (new) -- client hook wrapping `IntersectionObserver`: returns a ref + `isVisible` boolean per section, and short-circuits to `isVisible = true` immediately when `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true -- shared reveal primitive for all landing sections, handles reduced-motion per UX-DR17
- [x] `components/landing/reveal-section.tsx` (new) -- wrapper component using the hook: base classes render content visible (`opacity-100`), JS adds an initial `opacity-0 translate-y-4` state via `useEffect` (avoids no-JS/no-observer content ever being hidden) that transitions to visible on intersection -- progressive-enhancement scroll reveal
- [x] `components/landing/landing-hero.tsx`, `components/landing/landing-story.tsx`, `components/landing/landing-cta.tsx` (new) -- hero section (product name/tagline/primary CTA to `/sign-in`), 2-3 story sections explaining the "grounded, verifiable" flow (source → chat → citation → original view), final CTA section -- the actual marketing content required by FR-11
- [x] `app/page.tsx` (new) -- composes hero + story sections + CTA inside a `<main>` with `scroll-smooth` (guarded by reduced-motion via existing global CSS override), all content responsive from 320px using Tailwind design tokens -- the public landing route itself
- [x] `__tests__/landing.test.tsx` or equivalent (new, matching existing test setup/location) -- unit test covering the reduced-motion short-circuit in `use-scroll-reveal.ts` (mock `matchMedia`) and that `landing-hero.tsx` renders a link to `/sign-in` -- covers the I/O matrix's reduced-motion and no-JS-default-visible edge cases

**Acceptance Criteria:**
- Given an unauthenticated visitor, when they visit `/`, then the landing page renders without a Clerk redirect and links to `/sign-in`.
- Given an authenticated or unauthenticated visitor, when they visit `/dashboard`, then the existing notebook dashboard behavior (including the auth redirect for unauthenticated visitors) is unchanged from before this story.
- Given a visitor with `prefers-reduced-motion: reduce`, when the landing page renders, then all sections are visible immediately with no reveal transition and smooth scrolling is not applied.
- Given any viewport from 320px up, when the landing page renders, then no horizontal scroll/overflow occurs and text remains legible.
- Given the page with JavaScript/`IntersectionObserver` unavailable, when it renders, then all landing content is still visible (never permanently hidden).

## Spec Change Log

## Review Triage Log

### 2026-08-11 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 2 (medium 1, low 1)
- defer: 6 (medium 2, low 4)
- reject: 6 (low 6)
- addressed_findings:
  - `[medium]` `[patch]` `useScrollReveal`'s `IntersectionObserver` used `threshold: 0.15`, which could theoretically leave a very tall section never crossing the visibility threshold and stuck at `opacity-0`; lowered to `threshold: 0` so any intersection at all reveals the section.
  - `[low]` `[patch]` Added a `cancelled` guard around the `IntersectionObserver` callback in `use-scroll-reveal.ts` to avoid a `setState` call racing an unmount.

## Design Notes

Scroll reveal approach: each `RevealSection` starts in the DOM with visible base styles (no `hidden`/`opacity-0` in server-rendered markup) so content is accessible without JS. A client-side `useEffect` then applies `opacity-0 translate-y-4` synchronously before paint is not required — a brief flash of the pre-animated state on JS-enabled browsers is acceptable per FR-11's "scroll-based animations," since correctness (never permanently hiding content) matters more than a zero-flash guarantee here.

## Verification

**Commands:**
- `npm run build` -- expected: succeeds, `/` and `/dashboard` both appear in the route output with `/` statically optimized (○) and `/dashboard` dynamic (λ/ƒ)
- `npm test` -- expected: new landing tests pass alongside existing suite

**Manual checks (if no CLI):**
- Visit `/` in a browser with no auth session — landing page loads, no redirect.
- Toggle OS-level reduced-motion, reload `/` — sections appear without transition.
- Resize viewport to 320px — no horizontal scrollbar.
</content>
