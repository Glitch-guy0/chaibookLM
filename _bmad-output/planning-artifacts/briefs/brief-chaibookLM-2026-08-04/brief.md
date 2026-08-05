---
title: "chaibookLM — NotebookLM-Style Research Workspace"
status: final
created: 2026-08-04
updated: 2026-08-06
---

# Product Brief: chaibookLM

## Executive Summary

chaibookLM is a personal research workspace in the spirit of Google's NotebookLM: bring your own sources — pasted text and webpages in v0.1, with PDF, transcripts, and YouTube on the roadmap — and chat with an AI that answers strictly from your own material, citing exactly where every claim came from. Where NotebookLM is heavy, Google-bound, and feature-first, chaibookLM optimizes for *clarity, cost, and trust*: a commercial-API stack with no lock-in, wrapped in a purely neo-brutalist design identity that is deliberately unlike anything Google ships.

The differentiating bet is the **citation loop closed back to the original source**. Most tools — NotebookLM included — cite a *highlighted quote*; chaibookLM lets you click a citation and see the *actual original resource*: the live web page, or the pasted text with the cited passage highlighted. Built for everyday learners who want deep research without deep tooling.

## The Problem

Reading-heavy knowledge work is fragmenting. To study a topic properly you juggle articles, PDFs, and transcripts across apps, and your notes end up disconnected from their sources. AI assistants answer fluently but too often from general knowledge — not *your* documents — and when they do cite, you can't easily verify against the original page.

NotebookLM solved the core loop (sources → grounded answers) but is heavy: Google-account-bound, quota-restricted, and increasingly focused on subscriptions and agentic features. There is room for a workspace that is *simpler to understand, cheaper to run, and more honest about where answers come from*.

## The Solution

A responsive web app (mobile-optimized, 320px floor) built around three surfaces inside a notebook:

1. **Sources** — paste text or add a webpage URL; each source is indexed with rich metadata (origin, position) so every indexed passage knows exactly where it lives in the original.
2. **Chat** — answers grounded only in your sources, carrying per-sentence citations that point at the specific source used.
3. **Original View (Showcase)** — click a citation and see the *original* resource, not a parsed extract: the live webpage, or the full pasted text with the cited passage highlighted.

## What Makes This Different

| Pillar | Our position | Honest read |
|---|---|---|
| **Design / UX** | A funky, purely **neo-brutalist** language — bold, unmistakably different from Google's clean minimalism | Brand-level, visible difference; must be executed with taste |
| **Citation → original view** | Clicking a citation opens the *actual original resource* — live web page or full text with the passage highlighted | **Genuine gap.** NotebookLM shows a highlighted quote preview; we show the source itself |
| **Rich-metadata indexing** | Every chunk points back to its origin with position/offset anchors | The *foundation* for the pillar above — not a visible feature on its own |
| **Websearch + ingest** | Fetch related web resources and ingest them as sources (approval-gated, FR-7) | Parity, not novelty — NotebookLM's Deep Research does this |
| **Cost / stack** | Commercial OpenAI-compatible APIs only, env-configurable, no lock-in | Cheaper and simpler than a platform bet; per-use cost must be watched |

**Unfair advantage, honestly stated:** there is no technical moat. The advantage is *execution and focus* — a passion-built product with a lighter stack, a first-principles citation experience that visibly closes the loop to the original source, and a signature design — done faster and lighter than a platform product can.

## Who This Serves

**Primary:** everyday consumers who want to learn something deeply — researching a topic across mixed sources, following along with a course, or analyzing content they personally own or find. Success for them: ask a question, get an answer they can *verify* against the original source in one click, without leaving the flow.

**Secondary:** students and self-directed learners who need citation discipline (essays, reports, study notes) and value a tool that doesn't require a Google account.

## Success Criteria

- **Engagement:** users create multiple notebooks; sources per notebook grow beyond the first upload.
- **Grounded answers:** ≥90% of chat answers carry at least one citation to a user source [ASSUMPTION: measurable in logs].
- **Citation trust:** a meaningful share of citations are clicked, and the click opens the original source.
- **Ingestion reliability:** text and web sources ingest successfully in normal use; failures are honest and isolated.

## Roadmap & Scope

Every milestone is a usable slice; the citation-first core loop is the foundation throughout.

- **v0.1 — Text foundation (this build):** textarea + webpage ingestion, rich-metadata indexing, chat with per-source citations, citation → original view, landing page, dark mode, cookie consent. Limits: 10 notebooks/user, 1-week notebook expiry, 10 sources/notebook, 30/user, 5 MB/source.
- **v0.3 — PDF support:** PDF ingestion with deep parsing (scanned pages, tables, dense layouts); citations render the actual PDF page.
- **v0.6 — Transcript support:** subtitle files (`.srt`, `.vtt`) as first-class sources with timestamp-anchored indexing.
- **v1 — YouTube & polish:** full video ingestion where the **timestamp is the primary citation mark**; design polish, freemium credit system.

**Explicitly out (v1):** audio transcription, image/OCR sources, collaboration/sharing, native mobile apps, podcast/Audio-Overview generation, Google Drive sync.

**Payments/business model:** out of scope for now. A daily credit limit arrives at v1 as a usage/cost gate (see addendum).

## Vision

If chaibookLM succeeds, it becomes the everyday person's research workspace — the place where learning from mixed sources feels calm, verifiable, and inexpensive. Over time it expands beyond documents: audio sources, richer artifact generation, optional collaboration. The throughline stays the same: *cheaper, simpler, more honest about where every answer comes from — and impossible to mistake for anything else.* The neo-brutalist design language becomes the product's signature.
