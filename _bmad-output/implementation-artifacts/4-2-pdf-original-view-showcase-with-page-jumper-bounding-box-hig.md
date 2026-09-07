---
title: 'Story 4.2: PDF Original View Showcase with Page Jumper & Bounding-Box Highlight'
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

**Problem:** Researchers verifying claims from PDF documents need to jump straight to the cited page and visually identify the exact cited passage with tactile contrast.
**Approach:** Build a dedicated PDF Showcase viewer that navigates directly to `pageNumber`, displays "Page X of Y" with prev/next navigation and keyboard shortcuts `[` and `]`, highlights cited excerpt text with a high-contrast cyan bounding box (`3px solid #00E5FF` with semi-transparent cyan tint) active for 2.5 seconds, and provides tooltips on citation pills showing source title and page number.

## Boundaries & Constraints

**Always:**
- Navigate directly to cited `pageNumber` on citation click.
- Header displays `"Page X of Y"` with working previous/next controls.
- Keyboard shortcuts `[` (previous page) and `]` (next page) functional while PDF viewer is active.
- High-contrast cyan bounding box (`3px solid #00E5FF`, semi-transparent cyan tint) highlights cited text for 2.5s.
- Hovering citation pill in chat displays tooltip with source title and page number.

**Never:**
- Never allow page navigation out of bounds (< 1 or > totalPages).
- Never fail if pageNumber is omitted from citation (fallback to page 1).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| PDF Citation Click | `citation.pageNumber = 14` | Loads page 14 of document | Bounds check against totalPages |
| Page Previous | Click `[‹]` or key `[` | Decrements page number if > 1 | Disabled on page 1 |
| Page Next | Click `[›]` or key `]` | Increments page number if < totalPages | Disabled on last page |
| Cyan Bounding Box | Citation active | Excerpt text wrapped in cyan box for 2.5s | Smooth transition / persistent mark |
| Citation Pill Hover | Hover `<CitationChip>` | Tooltip: `"{title} — Page {N}"` | Falls back to title if no page |

</intent-contract>

## Code Map

- `components/notebooks/showcase/pdf-showcase.tsx` -- PDF viewer component with page navigation and highlight box.
- `components/chat/citation-chip.tsx` -- Tooltip with title and page number, Space Mono cyan pill styling.
- `backend/src/contexts/sources/index.ts` -- Return PDF pages from source content.
- `components/notebooks/showcase/pdf-showcase.test.tsx` -- Unit tests for PDF showcase.

## Tasks & Acceptance

**Execution:**
- [x] Implement `<PdfShowcase>` with page jumping, prev/next controls, and `[` / `]` keyboard shortcuts.
- [x] Implement cyan bounding box highlight for excerpt text.
- [x] Update `<CitationChip>` with tooltip and cyan pill styling.
- [x] Add unit tests in `pdf-showcase.test.tsx`.

## Auto Run Result

- Status: done
- Implemented `PdfShowcase` with page jumper, Page X of Y header, prev/next buttons, and `[` / `]` keyboard shortcuts.
- High-contrast cyan bounding box highlights excerpt text for 2.5s.
- Updated `CitationChip` with Space Mono bold numerals, cyan styling, and tooltip with title and page number.
- Verified via `components/notebooks/showcase/pdf-showcase.test.tsx`.
