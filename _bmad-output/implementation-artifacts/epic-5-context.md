# Epic 5 Context: First Impressions & Trust Floor

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Give the product a trustworthy, polished first impression: a public landing page that tells the "grounded, verifiable" story before sign-in, a guided first-run walkthrough of the core trust loop (Sources, Showcase, Chat), consistent dark mode, GDPR-style cookie consent paired with automatic accessibility-preference detection, honest rejection under load instead of broken states, and a hardened neo-brutalist design system applied consistently across every surface. Together these close the gap between "the product works" and "the product feels crafted and honest," which is what earns user trust on first contact.

## Stories

- Story 5.1: Public landing page with scroll storytelling
- Story 5.2: Dark mode across all surfaces
- Story 5.3: Cookie consent and accessibility preferences
- Story 5.4: First-run product walkthrough
- Story 5.5: Honest rate-limit rejection under load
- Story 5.6: Harden the design system across all surfaces

## Requirements & Constraints

- The public landing page must render for unauthenticated visitors with smooth scroll and scroll-triggered animations, be fully responsive from 320px up, and must degrade to static reveals (no smooth scroll) under reduced-motion. No autoplay or celebratory animation beyond sanctioned scroll reveals is allowed.
- Dark mode must be supported on every surface (landing, dashboard, sources, chat, showcase, dialogs) at the same AA contrast floor as light mode, defaulting from the browser's `prefers-color-scheme`, overridable manually, and never causing a flash of the wrong theme or loss of app state on switch.
- A GDPR-style cookie banner must name the cookie categories being stored (session, preferences, usage) and block any non-essential cookie until the visitor explicitly accepts or declines; the choice must be revisitable later from Account. Accessibility preferences (`prefers-color-scheme`, `prefers-reduced-motion`, forced-colors/high-contrast) must be auto-detected and honored regardless of cookie consent; manual overrides only persist as cookies once consent is given.
- A first-run walkthrough must introduce Sources, Chat, and Showcase to a signed-in user's first session, be dismissible, replayable later from Account, and behave like the app's other modal dialogs (focus trap, Esc-to-dismiss, `role="dialog"`/`aria-modal`), honoring reduced-motion.
- AI and ingestion operations must be protected by an app-layer rate guard: once a request-rate threshold (configurable via env, not hardcoded) is exceeded, the request is dropped immediately (no unbounded queueing, no wasted credit spend) and the user sees the honest message "Experiencing high load at this time — try again later." with a retry affordance. This must never present as a broken/erroring state, and already-indexed sources and browsing must remain usable during the rejection.
- Design-system hardening applies globally: WCAG 2.2 AA contrast in both themes, ≥44px touch targets on mobile / ≥24px on desktop, transitions ≤150ms and skipped under reduced motion, and dark-token contrast re-verified (muted text ≥4.5:1, status dots ≥3:1, active-state text on brand fill ≥4.5:1).

## Technical Decisions

- Design tokens and component specs live in a single source-of-truth design doc (colors, typography, spacing, radii, component specs) that maps directly to the Tailwind theme; dark mode is implemented via a `dark` class toggle on `<html>` (not a separate stylesheet), with every token having a validated `-dark` pair, and `color-scheme` set on both roots so native form controls match.
- Neo-brutalist visual language: 2px solid ink borders, hard (non-blurred) offset shadows, zero border-radius, max two saturated/loud colors per screen, and a dedicated accent color reserved only for citations and links.
- Buttons use a signature slanted treatment: `skewX(-6deg)` at rest with an offset shadow at `skewX(-12deg)` (6px -6px 0 0, light from bottom-left); hover deepens the lean to `skewX(-10deg)`; press collapses the shadow offset to 0; under reduced motion, hover feedback becomes a border/underline change instead of the lean/lift.
- Focus indication is exclusively a `:focus-visible` ring (3px ring + 2px offset), never a shadow or glow, and must invert to cream on ink/brand-filled elements and to the dark-surface color in dark mode.
- The first-run tour uses Driver.js.
- Chat context is fed to the model as a sliding window of only the last 7 turns per request; full history persists in the database. Persisted messages carry a resolved-citation snapshot (chunkId + sourceId + span) so citation chips can still render for old messages even though actual chunk content lives only in the vector store — relevant if Epic 5 work touches chat/showcase rendering.
- No named library is specified for cookie consent or rate limiting — both are expected to be built as lightweight, app-layer logic (a consent-gate for cookies; a request-count/threshold guard scoped only to AI and ingestion endpoints, not to browsing).

## UX & Interaction Patterns

- Responsive breakpoints: ≥1024px uses tabbed panels / a 3-column dashboard grid; 768–1023px stacks sections into a 2-column grid; ≤767px is a single stacked surface with Showcase opening full-screen from a citation tap. 320px is the hard minimum supported width throughout, including the landing page.
- Modal/dialog convention (shared by the first-run tour and other dialogs): `role="dialog"` with `aria-modal`, contained focus, and Esc-to-dismiss.
- Accessibility floor beyond contrast/touch targets: interactive elements are labeled with role and state, and state transitions (e.g. ingestion status, streaming answers) are announced via `aria-live` regions — relevant if Epic 5 hardening work touches these components.

## Cross-Story Dependencies

- Story 5.2 (dark mode) and Story 5.3 (cookie consent) are coupled: the manual theme override is only allowed to persist as a cookie once consent has been captured by 5.3's banner; absent consent, dark mode must still work session-to-session purely from live browser preference detection.
- Story 5.6 (design system hardening) touches the same button, focus-ring, and contrast primitives that Stories 5.1, 5.2, and 5.4 rely on (landing page CTAs, dark-mode token pairs, walkthrough dialog chrome) — sequencing 5.6 alongside or after those stories avoids rework.
- Story 5.5 (rate-limit rejection) is independent of the other five stories but shares the app's global "honest state" principle — the rejection UI should reuse the same non-erroring, retry-affordance pattern conventions as the rest of the design system from 5.6.
