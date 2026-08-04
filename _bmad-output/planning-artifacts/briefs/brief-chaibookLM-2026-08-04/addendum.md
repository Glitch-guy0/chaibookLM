# Addendum — chaibookLM

Companion to `brief.md`. Depth that belongs downstream (PRD, architecture, market research), captured for reference.

## Competitive landscape (researched 2026-08-04)

**Google NotebookLM (rebranded "Gemini Notebook" in mid-2026):**

- **Pricing:** still permanently free for Google account holders. Free tier: ~100 notebooks, 50 sources/notebook, ~500k words or 200MB per source, ~50 chat queries/day. Paid tiers bundled into Google AI subscriptions (Plus/Pro/Ultra) raising source counts and daily limits.
- **Source types supported:** PDF, Word (.docx), plain text, Markdown, ePub, CSV; Google Docs/Slides/Sheets with auto-sync; web URLs; public YouTube URLs (imports transcripts); audio files (mp3/wav/aac/ogg/opus) with transcription; images (png/jpg/webp) with OCR; pasted text; Gemini Chats as sources.
- **Citation UX:** inline numeric source chips; clicking opens a preview window with the highlighted quote from the underlying source; answers/notes can be exported with citations.
- **Audio Overviews:** two-AI-host podcast synthesis, interactive "join the conversation" mode; 50+ languages (interactive English-only).
- **Agentic features (late 2025–2026):** Deep Research / Discover Sources — proactively browses the web and imports curated results as structured notebook sources. **This matches our pillar #6; it is parity, not differentiation.**
- **Underlying model:** Gemini 3-tier integration, up to ~1M-token context.

## What this means for chaibookLM

1. **Pillar #6 (websearch → ingest) is no longer novel.** Keep it as a UX-simplified parity feature; invest the differentiation budget elsewhere.
2. **Genuine gaps we can own:** complex/structured PDF ingestion (scanned, tables, multi-column); subtitle files (.srt/.vtt) as first-class sources — Google imports YouTube *transcripts* but does not treat subtitle uploads as sources; citation → *original document view* (NotebookLM shows a highlighted quote preview, not the source itself); a lighter, calmer, design-first UI; hybrid self-hosted ecosystem for cost/privacy with no Google-account dependency.
3. **Pricing headroom:** NotebookLM's free tier is generous, so the free tier must compete on experience, not quota alone. Daily-limit freemium [decision] is reasonable; the paid story should rest on higher limits + power features (bigger sources, more notebooks, faster processing).

## Design direction (decided 2026-08-04)

**Neo-brutalism + minimalistic maximalism** — funky, modern, and deliberately unique; not premium/quiet. This is a *brand-level* contrast to NotebookLM's clean Google minimalism and becomes the lead differentiator on first impression.

Practical anchors for execution [ASSUMPTION]: thick hard borders, bold offset shadows, saturated/confident color palette, chunky playful typography, visible structure over airy whitespace — but applied with discipline ("minimalistic maximalism": lots of personality, zero noise). Web-first with mobile optimization means the aesthetic must survive small screens.

## Roadmap (decided 2026-08-04)

- **v0.1 — Text foundation:** textarea + webpage ingestion, rich-metadata indexing, chat with per-source citations, citation → original view
- **v0.3 — PDF support:** deep parsing (scanned pages, tables, dense layouts); citations render the actual PDF page
- **v0.6 — Transcript support:** subtitle files (`.srt`, `.vtt`) as first-class sources, timestamp-anchored indexing
- **v1 — YouTube & polish:** full video ingestion, timestamp as primary citation mark (click plays video at that moment), design polish, mobile, freemium limits live

## Open questions (for downstream work)

- PDF ingestion depth target: which layouts/structures are must-handle vs nice-to-have in v1?
- Hybrid ecosystem split: which capabilities self-host (embeddings, chunking, retrieval) vs commercial (LLM for answers)? Cost model per user?
- Mobile-optimized: PWA vs responsive — [ASSUMPTION in brief: responsive web app].
- Design system details: exact palette, type scale, shadow/border tokens for neo-brutalist style — needs a design pass (suggest `bmad-ux` or `bmad-agent-ux-designer`).


## Daily credit limit (decided 2026-08-04)

- **10 credits/day**, reset daily (per-user, rolling window).
- Each **agent call** consumes 1 credit — this includes chat answers *and* web searches.
- Uploads, indexing, and browsing sources stay free (ungated), so the friction point is only AI usage.
- **Payments/business model: deliberately out of scope for now** (2026-08-04 decision). Paid tier, upgrades, and pricing all deferred indefinitely; the credit limit exists purely as a usage/cost gate.

## Rejected / reframed ideas

- ~~"Websearch-ingest" as a headline differentiator~~ → reframed as parity with a simpler UX (NotebookLM Deep Research already does this).
- ~~"We support PDF/YouTube/URLs" as differentiation~~ → NotebookLM supports all of these; breadth is table stakes, depth is the wedge.
