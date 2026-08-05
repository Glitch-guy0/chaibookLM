# Addendum — chaibookLM

Companion to `brief.md`. Research and decisions that belong downstream (PRD, architecture), captured for reference.

## Competitive landscape (researched 2026-08-04)

**Google NotebookLM (rebranded "Gemini Notebook" in mid-2026):**

- **Pricing:** still permanently free for Google account holders. Free tier: ~100 notebooks, 50 sources/notebook, ~500k words or 200MB per source, ~50 chat queries/day. Paid tiers bundled into Google AI subscriptions raising source counts and daily limits.
- **Source types supported:** PDF, Word (.docx), plain text, Markdown, ePub, CSV; Google Docs/Slides/Sheets with auto-sync; web URLs; public YouTube URLs (imports transcripts); audio files (mp3/wav/aac/ogg/opus) with transcription; images (png/jpg/webp) with OCR; pasted text; Gemini Chats as sources.
- **Citation UX:** inline numeric source chips; clicking opens a preview window with the highlighted quote from the underlying source; answers/notes can be exported with citations.
- **Audio Overviews:** two-AI-host podcast synthesis; 50+ languages (interactive English-only).
- **Agentic features (late 2025–2026):** Deep Research / Discover Sources — proactively browses the web and imports curated results as structured sources. **Parity for us, not differentiation.**
- **Underlying model:** Gemini 3-tier integration, up to ~1M-token context.

## What this means for chaibookLM

1. **Websearch → ingest is parity, not novelty.** Keep it as a UX-simplified, approval-gated feature (PRD FR-7); spend the differentiation budget elsewhere.
2. **Genuine gaps we can own:** citation → *original document view* (NotebookLM shows a highlighted quote preview, not the source itself); deeper source-type coverage later (structured PDFs, subtitle files as first-class sources); a lighter, calmer, design-first UI; no Google-account dependency.
3. **Pricing headroom:** NotebookLM's free tier is generous, so the free tier must compete on experience, not quota alone. The v1 paid story should rest on higher limits + power features.

## Roadmap (decided 2026-08-04)

- **v0.1 — Text foundation:** textarea + webpage ingestion, rich-metadata indexing, chat with per-source citations, citation → original view
- **v0.3 — PDF support:** deep parsing (scanned pages, tables, dense layouts); citations render the actual PDF page
- **v0.6 — Transcript support:** subtitle files (`.srt`, `.vtt`) as first-class sources, timestamp-anchored indexing
- **v1 — YouTube & polish:** full video ingestion, timestamp as primary citation mark (click plays video at that moment), design polish, mobile, freemium limits live

## Daily credit limit (v1, decided 2026-08-04)

- **10 credits/day**, reset daily (per-user, rolling window).
- Each **agent call** consumes 1 credit — chat answers *and* web searches.
- Uploads, indexing, and browsing sources stay free (ungated); the friction point is only AI usage.
- **Payments/business model: deliberately out of scope for now.** Paid tier, upgrades, and pricing deferred; the credit limit exists purely as a usage/cost gate.

## Rejected / reframed ideas

- ~~"Websearch-ingest" as a headline differentiator~~ → reframed as parity with a simpler UX (NotebookLM Deep Research already does this).
- ~~"We support PDF/YouTube/URLs" as differentiation~~ → NotebookLM supports all of these; breadth is table stakes, depth is the wedge.
