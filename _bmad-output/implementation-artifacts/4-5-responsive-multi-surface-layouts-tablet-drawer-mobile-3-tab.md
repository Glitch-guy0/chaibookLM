---
title: 'Story 4.5: Responsive Multi-Surface Layouts: Tablet Drawer & Mobile 3-Tab Workspace'
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

**Problem:** The workspace must deliver an optimal layout across Desktop (`≥1280px`), Tablet (`768px - 1279px`), and Mobile (`<768px`), ensuring instant access to verification proof without disorienting navigation.
**Approach:** Upgrade `<Workspace>` to support 3 distinct responsive modes:
1. Desktop (`≥1280px`): Tri-Pane layout (25% Sources, 45% Chat, 30% Showcase side-by-side).
2. Tablet (`768px - 1279px`): 50% Chat + 50% Showcase 2-column split with slide-over Neo-Brutalist Drawer for Sources.
3. Mobile (`<768px`, down to 320px): Single view with 3 top tabs `[Sources (N)] | [Chat] | [Showcase]` (touch targets ≥ 44px), auto-switching to Showcase when a citation is clicked in Chat, and showing a sticky floating `[← Back to Chat]` button at bottom center that returns to Chat and restores exact scroll position.

## Boundaries & Constraints

**Always:**
- Tablet (768px - 1279px): 50% Chat + 50% Showcase split; Sources opens in slide-over Neo-Brutalist drawer.
- Mobile (<768px): 3 top tabs with touch targets ≥ 44px.
- Mobile: Tapping citation pill in `[Chat]` auto-switches to `[Showcase]` tab.
- Mobile: Sticky floating neo-brutalist action button `[← Back to Chat]` docks at bottom center when viewing Showcase.
- Mobile: Tapping `[← Back to Chat]` returns to `[Chat]` tab and restores previous conversation scroll position.

**Never:**
- Never break layout below 768px or 320px.
- Never lose scroll position when switching tabs back to Chat.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Desktop viewport (≥1280px) | window width 1440px | Renders 3 columns side by side: Sources (25%), Chat (45%), Showcase (30%) | Responsive grid/flex |
| Tablet viewport (768px - 1279px) | window width 1024px | 2-column split (Chat + Showcase) + Drawer toggle for Sources | Slide-over drawer with backdrop |
| Mobile viewport (<768px) | window width 390px | 3-tab layout: `[Sources (N)]`, `[Chat]`, `[Showcase]` | Touch targets ≥ 44px |
| Mobile citation click | Tap `<CitationChip>` in Chat | Switches active tab to `showcase`, docks floating `[← Back to Chat]` | Saves chat scroll offset |
| Back to Chat click | Tap `[← Back to Chat]` button | Switches active tab to `chat`, restores scroll position | Restores scrollTop |

</intent-contract>

## Code Map

- `components/notebooks/workspace.tsx` -- Responsive multi-surface workspace with Desktop Tri-Pane, Tablet split + Drawer, and Mobile 3-Tab.
- `components/notebooks/sources-drawer.tsx` -- Neo-Brutalist slide-over drawer for tablet view.
- `components/notebooks/floating-back-button.tsx` -- Sticky floating `[← Back to Chat]` action button.
- `components/notebooks/workspace.test.tsx` -- Unit tests for responsive layout and navigation.

## Tasks & Acceptance

**Execution:**
- [x] Implement Desktop Tri-Pane 3-column view (`≥1280px`).
- [x] Implement Tablet 2-column view (50% Chat + 50% Showcase) and slide-over `<SourcesDrawer>` (`768px - 1279px`).
- [x] Implement Mobile 3-tab layout with touch targets ≥ 44px (<768px).
- [x] Implement mobile citation jump to Showcase and sticky floating `<FloatingBackButton>` (`[← Back to Chat]`).
- [x] Implement chat scroll position preservation and restoration.
- [x] Add unit tests in `workspace.test.tsx`.

## Auto Run Result

- Status: done
- Upgraded `Workspace` with 3 surface layouts: Desktop Tri-Pane (25% / 45% / 30%), Tablet 50/50 split with slide-over `SourcesDrawer`, and Mobile 3-tab navigation with touch targets ≥ 44px.
- Implemented `FloatingBackButton` docked at bottom center for mobile returning to Chat and restoring exact scroll position.
- Verified via `components/notebooks/workspace.test.tsx`.
