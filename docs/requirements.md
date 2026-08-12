# chaibookLM — Requirements (v0.1, shipped)

Condensed from `_bmad-output/planning-artifacts/prds/prd-chaibookLM-2026-08-04/`. All 14 FRs below are implemented and closed — see `_bmad-output/implementation-artifacts/sprint-status.yaml` for the story-level trail. This file is the durable reference for *what the product does*; use [deferred-work.md](deferred-work.md) for *what's still rough*.

## Vision

A research workspace where the AI never answers from general knowledge — only from the user's own material — and every claim points back to a checkable source. Core loop: bring text/webpages into a notebook → ask questions → get grounded answers with citations → click a citation to see the original source.

## Functional Requirements

| FR | Summary |
|----|---------|
| FR-1 | Notebook CRUD from a dashboard (create/rename/open/delete/bulk-delete). Cap: 10/user. Auto-expires 1 week after creation. |
| FR-2 | Add a Text Source by pasting into a textarea; empty/whitespace rejected inline; renders as markdown. |
| FR-3 | Add a Web Source by URL; fetch + extract main content; unfetchable URLs (404/paywall/JS-only) fail with a clear reason, other sources unaffected. |
| FR-4 | List/inspect/remove sources; bulk remove; "clear failed"; removal drops chunks from retrieval and future citations. |
| FR-5 | Chunk + embed each source with origin metadata (source, position, span/offset); retrievable per-notebook only. |
| FR-6 | Chat answers grounded only in the current notebook's chunks, per-sentence citations; ≥90% of answers carry ≥1 citation; no cross-notebook citations; markdown rendering. |
| FR-7 | Honest refusal when chunks can't support an answer (no fabrication); offers approval-gated fetch of related web resources. |
| FR-8 | Clicking a citation opens the Original View: live page (Web Source, in Showcase) or full text with highlighted span (Text Source). |
| FR-9 | Clerk auth; all data (notebooks/sources/chunks/chat) scoped per user server-side; survives session/logout; per-user source cap (30) with pop-up warning. |
| FR-10 | First-run Driver.js walkthrough of Sources/Chat/Showcase; dismissible, replayable from Account. |
| FR-11 | Public landing page, no auth, smooth scroll + scroll animations, responsive to 320px, honors Reduced Motion. |
| FR-12 | GDPR-style cookie consent naming categories before any non-essential cookie; accept/decline/revisit; a11y prefs (color scheme, reduced motion, high contrast) auto-honored, manual overrides persisted only after consent. |
| FR-13 | Under load, AI/ingestion requests reject with an honest "high load, try again later" message + retry; already-indexed content and browsing stay usable. |
| FR-14 | Dark mode on every surface at the same AA contrast floor as light; defaults from `prefers-color-scheme`, overridable + persisted via consented cookie. |

## Non-Functional Requirements

| NFR | Summary |
|-----|---------|
| NFR-1 | WCAG 2.2 AA both themes; `aria-live` on ingestion status transitions (ready/failed only) and streaming answers. |
| NFR-2 | Keyboard/focus: 3px ring + 2px offset via `:focus-visible`; dialog focus trap; Esc closes topmost dialog; "Skip to chat"; real tablist semantics. |
| NFR-3 | Touch targets ≥44px mobile, ≥24px desktop. |
| NFR-4 | Responsive, 320px minimum; Sources/Chat/Showcase tabs at every breakpoint; no notebook rail. |
| NFR-5 | 7-turn chat window fed per turn; chat list loads/paginates by 7; ingestion fits Vercel Hobby's function-duration cap. |
| NFR-6 | All LLM/embedding/search config env-driven; no secrets in client bundles; no raw `fetch` in client components (TanStack Query owns fetching). |
| NFR-7 | Server-side persistence across sessions/devices. |
| NFR-8 | No non-essential cookie before consent. |
| NFR-9 | Structured logging; SM-1/SM-2 telemetry (citation attach + click-through). |
| NFR-10 | Qdrant is chunk authority; single writer; idempotent chunk creation; fixed delete-cascade order; no rebuild-on-loss (delete Cloudinary + honest error). |
| NFR-11 | Caps: 10 notebooks/user, 10 sources/notebook, 30 sources/user, 5MB/source, 1-week TTL — atomic, server-side, configurable. |
| NFR-12 | Retrieval params (topK=5, minScore=0.30) and the refusal gate are acceptance-testable. |

## Explicit Non-Goals (still true post-v0.1)

No PDF/transcript/YouTube ingestion, no unprompted web search, no audio transcription/OCR/collaboration/sharing/enterprise/native mobile, no payments/billing, no offline mode.

## Success Metrics

- **SM-1:** ≥90% of answers carry ≥1 citation (don't optimize by over-citing).
- **SM-2:** ≥60% citation click-through, resolving to the correct Original View.
- **SM-3:** Multi-notebook usage growth.
- **SM-4:** Web Source fetch success ≥80% on normal public URLs.
