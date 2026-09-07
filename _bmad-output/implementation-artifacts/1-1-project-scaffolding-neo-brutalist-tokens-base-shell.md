---
title: 'Story 1.1: Project Scaffolding, Neo-Brutalist Tokens & Base Shell'
type: 'feature'
created: '2026-09-07'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '_bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/EXPERIENCE.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** The application's design system tokens and `<Button>` elevation styling must adhere strictly to the precision-engineered Neo-Brutalism specified in DESIGN.md, including high-contrast light/dark OKLch tokens and WCAG 2.2 AA accessibility floors.

**Approach:** Standardize `--bg`, `--surface`, `--border`, `--accent`, `--citation`, and companion tokens in `app/globals.css`, upgrade `<Button>` with the 4px->6px->0px tactile elevation flow and `prefers-reduced-motion` compliance, and expose `data-testid` on interactive primitives.

## Boundaries & Constraints

**Always:**
- Light mode tokens: `--bg: #F4F4F0`, `--surface: #FFFFFF`, `--border: #111111`, `--accent: #FFE500`, `--citation: #00E5FF`, `--muted: #555555`, `--danger: #FF3333`, `--success: #00E575`.
- Dark mode tokens: `--bg: #0D0D0D`, `--surface: #18181B`, `--border: #E4E4E7`, `--accent: #FACC15`, `--citation: #22D3EE`, `--muted: #A1A1AA`.
- `<Button>` elevation: standard `4px 4px 0 0`, hover `6px 6px 0 0` with `translate(-2px, -2px)`, active/pressed `0 0 0 0` with `translate(4px, 4px)`.
- Respect `prefers-reduced-motion` by suppressing translates and applying a 3px border shift.

**Never:**
- No soft blurry box shadows or rounded pill shapes for rectangular button primitives.
- Never lower text contrast below WCAG 2.2 AA floors (4.5:1 for body copy).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Light Mode | Root layout loaded without `.dark` class | Light design tokens active (`--bg: #F4F4F0`, `--surface: #FFFFFF`) | Default fallback to light tokens |
| Dark Mode | Root layout or parent with `.dark` class | Dark design tokens active (`--bg: #0D0D0D`, `--surface: #18181B`) | Fallback to dark token variables |
| Button Hover | Mouse enter on enabled `<Button>` | Box shadow expands to `6px 6px 0 0`, translates `(-2px, -2px)` | Disabled buttons ignore hover transforms |
| Button Pressed | Mouse down / active `<Button>` | Box shadow collapses to `0 0 0 0`, translates `(4px, 4px)` | Disabled buttons ignore press transforms |
| Reduced Motion | Browser with `prefers-reduced-motion: reduce` | Translations suppressed; substituted with 3px border adjustment | Safe rendering for motion sensitivity |

</intent-contract>

## Code Map

- `app/globals.css` -- CSS custom properties for light/dark Neo-Brutalist design tokens.
- `components/ui/button.tsx` -- `<Button>` component with elevation flow, reduced motion, and `data-testid`.
- `components/ui/button.test.tsx` -- Vitest tests for button elevation and attributes.
- `app/design-system.contrast.test.ts` -- WCAG contrast tests for token pairs.

## Tasks & Acceptance

**Execution:**
- `app/globals.css` -- update CSS custom properties and theme definitions to match DESIGN.md tokens.
- `components/ui/button.tsx` -- implement tactile elevation flow, motion reduction, and `data-testid`.
- `components/ui/button.test.tsx` -- verify button elevation classes, reduced motion fallback, and data-testid.
- `app/design-system.contrast.test.ts` -- align token constants with globals.css and assert contrast.

**Acceptance Criteria:**
- Given a clean Next.js 16 (App Router) greenfield project with Tailwind CSS 4 and TypeScript
- When the user loads the root layout
- Then the design tokens for `--bg` (`#F4F4F0`), `--surface` (`#FFFFFF`), `--border` (`#111111`), `--accent` (`#FFE500`), and `--citation` (`#00E5FF`) are active in light mode
- And dark mode tokens (`--bg: #0D0D0D`, `--surface: #18181B`, `--border: #E4E4E7`) toggle cleanly via theme switcher
- And `<Button>` renders with a 2px ink border, solid offset shadow (`4px 4px 0 0`), elevating to `6px 6px 0 0` with `translate(-2px, -2px)` on hover, and collapsing to `0 0 0 0` with `translate(4px, 4px)` when pressed
- And when `prefers-reduced-motion` is enabled, button translations are disabled and replaced by a 3px bottom border shift
- And interactive components expose `data-testid` attributes for developer testing.

## Verification

**Commands:**
- `npm test` -- expected: all test suites pass.
- `npm run typecheck` -- expected: zero TypeScript errors.
