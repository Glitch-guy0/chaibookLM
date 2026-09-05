---
title: "Contextual — Gemini Notebook Clone"
status: final
created: 2026-08-04
updated: 2026-09-05
---

# Product Brief: Contextual (Gemini Notebook Clone — v1 Direct Production Release)

## Executive Summary

Contextual is a fast, personal research workspace built in the spirit of Google's NotebookLM (Gemini Notebook): bring your own multi-modal sources and chat with an AI assistant whose answers are grounded strictly in your uploaded material, citing verifiable proof back to original resources.

Rather than fragmenting functionality across iterative minor versions (v0.1 → v0.3 → v0.6 → v1), **Contextual ships all core capabilities directly into production as v1**. Users can immediately ingest pasted text, live web URLs, dense multi-page PDFs, subtitle transcript files (`.srt`, `.vtt`), and YouTube videos.

To ensure production stability, high throughput, and zero dropped jobs on serverless infrastructure, Contextual implements **Inngest** as the internal failure management and workflow orchestration engine. Inngest powers durable, step-based ingestion pipelines with automated retries, rate limiting, and failure isolation.

The experience is wrapped in an **upgraded, modern neo-brutalist UI**—bold, tactile, functional, and fast—designed around a synchronized tri-pane workspace (Sources, Chat, Original View) that works effortlessly from desktop monitors down to 320px mobile screens.

## The Problem

Reading-heavy knowledge work is severely fragmented. Learning or investigating complex topics requires juggling disparate web articles, technical PDFs, video lectures, and lecture transcripts across disconnected tools. Notes quickly decouple from their sources.

General-purpose AI chatbots hallucinate or answer from broad training corpora rather than specific source materials. Even specialized tools like Google NotebookLM / Gemini Notebook suffer from friction:
1. **Shallow citation verification:** NotebookLM displays an isolated quote preview snippet rather than the true source in context.
2. **Platform lock-in & weight:** Google account requirement, rigid ecosystem constraints, and a heavy corporate interface.
3. **Fragile pipeline execution:** Ingestion of heavy assets (long PDFs, YouTube transcript fetching, web scraping) routinely hits serverless timeouts, causing silent drops or cryptic failure states.

## The Solution

A responsive, high-velocity research workspace where the citation loop is definitively closed and the backend never fails silently:

1. **Multi-Source Ingestion:** Ingest plain text, web URLs (via Firecrawl), PDFs (deep layout parsing), transcripts (`.srt`, `.vtt`), and YouTube links.
2. **Inngest Durable Failure Management:** Background workflow orchestration isolating each ingestion step (extract → chunk → embed → index) with automatic retries, backoff, and transparent status telemetry.
3. **Strict Grounded Chat:** Chat assistant answering exclusively from active notebook chunks with sentence-level citations (`[[C:chunkId]]`). Honest refusal when material lacks answers, with an approval-gated web search fallback.
4. **Deep Original View (Showcase):** Clicking any citation reveals the true source asset:
   - **Text:** Full document with the exact sentence highlighted.
   - **Web:** Interactive reader or live webpage preview with passage anchoring.
   - **PDF:** Rendered PDF page showing the exact location and text bounding box.
   - **YouTube / Transcripts:** Synchronized media player seeking immediately to the referenced second.
5. **Modern Neo-Brutalist UI:** High-contrast borders, bold typography, tactile micro-interactions, responsive 3-column / tabbed navigation, and WCAG AA dark/light themes.

## Strategic Pillars & Differentiation

| Pillar | Our Position | Competitive Reality |
|---|---|---|
| **Scope Delivery** | **All-in-One v1 Release:** Direct-to-production delivery of text, web, PDF, transcript, and YouTube sources. | Eliminates prolonged release delays; delivers immediate parity and beyond on day one. |
| **Pipeline Durability** | **Inngest Workflow Orchestration:** Step-level execution, automatic retries, concurrency limits, and failure isolation. | Prevents Vercel serverless execution timeouts; guarantees no silent ingestion failures. |
| **Citation → Original View** | **Deep Source Verification:** Citations jump directly to the rendered PDF page, live web page, full text highlight, or YouTube second mark. | Genuine wedge. Competitors show quote snippets; Contextual renders the actual source. |
| **Design Language** | **Upgraded Neo-Brutalism:** Distinctive, high-energy, clean utility with zero fluff, fully responsive down to 320px. | Deliberate contrast against sterile enterprise SaaS and Google minimalism. |
| **Cost & Portability** | **Open Modular Stack:** Next.js + Neon + Qdrant + Cloudinary + Inngest + commercial OpenAI-compatible models. | No vendor lock-in; runs within generous free tiers with a daily 10-credit cost guardrail. |

## Who This Serves

- **Everyday Deep Learners:** Consumers self-studying complex topics across articles, textbooks, and video lectures who need fast synthesis they can instantly audit.
- **Students & Academics:** Researchers requiring strict citation discipline where every claim in an essay or summary maps to an exact PDF page or lecture timestamp.
- **Engineers & Technical Writers:** Professionals parsing dense API documentation, technical specs, and recorded presentations with zero patience for AI hallucinations.

## Success Metrics

- **SM-1 (Grounded Fidelity):** ≥90% of assistant answers contain at least 1 verified citation marker.
- **SM-2 (Citation Verification Rate):** ≥60% citation click-through rate resolving directly to the target Original View.
- **SM-3 (Pipeline Resilience):** ≥99% completion rate for valid sources via Inngest orchestration; 0 unhandled serverless timeouts.
- **SM-4 (Ingestion Latency & Clarity):** 100% of failed ingestions surface actionable, user-visible error reasons (e.g., paywall, invalid format, video uncaptioned).

## Functional Requirements (v1 Production Scope)

### 1. Ingestion & Source Management
- **FR-1.1 Text Ingestion:** Direct paste with character count validation, markdown preview, and span offset mapping.
- **FR-1.2 Web URL Ingestion:** Firecrawl-backed main content extraction from public URLs; graceful rejection of paywalls and bot-blocked sites.
- **FR-1.3 PDF Ingestion:** Upload up to 10MB PDFs; structured extraction retaining page numbers, section headers, and page-level image rendering.
- **FR-1.4 Subtitle & Transcript Ingestion:** Direct upload of `.srt` and `.vtt` files; millisecond timestamp parsing anchored to dialogue blocks.
- **FR-1.5 YouTube Ingestion:** Ingest public YouTube URLs; automated transcript extraction with second-level timestamp chunking.
- **FR-1.6 Source Management:** Inspect source details, rename, view status badges (`queued`, `processing`, `ready`, `failed`), retry failed items, and perform bulk deletion.

### 2. Inngest Durable Execution & Failure Management
- **FR-2.1 Event-Driven Step Orchestration:** Ingestion triggered via Inngest events (`source.ingest.*`), breaking execution into discrete, resumable steps: fetch/extract → parse → chunk → generate embeddings → vector upsert.
- **FR-2.2 Automated Retries & Backoff:** Up to 3 automatic retries with exponential backoff for transient API errors (Firecrawl rate limits, embedding endpoint spikes, Qdrant timeouts).
- **FR-2.3 Failure Isolation:** A failure in one source never blocks or corrupts the notebook; failed items register an isolated error status with an honest diagnostic message.
- **FR-2.4 Concurrency & Rate Limiting:** Enforce concurrency caps per user to protect downstream endpoints and prevent quota exhaustion.

### 3. Retrieval-Augmented Generation & Grounded Chat
- **FR-3.1 Scoped Retrieval:** Notebook-isolated cosine similarity retrieval (`topK=5`, `minScore=0.30`) from Qdrant vector storage.
- **FR-3.2 Grounded Answer Generation:** Chat completions carry validated inline citation markers (`[[C:chunkId]]`); sentences without retrieved support are refused or omitted.
- **FR-3.3 Honest Refusal & Fallback:** Clear refusal when uploaded sources do not contain the answer; offers user-approved Tavily web search to fill verifiable gaps.
- **FR-3.4 Streaming Response:** Real-time token streaming with on-the-fly citation marker rendering and responsive mobile scrolling.

### 4. Original View (Showcase) Interactive Verification
- **FR-4.1 Text Showcase:** Renders full text source with instantaneous smooth-scroll and highlight on the cited span.
- **FR-4.2 Web Showcase:** Split-pane reader showing the extracted article with original URL attribution and highlighted matching passage.
- **FR-4.3 PDF Showcase:** Embedded PDF viewer navigating immediately to the referenced page, highlighting the cited paragraph bounding box.
- **FR-4.4 Video & Transcript Showcase:** Embedded responsive video player synchronizing directly to the cited timestamp with synchronized transcript scrolling.

### 5. Upgraded Neo-Brutalist UI & Design System
- **FR-5.1 Workspace Layout:** High-efficiency tri-pane layout (Left: Sources & Ingestion; Center: Conversational Chat; Right: Original View Showcase). Collapses into smooth tabs on tablet and mobile viewports down to 320px.
- **FR-5.2 Visual Language:** Refined neo-brutalist styling: stark contrast borders (2px solid black/accent), deliberate drop shadows, tactile hover states, and modern monospace/grotesk typography.
- **FR-5.3 Theme & Accessibility:** Full WCAG 2.2 AA compliant dark and light modes, accessible focus rings (`3px` ring + `2px` offset), and motion preference toggles.
- **FR-5.4 First-Run Guidance:** Lightweight, interactive onboarding walkthrough (Driver.js) introducing the tri-pane interaction model.

### 6. User Limits & Cost Posture
- **FR-6.1 Notebook & Source Caps:** 10 notebooks per user, 10 sources per notebook (30 total per user), 10MB per source file, lazy 1-week inactivity TTL.
- **FR-6.2 Daily Credit Gate:** 10 AI interaction credits per user per day (rolling 24-hour reset); each grounded chat answer or approved web search consumes 1 credit. Ingestion and source browsing are ungated.

## Explicit Non-Goals (v1)

- **Raw Audio Transcription:** No local/custom Whisper transcription of arbitrary `.mp3`/`.wav` recordings (users supply `.srt`/`.vtt` transcripts or YouTube links).
- **Multi-User Collaboration:** No real-time multi-tenant notebook sharing or team workspaces.
- **Native Mobile Apps:** Web-only responsive design (PWA ready, fully functional on iOS/Android mobile browsers).
- **AI Podcast / Audio Synthesis:** No dual-host conversational audio overview generation.
- **Paid Subscriptions / Stripe Integration:** Monitization is deferred; daily credit quota acts as the cost governor.

## Production Path & Implementation Strategy

1. **Fast-to-Production Architecture:** Built on the established modular monolith (`backend/` domain contexts: `notebooks`, `sources`, `chat`, `ingestion`, `limits`) deployed directly to Vercel Hobby with external managed services (Neon, Qdrant, Cloudinary, Inngest).
2. **Inngest Setup:** Zero infrastructure deployment. Next.js App Router route `/api/inngest` exposes the Inngest handler; background jobs run reliably without serverless timeouts.
3. **Execution Velocity:** Leverage existing v0.1 domain code, wiring up Inngest functions for the expanded source types (PDF deep extraction, transcript parsing, YouTube transcript fetching) and connecting the updated tri-pane UI.
