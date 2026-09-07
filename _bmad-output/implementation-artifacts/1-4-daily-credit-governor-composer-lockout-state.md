---
title: 'Story 1.4: Daily Credit Governor & Composer Lockout State'
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

**Problem:** Users must have clear visibility into their daily credit allocation (10 queries/day) with clear visual warning when running low and hard lockout of the chat composer when depleted, alongside transparent documentation of the midnight IST reset schedule.

**Approach:** Implement `<CreditBadge>` in the persistent topbar with 3 distinct visual states (normal >2, warning ≤2 with yellow background, locked 0 with red background and 🔒 icon), wire an informative modal dialog explaining the daily pool, and lock the chat composer textarea and send button at opacity 0.45 when credits reach zero.

## Boundaries & Constraints

**Always:**
- `<CreditBadge>` renders `⚡ N/10 credits` in monospace font.
- Warning state triggers at ≤ 2 credits with `--accent` (`#FFE500`).
- Lockout state triggers at 0 credits (`🔒 0/10 credits`) with `--danger` (`#FF3333`), locking chat composer and send button at `opacity: 0.45`.
- Modal explains the 10 credit daily pool and the 12:00 AM Asia/Kolkata (18:30 UTC) reset schedule.

**Never:**
- Never allow chat submission when credit balance is zero.
- Never display confusing or vague credit reset timings.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Normal Balance | credits > 2 (e.g. 10) | `⚡ 10/10 credits`, surface background | Normal interactivity |
| Low Balance Warning | credits = 2 or 1 | `⚡ 2/10 credits`, warning yellow background | Visual alert |
| Zero Credit Lockout | credits = 0 | `🔒 0/10 credits`, danger red background, composer disabled | Composer locked, opacity 0.45 |
| Click Badge | User clicks `<CreditBadge>` | Opens modal with reset schedule & rules | Dismissable with 'Got it' or Esc |

</intent-contract>

## Code Map

- `components/ui/credit-badge.tsx` -- `<CreditBadge>` component with states and details modal.
- `components/ui/index.ts` -- Export CreditBadge primitive.
- `app/dashboard/layout.tsx` -- Embeds CreditBadge in header bar.
- `components/chat/chat-panel.tsx` -- Composer lockout enforcement on `credits <= 0`.
- `components/ui/credit-badge.test.tsx` -- Vitest tests for badge states and thresholds.

## Tasks & Acceptance

**Execution:**
- `components/ui/credit-badge.tsx` -- build badge component with 3 states and dialog.
- `components/ui/index.ts` -- export CreditBadge.
- `app/dashboard/layout.tsx` -- render CreditBadge in dashboard header.
- `components/chat/chat-panel.tsx` -- enforce composer lockout with opacity 0.45.
- `components/ui/credit-badge.test.tsx` -- verify states and thresholds.

**Acceptance Criteria:**
- Given an authenticated user with active notebooks
- When viewing the top navigation bar
- Then the `<CreditBadge>` displays current credits (e.g. `⚡ 10/10 credits`)
- And when credits drop to ≤ 2, the badge transitions to warning yellow (`#FFE500`)
- And when credits reach 0 (`🔒 0/10 credits`), the chat composer textarea and `Send` button are locked in disabled state with opacity `0.45`
- And clicking `<CreditBadge>` opens a modal explaining the 10 credit daily pool and the 12:00 AM Asia/Kolkata reset schedule.

## Verification

**Commands:**
- `npm test -- components/ui/credit-badge.test.tsx` -- expected: all tests pass.
- `npm run typecheck` -- expected: zero TypeScript errors.
