---
title: 'Story 4.4: Text & Web Source Showcase Readers'
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

**Problem:** Web pages and text documents must be presented in distraction-free, sanitized reader views centered directly on cited excerpts so users can immediately verify claims.
**Approach:** Deliver dedicated Web and Text Showcase reader components that auto-scroll to cited paragraphs or sentence snippets with high-contrast cyan focus outline (`outline: 3px solid #00E5FF` / `box-shadow: 0 0 0 3px #00E5FF`) and fallback gracefully between live sandboxed embed, saved snapshot, and sanitized reader markdown.

## Boundaries & Constraints

**Always:**
- Web sources render in a clean, sanitized article reader view automatically scrolled to the cited paragraph with a cyan focus outline.
- Fallback chain for Web: Live iframe → Snapshot HTML → Reader Markdown with external link.
- Text sources render full Markdown text scrolled to the cited sentence snippet with cyan highlight mark.
- ARIA live region announces highlighted passage for accessibility.

**Never:**
- Never execute unsandboxed scripts in web iframe.
- Never fail silently when web embed is blocked by X-Frame-Options (fallback to snapshot or reader).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Web Citation Click | `citation.excerpt` | Article reader automatically scrolls to matching paragraph with cyan outline | Auto-scroll on mount |
| Web Iframe Blocked | Timeout or CSP block | Shows saved HTML snapshot or reader view | Fallback with "Open in new tab" |
| Text Citation Click | `citation.span` | Full markdown text auto-scrolls to highlighted passage | `<mark>` element centered |
| Empty Excerpt | Citation has no text span | Renders document from top | Clean view |

</intent-contract>

## Code Map

- `components/notebooks/showcase/web-showcase.tsx` -- Sanitized web article reader with cyan outline and iframe fallback.
- `components/notebooks/showcase/text-showcase.tsx` -- Full text markdown reader with cyan highlight and auto-scroll.
- `components/notebooks/showcase/readers.test.tsx` -- Unit tests for Web and Text reader components.

## Tasks & Acceptance

**Execution:**
- [x] Implement `<WebShowcase>` with sanitized reader view, auto-scroll to cited paragraph, and cyan focus outline.
- [x] Implement `<TextShowcase>` with markdown support, auto-scroll to cited snippet, and cyan highlight.
- [x] Add unit tests in `readers.test.tsx`.

## Auto Run Result

- Status: done
- Implemented `WebShowcase` with sanitized article reader view, auto-scroll, cyan focus outline, and live/reader view mode toggle.
- Implemented `TextShowcase` with full markdown text, auto-scroll to cited passage, and cyan highlight mark.
- Verified via `components/notebooks/showcase/readers.test.tsx`.
