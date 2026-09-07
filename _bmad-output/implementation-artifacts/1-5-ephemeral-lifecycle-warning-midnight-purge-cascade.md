---
title: 'Story 1.5: Ephemeral Lifecycle Warning & Midnight Purge Cascade'
type: 'feature'
created: '2026-09-07'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '_bmad-output/planning-artifacts/prds/prd-contextual-v1-2026-09-05/prd.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-Contextual-2026-09-06/ARCHITECTURE-SPINE.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/EXPERIENCE.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Users must be explicitly aware that active research notebooks are ephemeral and reset nightly at midnight IST, with an automated, scheduled maintenance cascade purging active vectors, binaries, and metadata.

**Approach:** Implement a persistent dynamic `<ExpirationBanner>` docked across the workspace counting down hours and minutes to 12:00 AM Asia/Kolkata (18:30 UTC), paired with an Inngest scheduled cron `fnMidnightMaintenance` executing the 4-step purge cascade (Qdrant, Cloudinary, Neon, credit reset).

## Boundaries & Constraints

**Always:**
- Persistent `<ExpirationBanner>` docked in `/notebook/[id]` with text: `"⏳ Auto-deletion Notice: This notebook will be auto-deleted tonight at 12:00 AM Asia/Kolkata (in X hours, Y minutes)"`.
- Inngest cron triggers at 18:30 UTC / 12:00 AM Asia/Kolkata (`cron: "30 18 * * *"`).
- Cascade order:
  1. Purge vector points in Qdrant matching active notebook IDs
  2. Purge remaining temporary files in Cloudinary
  3. Delete records from Neon notebooks, sources, and chat_messages
  4. Reset limit_counters back to 10 credits.

**Never:**
- Never leave orphan vectors in Qdrant or temp files in Cloudinary after midnight purge.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Active Workspace | User loads `/notebook/[id]` | `<ExpirationBanner>` renders with dynamic IST countdown | Updates every 30s |
| Midnight IST Cron | 18:30 UTC trigger | Inngest executes `fnMidnightMaintenance` cascade | Retries on transient failure |
| Purge Cascade Execution | `executeMidnightMaintenanceCascade` | Vectors cleared, Cloudinary cleaned, Neon pruned, credits reset | Error logged without throwing unhandled exceptions |

</intent-contract>

## Code Map

- `components/notebooks/expiration-banner.tsx` -- Persistent dynamic countdown banner.
- `components/notebooks/workspace.tsx` -- Workspace layout mounting ExpirationBanner.
- `backend/src/contexts/limits/midnight-maintenance.ts` -- Cascade business logic.
- `app/api/inngest/functions/midnight-maintenance.ts` -- Inngest cron function (`30 18 * * *`).
- `app/api/inngest/route.ts` -- Inngest API route.
- `components/notebooks/expiration-banner.test.tsx` -- Tests for banner calculation and text.
- `backend/src/contexts/limits/__tests__/midnight-maintenance.test.ts` -- Tests for cascade steps.

## Tasks & Acceptance

**Execution:**
- `components/notebooks/expiration-banner.tsx` -- create dynamic countdown banner component.
- `components/notebooks/workspace.tsx` -- mount banner in workspace view.
- `backend/src/contexts/limits/midnight-maintenance.ts` -- implement 4-step purge cascade.
- `app/api/inngest/functions/midnight-maintenance.ts` -- wire Inngest scheduled cron.
- Verify with unit tests.

**Acceptance Criteria:**
- Given a user viewing `/notebook/[id]`
- When the workspace loads
- Then the `<ExpirationBanner>` renders persistently below the topbar with text `"⏳ Auto-deletion Notice: This notebook will be auto-deleted tonight at 12:00 AM Asia/Kolkata (in X hours, Y minutes)"`
- And at 18:30 UTC / 12:00 AM Asia/Kolkata, Inngest scheduled cron `fnMidnightMaintenance` executes an atomic cascade:
  1. Purges vector points in Qdrant matching active notebook IDs
  2. Purges any remaining temporary files in Cloudinary
  3. Deletes records from Neon `notebooks`, `sources`, and `chat_messages`
  4. Resets `limit_counters` back to 10 credits.

## Verification

**Commands:**
- `npm test -- components/notebooks/expiration-banner.test.tsx backend/src/contexts/limits/__tests__/midnight-maintenance.test.ts` -- expected: all tests pass.
- `npm run typecheck` -- expected: zero TypeScript errors.
