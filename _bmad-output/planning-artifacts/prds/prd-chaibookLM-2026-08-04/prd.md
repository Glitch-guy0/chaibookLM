---
title: chaibookLM — v0.1 PRD
status: draft
created: 2026-08-04
updated: 2026-08-04
---

# PRD: chaibookLM (v0.1)
*Working title — confirm.*

## 0. Document Purpose

This PRD specifies **v0.1** of chaibookLM — the first shippable slice of a NotebookLM-style research workspace: users upload sources (textarea text and webpages), and an AI answers questions grounded **only** in those sources, with citations that open the original source. It is written for the builder and downstream AI workflows (UX, architecture, epics/stories). It builds on the product brief at `_bmad-output/planning-artifacts/briefs/brief-chaibookLM-2026-08-04/brief.md`; positioning and long-term roadmap live there, not here. Later milestones (PDF, transcripts, YouTube) are deliberately out of this PRD.

## 1. Vision

chaibookLM is a research workspace where the AI never answers from general knowledge — only from *your* material — and every claim points back to the exact source you can check. v0.1 proves the core loop: bring your own text and webpages into a notebook, ask questions, get grounded answers with citations, and click a citation to see the original source itself, not a parsed extract.

Why now: NotebookLM proved the market but stays heavy, Google-bound, and feature-first. chaibookLM competes on **trust and focus** — a simpler, design-led (neo-brutalist) workspace built on a commercial-but-lightweight AI stack. v0.1 validates that the citation-to-original loop is worth building the rest on.

## 2. Target User

### 2.1 Jobs To Be Done
- **JTBD-1:** "When I study a topic across mixed sources, I want answers that are anchored to my own material so I can trust and verify them."
- **JTBD-2:** "When I read an answer, I want to jump to the original page/paragraph in one click, not dig through summaries."
- **JTBD-3:** "When I collect sources, I want them to become a searchable, queryable knowledge base — not a pile of files."

### 2.2 Non-Users (v1)
- People who need PDF ingestion, YouTube/transcript analysis, or audio — deferred to v0.3–v1.
- Teams needing collaboration, sharing, or enterprise features.

### 2.3 Key User Journeys

- **UJ-1. Meera builds a research notebook for a topic and verifies an answer.**
  - **Persona + context:** Meera, a lifelong learner researching "indoor plant care" from a blog post and a pasted article.
  - **Entry state:** Signed in via Clerk. Opens the app on her laptop.
  - **Path:** Creates a notebook → pastes text from one article → adds a webpage URL as a second source → waits for indexing confirmation → types "What's the best way to avoid overwatering?" in chat.
  - **Climax:** The answer returns with two inline citations, one per source.
  - **Resolution:** She clicks the webpage citation and sees the live original page, scrolled context intact. She trusts the answer and continues asking.
  - **Edge case:** If a source fails to index (e.g., a paywalled page), the app tells her the source failed and shows which ones remain usable.

## 3. Glossary

- **Notebook** — a named container of sources and chat history. Users can have multiple notebooks, each with its own set of sources.
- **Source** — a unit of ingested content within a notebook: either a **Text Source** (pasted textarea content) or a **Web Source** (fetched webpage).
- **Chunk** — a discrete indexed unit of a Source, created during ingestion, carrying metadata (origin, position).
- **Citation** — a clickable reference attached to an answer sentence, pointing to the Source (and, where possible, the specific chunk/position) the model grounded on.
- **Original View** — the rendered original resource behind a citation: the pasted text for a Text Source; the live webpage for a Web Source.

## 4. Features

### 4.1 Notebooks
**Description:** Users create, rename, switch between, and delete notebooks. Each notebook isolates its sources and chat. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Create and manage notebooks
A signed-in user can create a notebook, rename it, switch between their notebooks, and delete one (with confirmation). Realizes UJ-1.
**Consequences (testable):**
- A user can create 2+ notebooks and switch between them without losing chat history or sources.
- Deleting a notebook removes its sources and chat history after confirmation.

### 4.2 Sources (Text & Web)
**Description:** Users add sources to the current notebook via two paths: pasting text into a textarea, or providing a webpage URL. Ingestion runs async with visible status (queued → processing → ready/failed). Realizes UJ-1.

**Functional Requirements:**

#### FR-2: Add a text source
A signed-in user can paste text into the current notebook's textarea and submit it as a Text Source; the full pasted text becomes the Source content. Realizes UJ-1.
**Consequences (testable):**
- Submitted text appears in the notebook's source list with a "ready" status after ingestion.
- Empty or whitespace-only submissions are rejected with an inline message.

#### FR-3: Add a web source by URL
A signed-in user can submit a webpage URL; the system fetches and extracts the page's main content (title + body text) as a Web Source. Realizes UJ-1.
**Consequences (testable):**
- A valid public URL becomes a ready Web Source with its title displayed.
- Unfetchable URLs (404, paywall, non-HTML) surface a "failed" status with a clear reason and do not break other sources.

#### FR-4: List, inspect, and remove sources
The notebook shows all its sources with name, type, and status; users can remove a source (with confirmation) and see metadata (e.g., title, added time). Realizes UJ-1.
**Consequences (testable):**
- Removing a source removes its chunks from retrieval and its citations from future answers.

### 4.3 Indexing
**Description:** During ingestion, each Source is split into Chunks with rich metadata (origin Source, position, and for Web Sources the section/heading if extractable). Chunks are embedded and stored for retrieval. This is the foundation for citations — not user-visible beyond status.

**Functional Requirements:**

#### FR-5: Chunk and index sources with origin metadata
The system splits each Source into Chunks, stores origin metadata (which Source, in what order), embeds them, and makes them retrievable per notebook. Realizes UJ-1.
**Consequences (testable):**
- Every Chunk stored is associated with exactly one Source; retrieval returns Chunks scoped to the current notebook only.
- A re-ingested updated Source replaces its prior Chunks.

### 4.4 Chat with Citations
**Description:** The chat surface answers questions grounded only in the current notebook's Chunks. Every answer sentence carries inline Citations to the Sources used; clicking a Citation opens the Original View. Answers that cannot be grounded are refused honestly. Realizes UJ-1.

**Functional Requirements:**

#### FR-6: Answer grounded in notebook sources
A signed-in user can ask a question in the current notebook's chat; the answer is generated using only that notebook's Chunks as context, with per-sentence Citations to the Sources used. Realizes UJ-1.
**Consequences (testable):**
- ≥90% of answers carry at least one Citation to a Source in the current notebook.
- Sources from other notebooks never appear as Citations.

#### FR-7: Refuse unanswerable questions honestly
If the notebook's Chunks cannot support an answer, the system says so plainly instead of answering from general knowledge.
**Consequences (testable):**
- A question outside all Sources returns an explicit "not found in your sources" response with no fabricated Citations.

#### FR-8: Open the original view from a citation
Clicking a Citation opens the Original View of the referenced Source: the full pasted text for a Text Source; the live webpage for a Web Source. Realizes UJ-1.
**Consequences (testable):**
- A Citation on a Web Source opens the original URL in a viewable context (new tab or in-app frame [ASSUMPTION: in-app frame preferred, new tab acceptable fallback]).
- A Citation on a Text Source opens the source's full text with the cited passage visually indicated [ASSUMPTION: highlight the cited chunk if position metadata is available].

### 4.5 Auth & Persistence
**Description:** Accounts via Clerk. Each user's notebooks, sources, and chat persist server-side so sessions resume across devices.

**Functional Requirements:**

#### FR-9: Authenticate users and scope data per user
A user signs in with Clerk; all notebooks, sources, chunks, and chat are scoped to the authenticated user and persist server-side. [ASSUMPTION: exact persistence store (database choice) is an architecture decision, not a PRD requirement]
**Consequences (testable):**
- An unauthenticated user cannot access another user's notebooks.
- Data survives a full session/logout cycle.

## 5. Non-Goals (Explicit)

- No PDF, transcript, or YouTube ingestion in v0.1 (v0.3–v1).
- No websearch-to-ingest, no proactive resource discovery (parity feature, later).
- No audio transcription, OCR/image sources, collaboration, sharing, or native mobile apps.
- No payments or billing; no credit/rate limiting in v0.1 [ASSUMPTION: cost is bounded by single-builder usage; a credit gate arrives at v1 per the brief].
- No offline mode.

## 6. MVP Scope

### 6.1 In Scope
- Clerk sign-in; per-user data persistence (notebooks, sources, chunks, chat).
- Multiple notebooks (create/rename/switch/delete).
- Text Sources (textarea) and Web Sources (URL fetch + extraction).
- Chunking + embedding with origin metadata; per-notebook retrieval.
- Chat grounded in sources with inline Citations and honest refusal.
- Citation → Original View (live page for Web; full text for Text).
- Neo-brutalist design language applied to all surfaces. [ASSUMPTION: a lightweight design pass precedes or runs parallel to build]

### 6.2 Out of Scope for MVP
- PDF / transcripts / YouTube (v0.3+).
- Websearch + ingest (later milestone).
- Credit system (v1 per roadmap) — `[NOTE FOR PM]` cost watch: commercial APIs in v0.1 mean per-use cost; revisit if usage grows beyond builder-only.
- Sharing, collaboration, mobile native apps.

## 7. Success Metrics

**Primary**
- **SM-1:** ≥90% of chat answers carry ≥1 Citation to a Source in the current notebook. Validates FR-6. *Counter: citation spam — answers citing sources they didn't use. Do not optimize by always-citing; keep citations factual.*
- **SM-2:** Citation click-through — a meaningful share of Citations are clicked and land on the correct Original View. Validates FR-8.

**Secondary**
- **SM-3:** Multiple notebooks created and used (target: builder creates 2+ notebooks within first month). Validates FR-1.
- **SM-4:** Ingestion success — Web Source fetch+extraction succeeds on normal public URLs ≥80% of the time. Validates FR-3.

**Counter-metrics (do not optimize)**
- **SM-C1:** Citation count per answer — optimizing this upward encourages citation inflation; the target is factual grounding, not density.

## 8. Open Questions

1. LLM/embedding provider choice and retrieval approach (commercial, cost-optimized) — architecture decision. [OQ-1]
2. Original View for Web Sources: in-app frame vs new tab — UX call pending design pass. [OQ-2]
3. How much source content is supported per notebook in v0.1 (chunk/embedding budget)? [OQ-3]
4. Citation granularity: per-sentence chips vs per-passage — refine during UX. [OQ-4]

## 9. Assumptions Index

- §4.4 FR-8 — Web Source Original View via in-app frame (new tab acceptable fallback).
- §4.4 FR-8 — Text Source Original View highlights the cited passage when position metadata is available.
- §4.5 FR-9 — persistence store choice is an architecture decision.
- §5 — no credit gate in v0.1; cost bounded by builder-only usage.
- §6.1 — a lightweight neo-brutalist design pass runs before/parallel to build.
