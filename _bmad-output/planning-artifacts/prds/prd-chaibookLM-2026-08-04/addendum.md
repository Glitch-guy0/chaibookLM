# Addendum — chaibookLM v0.1 PRD

Companion to `prd.md`. Depth that belongs downstream (UX spec, architecture, design system), captured for reference and review.

## Design identity (from brief addendum, 2026-08-04)

**Neo-brutalism + minimalistic maximalism** — funky, modern, deliberately unique; not premium/quiet. Brand-level contrast to NotebookLM's clean Google minimalism; the lead differentiator on first impression.

Practical anchors for execution [ASSUMPTION]: thick hard borders, bold offset shadows, saturated/confident color palette, chunky playful typography, visible structure over airy whitespace — applied with discipline ("minimalistic maximalism": lots of personality, zero noise). Web-first with mobile optimization, so the aesthetic must survive small screens.

Needs a design pass before/parallel to build (per PRD §6.1 assumption); exact palette, type scale, shadow/border tokens are for the UX spec (`bmad-ux` / `bmad-agent-ux-designer`).

## Design anchors (decided 2026-08-05)

- Layout: Sources panel on the left; the Original View (resource showcase) on the right.
- Uploading a Source opens a pop-up/dialog; indexing state is shown as color on the Source's button/card (queued → processing → ready/failed).
- Limit violations surface as a pop-up warning (per PRD §6.1).
- First-run product walkthrough via a tour library (FR-10).

## Architecture anchors (decided 2026-08-05)

- **Models are OpenAI-compatible only** — LLM and embeddings follow the same constraint; the exact provider/retrieval approach remains OQ-1.
- **Image handling:** an interception layer strips images from Sources at indexing time only — the original Source content is never altered. Implemented as a removable interceptor so image recognition can be added later.
- **Seed data** for fresh/test environments (per PRD §6.1).
- **Resource limits:** 5 MB per Source, 30 Sources per user, 10 Sources per notebook; per-user count and limits stored server-side, configurable for future tiers.

