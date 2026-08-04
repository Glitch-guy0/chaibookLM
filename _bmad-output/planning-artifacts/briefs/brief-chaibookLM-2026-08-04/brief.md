---
title: "chaibookLM — NotebookLM-Style Research Workspace"
status: draft
created: 2026-08-04
updated: 2026-08-04
---

# Product Brief: chaibookLM

## Executive Summary

chaibookLM is a personal research workspace in the spirit of Google's NotebookLM: upload your sources — PDFs, web pages, pasted text, YouTube links, subtitle files — and chat with an AI that answers strictly from your own materials, citing exactly where every claim came from. Where NotebookLM optimizes for scale and Google's ecosystem, chaibookLM optimizes for *clarity, cost, and trust*: a simpler, cheaper ecosystem built on a hybrid of self-hosted and commercial AI, wrapped in a bold, funky neo-brutalist design identity that is deliberately unlike anything Google ships.

The differentiating bet is the **citation loop closed back to the original document**. Most tools — NotebookLM included — cite a *highlighted quote*; chaibookLM's answer panel lets you click a citation and see the *actual original resource*: the real PDF page, the live web page, the exact video moment. Combined with genuinely deep PDF ingestion (scanned pages, tables, dense layouts), subtitle-file support that nobody else offers as a first-class source, and a unique neo-brutalist / minimalistic-maximalist design language that makes the product instantly recognizable, chaibookLM is built for everyday learners who want deep research without deep tooling.

## The Problem

Reading-heavy knowledge work is fragmenting. To study a topic properly you juggle PDFs, articles, YouTube lectures, and transcripts across apps, and your notes end up disconnected from their sources. AI assistants answer fluently but too often from general knowledge — not *your* documents — and when they do cite, you can't easily verify against the original page.

NotebookLM solved the core loop (sources → grounded answers) but it is heavy: Google-account-bound, upload-quota-restricted, and increasingly focused on Google's AI subscriptions and agentic features. For the everyday consumer the tradeoffs — cost, lock-in, an interface that prioritizes features over focus — are real. There is room for a workspace that is *simpler to understand, cheaper to run, and more honest about where answers come from*.

## The Solution

A responsive web app (mobile-optimized) built around three surfaces:

1. **Sources** — drop in PDFs, web URLs, pasted text, YouTube links, and `.srt`/`.vtt` subtitle files. Each source is indexed with rich metadata (title, author, timestamps, page anchors, section structure) so every indexed passage knows exactly where it lives in the original.
2. **Chat** — ask questions; answers are grounded only in your sources and carry visible citations pointing to the specific uploaded resource.
3. **Original view** — click any citation and see the *original* resource, not a parsed extract: the actual rendered PDF page for documents, the live webpage for URLs. For video, the **timestamp is the primary citation mark** — clicking a citation plays the video at that exact moment.

## What Makes This Different

| Pillar | Our position | Honest read |
|---|---|---|
| **Design / UX** | A unique, funky **neo-brutalist + minimalistic-maximalist** design language — bold, modern, unmistakably different from Google's clean minimalism | Brand-level, visible difference; a deliberate aesthetic contrast to NotebookLM — memorable and demoable, must be executed with taste |
| **Complex PDF ingestion** | Deep handling of scanned pages, tables, multi-column layouts | Google adds OCR/images; deep structured PDF extraction is still a genuine gap [ASSUMPTION: this is the hardest pillar and likely the highest-engineering-cost] |
| **Rich-metadata indexing** | Every chunk points back at its origin with page/heading/timestamp anchors | This is the *foundation* for the two pillars below — not a visible feature on its own |
| **Citation view** | Answers cite the exact uploaded resource | NotebookLM matches this; parity required, not differentiator |
| **Citation → original view** | Clicking a citation opens the *actual original resource* — real PDF page, live web page, or the video played at the cited timestamp | **Genuine gap.** NotebookLM shows a highlighted quote preview; we show the source itself |
| **Websearch + ingest** | Search the web, find related resources, ingest them as sources | **No longer novel** — NotebookLM's Deep Research does this. Reframed as parity with a simpler UX |

**Unfair advantage, honestly stated:** there is no technical moat. The advantage is *execution and focus*: a passion-built product with a cheaper hybrid stack, a niche source type (subtitles) Google doesn't treat as first-class, and a citation experience that visibly closes the loop to the original document — done faster and lighter than a platform product can.

## Who This Serves

**Primary:** everyday consumers who want to learn something deeply — studying from PDFs and lectures, following along with a course, researching a topic across mixed sources, or analyzing any content they personally own or find. Success for them: ask a question, get an answer they can *verify* against the original source in one click, without leaving the flow.

**Secondary:** students and self-directed learners who need citation discipline (essays, reports, study notes) and value a tool that doesn't require a Google account.

## Success Criteria

- **Engagement:** users create multiple notebooks; sources per notebook grow beyond the first upload.
- **Grounded answers:** ≥ 90% of chat answers carry at least one citation to a user source [ASSUMPTION: measurable in logs].
- **Citation trust:** a meaningful share of citations are clicked, and the click leads to the original view, not a fallback.
- **Ingestion breadth:** all five source types (PDF, webpage, text, YouTube, subtitles) ingested successfully without error in normal use.
- **Usage gating:** the credit system works — each agent call consumes exactly 1 credit, the daily reset functions, and uploads/indexing stay friction-free.

## Scope

**Roadmap (phased — every milestone is a usable slice):**
- **v0.1 — Text foundation:** textarea + webpage ingestion, rich-metadata indexing, chat with per-source citations, citation → original view (renders the source)
- **v0.3 — PDF support:** PDF ingestion with deep parsing (scanned pages, tables, dense layouts); citations render the actual PDF page
- **v0.6 — Transcript support:** subtitle files (`.srt`, `.vtt`) as first-class sources with timestamp-anchored indexing
- **v1 — YouTube & polish:** full YouTube video ingestion where the **timestamp is the primary citation mark** — clicking a citation plays the video at that exact moment; design polish, mobile optimization, freemium credit system live

**Explicitly out (v1):** audio transcription, image/OCR sources, collaboration/sharing, native mobile apps, podcast/Audio-Overview generation, Google Drive sync. [ASSUMPTION: all flagged as future, subject to review]

**Daily credit limit (decided):** users get **10 credits/day**, reset daily. Each agent call — a chat answer *or* a web search — consumes 1 credit. Credits gate AI usage only; uploading, indexing, and browsing sources remain free [ASSUMPTION: uploads/indexing uncapped, subject to abuse review]. Payments/business model: deliberately out of scope for now.

**Risk to name:** deep PDF parsing (v0.3) and citation-to-video-playback (v1) are the hardest engineering. The phased roadmap keeps every milestone shippable — value lands before the hard parts. The citation-first core loop is the defensible foundation throughout.

## Vision

If chaibookLM succeeds, it becomes the everyday person's research workspace — the place where learning from mixed sources feels calm, verifiable, and inexpensive. In 2–3 years it expands beyond documents: audio sources, richer artifact generation (summaries, study guides), optional collaboration, and a self-hosted option for people who want full control of their data. The throughline stays the same: *cheaper, simpler, more honest about where every answer comes from — and impossible to mistake for anything else.* The neo-brutalist design language becomes the product's signature.
