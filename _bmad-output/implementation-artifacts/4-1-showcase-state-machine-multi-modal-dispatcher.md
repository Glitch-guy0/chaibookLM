---
title: 'Story 4.1: Showcase State Machine & Multi-Modal Dispatcher'
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

**Problem:** Researchers need a unified, responsive Showcase pane that responds instantly to citation clicks and dispatches the correct viewer modality across PDFs, YouTube videos, web pages, and text, with a clear empty state when idle.
**Approach:** Build a dedicated Showcase state machine that transitions cleanly between `idle` (empty state: "Click any citation pill in chat to verify proof in the original source."), `loading`, `active` (dispatching `pdf`, `youtube`, `web`, `text`, `transcript`), and `error`/`not-found`.

## Boundaries & Constraints

**Always:**
- When no citation is active, render empty state: "Click any citation pill in chat to verify proof in the original source."
- When citation is active, dispatch to the corresponding viewer modality based on source type.
- Esc key dismisses active citation / closes viewer and restores focus.
- Desktop Tri-Pane (≥1280px) renders Showcase in Pane 3 (30% width).

**Never:**
- Never crash on missing or deleted sources (show descriptive not-found state).
- Never lose keyboard accessibility (Esc closes, focus managed).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| No citation active | `citation: null` | Renders ShowcaseEmpty with neo-brutalist icon and instructional prompt | None |
| Citation selected | `citation: { sourceId, ... }` | Transitions to loading then active viewer modality | Renders loading skeleton |
| Source not found | `sourceId` not in sources list | Renders ShowcaseSourceNotFound: "This source is no longer available." | Graceful error card |
| Content unavailable | API returns 404/CONTENT_UNAVAILABLE | Renders ShowcaseContentError: "This source's content is no longer available." | Graceful error card |
| Esc pressed | `keydown: Escape` | Calls `onEsc()` callback | Restores focus to chat |

</intent-contract>

## Code Map

- `components/notebooks/showcase-panel.tsx` -- Main ShowcasePanel dispatcher and state machine.
- `components/notebooks/showcase/showcase-empty.tsx` -- Neo-brutalist empty state component.
- `components/notebooks/api.ts` -- Enhanced `SourceContent` type union.
- `components/notebooks/showcase-panel.test.tsx` -- Unit tests for state machine and dispatcher.

## Tasks & Acceptance

**Execution:**
- [x] Define multi-modal `SourceContent` types in `api.ts`.
- [x] Implement Showcase state machine & empty state in `showcase-panel.tsx`.
- [x] Wire Esc shortcut and aria-live announcements.
- [x] Verify with unit tests in `showcase-panel.test.tsx`.

## Auto Run Result

- Status: done
- Implemented ShowcasePanel state machine (`idle` -> `loading` -> `active` -> `error`/`not-found`).
- Empty state renders instructional copy: "Click any citation pill in chat to verify proof in the original source."
- Verified via `components/notebooks/showcase-panel.test.tsx`.
