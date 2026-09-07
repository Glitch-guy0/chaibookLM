---
title: 'Story 2.5: Source Management UI & Real-Time Status Telemetry'
type: 'feature'
created: '2026-09-07'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/EXPERIENCE.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Users must clearly observe source indexing lifecycle states (`queued`, `indexing`, `ready`, `failed`) and be able to delete sources with confirmed vector and database cleanup, or retry failed ingestions.
**Approach:**
- Enhance `<SourceCard>` with tactile Neo-Brutalist status states:
  - `queued`: gray border (`#888888`), gray dot
  - `indexing`: yellow border (`#FFE500`), animated orbital neo-brutalist shadow spin
  - `ready`: ink border, green pulse dot
  - `failed`: red border (`#FF3333`), alert tooltip explaining error cause and a `[Retry]` button
- Show type icons: `¶` (text), `↗` (web), `📄` (pdf), `💬` (transcript), `▶` (youtube).
- Deletion prompts confirmation, removes Qdrant points where `sourceId == target`, and removes the Neon source record.

## Boundaries & Constraints

**Always:**
- Visual status indicator cannot rely on color alone (includes text labels and status dot animations).
- Delete action MUST prompt confirmation modal.
- Failed sources expose error message and `[Retry]` trigger.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Queued Source | status: queued | Gray border, gray dot, "Queued" label | Standard card |
| Indexing Source | status: processing | Yellow border, orbital shadow spin animation | CSS reduce-motion turns off animation |
| Ready Source | status: ready | Ink border, pulsating green dot, "Ready" | Standard card |
| Failed Source | status: failed | Red border, error explanation, [Retry] button | Clicking retry re-triggers invalidation/index |
| Deleting Source | Click "Delete" | Prompts confirmation modal | On confirm, cascades Qdrant + Neon delete |

</intent-contract>

## Code Map

- `components/sources/source-card.tsx` -- tactile SourceCard component with all states and icons.
- `components/sources/sources-panel.tsx` -- sources list panel, delete confirmation modal, and retry hook.
- `components/sources/source-card.test.tsx` -- unit tests for all SourceCard states.

## Tasks & Acceptance

**Execution:**
- Implement states, icons, and retry action in `components/sources/source-card.tsx`.
- Connect delete confirmation and retry in `components/sources/sources-panel.tsx`.
- Verify with unit tests in `components/sources/source-card.test.tsx`.
