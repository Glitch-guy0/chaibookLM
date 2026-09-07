---
title: 'Story 1.6: First-Run Onboarding Walkthrough (Driver.js)'
type: 'feature'
created: '2026-09-07'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '_bmad-output/planning-artifacts/prds/prd-contextual-v1-2026-09-05/prd.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/EXPERIENCE.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** First-time researchers need clear orientation to understand the primary trust loop of Contextual (adding sources, asking grounded questions, verifying original view citations, and understanding credit/ephemeral lifecycle rules).

**Approach:** Implement a 4-step guided onboarding walkthrough using Driver.js, automatically initiating for first-run users when workspace elements render, persisting completion in localStorage (`contextual_tour_completed`), and providing a manual re-trigger flow.

## Boundaries & Constraints

**Always:**
- Driver.js guided tour consists of exactly 4 sequential high-contrast popover steps:
  1. Sources Pane (`#tab-sources`)
  2. Grounded Chat Composer (`#tab-chat`)
  3. Original View Showcase Pane (`#tab-showcase`)
  4. Daily Credit Counter & Midnight Expiration Notice (`[data-testid="expiration-banner"]`)
- Record completion/dismissal in localStorage scoped by user so it does not auto-open again.
- Allow user to manually re-trigger walkthrough at any time.
- Honor `prefers-reduced-motion` by suppressing popover movement animations.

**Never:**
- Never repeatedly auto-launch the tour once completed or dismissed by the user.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| First-time user workspace load | User has not seen tour (`hasSeenTour === false`) | Driver.js tour launches automatically across the 4 steps | Requires DOM targets to mount |
| Tour completed / dismissed | User clicks close, overlay, or finishes | Sets localStorage flag; driver destroyed | Fails safe if localStorage throws |
| Return visit | User with completed flag loads workspace | Tour does not auto-open | Suppresses duplicate execution |
| Manual Replay | User triggers tour replay | Resets flag and re-runs Driver.js | Graceful fallback if elements missing |

</intent-contract>

## Code Map

- `components/tour/tour-config.ts` -- Ordered 4-step walkthrough configuration.
- `components/tour/use-product-tour.ts` -- Lifecycle hook driving Driver.js execution.
- `components/tour/tour-storage.ts` -- LocalStorage persistence and reset functions.
- `components/notebooks/workspace.tsx` -- Integrates `useProductTour` on notebook mount.
- `components/tour/tour.test.tsx` -- Vitest tests covering 4 steps, storage flags, and replay.

## Tasks & Acceptance

**Execution:**
- `components/tour/tour-config.ts` -- configure all 4 onboarding steps per AC-1.6.1.
- `components/tour/use-product-tour.ts` -- verify first-run mounting, completion handling, and replay.
- `components/tour/tour.test.tsx` -- test 4-step sequence, localStorage persistence, and re-trigger flow.

**Acceptance Criteria:**
- Given a user opening a notebook for the first time
- When the workspace renders
- Then a Driver.js guided tour automatically starts with 4 high-contrast Neo-Brutalist popover steps:
  1. Sources Pane (`+ Add Source`)
  2. Grounded Chat Composer
  3. Original View Showcase Pane
  4. Daily Credit Counter & Midnight Expiration Notice
- And closing or completing the tour records a flag in `localStorage` so it does not auto-open again
- And the user can re-trigger the tour anytime from the profile avatar menu.

## Verification

**Commands:**
- `npm test -- components/tour/tour.test.tsx` -- expected: all 4-step and storage tests pass.
- `npm run typecheck` -- expected: zero TypeScript errors.
