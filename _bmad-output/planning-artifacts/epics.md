---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-contextual-v1-2026-09-05/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-Contextual-2026-09-06/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/EXPERIENCE.md
---

# Contextual - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Contextual, decomposing the requirements from the PRD, UX Design (DESIGN.md and EXPERIENCE.md), and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- **FR-1: Direct Text Source Ingestion** — Users can paste raw text or markdown directly into a dedicated text modal tab, provide an optional title, and trigger background parsing, chunking, and embedding.
- **FR-2: Web URL Ingestion (Firecrawl)** — Users can submit public web URLs for automated scraping via Firecrawl API, converting DOM content into clean Markdown, chunking, and indexing.
- **FR-3: PDF Document Ingestion** — Users can drag and drop or select PDF files (up to 10MB), extracted page-by-page via pure-JS serverless parser (`unpdf`/`pdf-parse`) with `<!-- page: N -->` markers.
- **FR-4: Subtitle & Transcript File Ingestion** — Users can upload subtitle transcript files (`.srt`, `.vtt` up to 5MB), parsed via regex into standardized timecoded Markdown (`<!-- time: mm:ss -->`).
- **FR-5: YouTube Video Ingestion** — Users can paste public YouTube URLs, fetching caption tracks keylessly via `youtube-transcript` directly into timecoded Markdown, with clear failure notices if captions are unavailable.
- **FR-6: Source Management & State Telemetry** — Real-time tracking of ingestion status (`queued`, `indexing`, `ready`, `failed` with descriptive error reason); supports individual source deletion with vector cascade.
- **FR-7: Notebook CRUD & Workspace Lifecycle** — Create, view, rename, and delete research notebooks (max 10 per user); each notebook owns an isolated vector collection namespace and dedicated conversation history.
- **FR-8: Event-Driven Step Orchestration** — Asynchronous execution backbone orchestrated via Inngest durable workflows (`source.ingest.*`), partitioned into sub-5s idempotent steps with zero dropped jobs on serverless infrastructure.
- **FR-9: Automated Retries & Exponential Backoff** — Inngest step-level retry policy applying up to 3 retries with exponential backoff on transient third-party failures (HTTP 429, 503, network timeouts).
- **FR-10: Complete Failure Isolation** — Errors during the ingestion of one source never block, corrupt, or delay the ingestion of any other source or active notebook; deterministic failures trigger the `onFailure` hook immediately.
- **FR-11: User-Level Ingestion Concurrency Limits** — Server-side concurrency throttle restricting each user to a maximum of 2 concurrent ingestion pipelines via Inngest concurrency keys.
- **FR-12: Scoped Semantic Vector Retrieval** — Semantic search strictly filtered by `notebookId` and `userId` within the unified `contextual_chunks_v1` Qdrant collection, retrieving top-5 chunks with minimum cosine similarity score of 0.30.
- **FR-13: Grounded Answer Generation & Citation Markup** — LangChain RAG pipeline constraining completions strictly to retrieved chunks wrapped in XML tags, emitting strict inline citation tags (`[[C:chunkId]]`) for every supported claim.
- **FR-14: Honest Refusal & Approval-Gated Web Search Fallback** — Emits transparent refusal card when source chunks lack sufficient facts (similarity < 0.30); provides interactive fallback button to trigger live Tavily search costing 1 credit.
- **FR-15: Real-Time Token Streaming & Chat History** — Server-Sent Events (SSE) streaming token-by-token completions to client; enforces 7-turn sliding context window for LLM prompt; persists full history in Neon.
- **FR-16: Text Source Showcase** — Right-hand Showcase pane renders full raw markdown text for text sources, automatically scrolling to and highlighting cited excerpt snippets.
- **FR-17: Web Source Showcase** — Showcase pane renders clean sanitized web article reader view, auto-scrolling to cited paragraphs with visual focus rings.
- **FR-18: PDF Document Showcase** — Showcase pane renders multi-page PDF viewer with page jumping (`Page X of Y`) and high-contrast cyan bounding-box highlights over cited paragraphs.
- **FR-19: YouTube & Subtitle Transcript Showcase** — Showcase pane embeds interactive YouTube video player seeking directly to cited timestamp seconds, synchronized with an autoscrolling transcript dialogue list.
- **FR-20: Synchronized Tri-Pane Workspace Layout** — Responsive multi-surface layout: Desktop (≥1280px) 3-column split (Sources 25% | Chat 45% | Showcase 30%); Tablet (768px-1279px) 2-column split with drawer; Mobile (320px-767px) 3-tab layout with sticky back button.
- **FR-21: Neo-Brutalist Tokens & Slanted Buttons** — Tactile design system: bold 2px ink borders, solid zero-blur offset shadows (`4px 4px 0 0`), slanted buttons (`-6deg` skew), and uniform elevation flow.
- **FR-22: Three-Voice Typography System** — `Space Mono` bold (700) for headings, tags, badges, and metrics; `Inter` (400/500/600) for long-form body and chat; monospace numerals.
- **FR-23: Accessibility Floor & Dark Mode (WCAG 2.2 AA)** — Strict compliance with WCAG 2.2 AA in light and dark modes; visible focus rings (`3px solid #00E5FF`), ARIA live regions for streaming and status, and `prefers-reduced-motion` support.
- **FR-24: First-Run Onboarding Walkthrough (Driver.js)** — Interactive step-by-step tour guiding first-time users through creating a notebook, adding sources, asking grounded questions, and verifying citations in Showcase.
- **FR-25: Daily Credit Governor (10 Credits / Day)** — Hard cap of 10 daily credits per user; resets at 12:00 AM Asia/Kolkata (18:30 UTC); chat queries and web searches consume 1 credit; locks composer at 0 credits.
- **FR-26: Notebook & Source Storage Quotas** — Hard caps: max 10 notebooks/user, max 10 sources/notebook, max 30 sources/user, max 10MB/PDF file, max 5MB/transcript file.
- **FR-27: Notebook Lifecycle & Midnight Auto-Deletion Notice (12:00 AM Asia/Kolkata)** — Persistent top warning banner displaying countdown to 12:00 AM IST; scheduled Inngest cron triggers automated purge cascade (Qdrant, Cloudinary, Neon).
- **FR-28: Developer Contract & Debug Instrumentation** — Consistent `data-testid` attributes on interactive components, request correlation IDs (`x-request-id`), and structured error boundary formats.
- **FR-29: Chat Prompt Usage Monitoring** — Non-blocking operational telemetry logging prompt character lengths, token metrics, latency, and credit expenditures into `telemetry_chat_prompts` without storing prompt text.
- **FR-30: File Upload Ingestion Monitoring** — Non-blocking operational telemetry logging upload byte sizes, MIME types, processing durations, and error categories into `telemetry_file_uploads`.

### NonFunctional Requirements

- **NFR-1 (Accessibility):** Full compliance with WCAG 2.2 Level AA. Focus rings: 3px solid cyan with 2px offset. High-contrast ratio ≥ 4.5:1 for body copy and ≥ 3:1 for graphical UI elements in both light and dark themes. Screen readers announce state transitions via polite `aria-live` regions.
- **NFR-2 (Performance & Latency):** Time to first token (TTFT) < 1.5s on grounded chat queries. Initial ingestion acceptance response < 200ms (HTTP 201). Background ingestion completes in < 15s for 10-page PDFs and standard web pages. Client page load < 1.2s on desktop.
- **NFR-3 (Reliability & Fault Tolerance):** Zero unhandled HTTP 500 errors in user flows. Inngest orchestrates all background tasks with idempotent execution keys (`sourceId-stepName`). Temporary binaries in Cloudinary automatically purged upon completion or failure.
- **NFR-4 (Security & Privacy):** Clerk JWT authentication with strict tenant isolation. Zero cross-notebook vector leakage via Qdrant filter payloads (`notebookId == current AND userId == current`). No storage of raw chat prompts or user files in telemetry.
- **NFR-5 (Viewport Responsiveness):** Full fluid responsiveness from 320px mobile screens up to 4K ultra-wide monitors without horizontal overflow, clipped modals, or hidden primary actions.
- **NFR-6 (Telemetry Overhead):** Telemetry writes to Neon must be asynchronous or non-blocking, adding < 15ms overhead to request lifecycles.

### Additional Requirements

- **Starter / Greenfield Template:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 project scaffolded with modular `backend/src/` tree implementing Ports-and-Adapters (Hexagonal Architecture).
- **Domain Context Boundaries:** Code organized into bounded contexts (`backend/src/contexts/`): `notebooks`, `sources`, `chat`, `ingestion`, `limits`, `telemetry`.
- **Ports & Composite Adapters:** Ports in `backend/src/ports/` (`VectorStore`, `StorageService`, `Embeddings`, `Search`, `WebExtractor`, `CaptionsService`); Adapters in `backend/src/adapters/` (`QdrantAdapter`, `NeonRepository`, `CloudinaryAdapter`, `OpenAIEmbeddingsAdapter`, `TavilyAdapter`, `FirecrawlAdapter`, `YouTubeCaptionsAdapter`).
- **Database Strategy:** Qdrant Cloud as sole system of record for chunks (single collection `contextual_chunks_v1`); Neon PostgreSQL as relational store for working metadata (notebooks, sources, limits, telemetry); no Graph DB.
- **Ephemeral Binary Policy:** Raw PDF/media binaries stored in Cloudinary exist strictly during active ingestion; deleted immediately upon Markdown conversion and vector indexing (`status: 'ready'`).
- **Serverless-Compatible Extractors:** `unpdf`/`pdf-parse` for PDFs; keyless `youtube-transcript` for YouTube; Firecrawl API for web; native regex for `.srt`/`.vtt`.
- **LangChain Decoupled RAG & Ingestion Model Configuration:** Standard `@langchain/core`, `@langchain/openai`, and `langchain` with complete support for local and remote OpenAI-compatible models (e.g., Ollama, vLLM, LM Studio, custom endpoints). Configured strictly via three dedicated environment variables for both chat completion and embedding ingestion:
  1. Base URL: `LLM_BASE_URL` (chat) and `EMBEDDING_BASE_URL` (ingestion embeddings)
  2. Model Identifier: `LLM_MODEL` (chat) and `EMBEDDING_MODEL` (ingestion embeddings)
  3. API Key: `LLM_API_KEY` (chat) and `EMBEDDING_API_KEY` (ingestion embeddings, supports placeholder/dummy keys for local models)
  Enables zero-code switching between local self-hosted inference and cloud API providers.
- **Sliding History Window:** Last 7 conversation turns injected into LLM prompt; full history paginated in Neon.
- **Midnight Maintenance Cascade:** Inngest cron `fnMidnightMaintenance` at 18:30 UTC / 12:00 AM IST executing vector purge, Cloudinary cleanup, Neon record purge, credit reset to 10, and OLAP rollup aggregation into `telemetry_daily_aggregates`.

### UX Design Requirements

- **UX-DR1 (Design Tokens & Color Palette):** OKLch palette for Light (`--bg: #F4F4F0`, `--surface: #FFFFFF`, `--fg: #111111`, `--accent: #FFE500`, `--citation: #00E5FF`, `--danger: #FF3333`, `--success: #00E575`) and Dark mode (`--bg: #0D0D0D`, `--surface: #18181B`, `--fg: #FFFFFF`, `--border: #E4E4E7`).
- **UX-DR2 (Typography Hierarchy):** Dual font pairing: `Space Mono` 700 bold for display titles, tags, badges, and metrics; `Inter` (400/500/600) for readable body copy and streaming chat.
- **UX-DR3 (Zero-Blur Elevation & Slanted Button):** `<Button>` component with uniform elevation flow (standard `4px 4px 0 0` ink shadow → hover `6px 6px 0 0` with `translate(-2px, -2px)` → pressed `0 0 0 0` with `translate(4px, 4px)`), with `prefers-reduced-motion` 3px border fallback.
- **UX-DR4 (Inline Citation Pill):** `<CitationPill>` with 1.5px border, `#00E5FF` background, hover tooltip (source + page/time), and click trigger activating the Showcase pane.
- **UX-DR5 (SourceCard Status Machine):** 4 visual states (`queued` gray, `indexing` orbital spin animation, `ready` green pulse dot, `failed` red border + error tooltip + retry button).
- **UX-DR6 (Top-Bar Credit Badge):** Monospace pill `⚡ N/10 credits` transitioning to yellow warning at ≤2 and red locked state `🔒 0/10 credits` at 0, disabling composer.
- **UX-DR7 (Ephemeral Auto-Deletion Banner):** Full-width persistent yellow banner docked below header showing hours/minutes countdown until 12:00 AM Asia/Kolkata deletion.
- **UX-DR8 (Honest Refusal Card & Web Fallback):** Chat stream refusal card with warning border and slanted `[Search Web & Answer (1 credit)]` button.
- **UX-DR9 (Multi-Surface IA & Responsive Layouts):**
  - Desktop (`≥1280px`): Persistent 25% / 45% / 30% tri-pane layout.
  - Tablet (`768px–1279px`): 50% Chat + 50% Showcase split with slide-over drawer for Sources.
  - Mobile (`320px–767px`): 3-tab navigation (`[Sources]` | `[Chat]` | `[Showcase]`) with auto-switch on citation click and sticky floating `← Back to Chat` button.
- **UX-DR10 (Add Source Modal):** 5-tabbed dialog (`Text`, `Web URL`, `PDF Dropzone`, `Transcript`, `YouTube URL`) with client-side file validation (10MB PDF, 5MB transcript).
- **UX-DR11 (Deep Original View Showcase):** Multi-modal viewer supporting PDF page jumping with cyan bounding boxes, YouTube player with autoscrolling transcript timestamps, and sanitized web reader with anchor highlights.
- **UX-DR12 (Keyboard Primitives & Accessibility):** Global shortcuts (`⌘K` switcher, `/` composer focus, `Esc` dismiss, `[` / `]` PDF page turn), `:focus-visible` ring (3px solid cyan), ARIA live regions for streaming and ingestion.

### FR Coverage Map

- **FR-1:** Epic 2 — Direct Text Source Ingestion
- **FR-2:** Epic 2 — Web URL Ingestion via Firecrawl
- **FR-3:** Epic 2 — PDF Document Ingestion (unpdf/pdf-parse)
- **FR-4:** Epic 2 — Subtitle & Transcript File Ingestion (.srt/.vtt)
- **FR-5:** Epic 2 — YouTube Video Ingestion (keyless transcript extraction)
- **FR-6:** Epic 2 — Source Management & Real-Time Ingestion Status Telemetry
- **FR-7:** Epic 1 — Notebook CRUD & Workspace Lifecycle (max 10 notebooks)
- **FR-8:** Epic 2 — Event-Driven Step Orchestration via Inngest durable pipelines
- **FR-9:** Epic 2 — Automated Retries & Exponential Backoff for ingestion
- **FR-10:** Epic 2 — Complete Failure Isolation across sources and notebooks
- **FR-11:** Epic 2 — User-Level Ingestion Concurrency Limits (max 2)
- **FR-12:** Epic 3 — Scoped Semantic Vector Retrieval (Qdrant filter by notebook/user)
- **FR-13:** Epic 3 — Grounded Answer Generation & Citation Markup (LangChain local/remote models)
- **FR-14:** Epic 3 — Honest Refusal & Approval-Gated Tavily Web Search Fallback
- **FR-15:** Epic 3 — Real-Time Token Streaming & Chat History (7-turn sliding window)
- **FR-16:** Epic 4 — Text Source Showcase with excerpt highlighting
- **FR-17:** Epic 4 — Web Source Showcase with reader mode and anchor scrolling
- **FR-18:** Epic 4 — PDF Document Showcase with page jumping and cyan bounding boxes
- **FR-19:** Epic 4 — YouTube & Subtitle Transcript Showcase with player sync
- **FR-20:** Epic 1 & Epic 4 — Synchronized Tri-Pane Workspace Layout (Desktop, Tablet drawer, Mobile tabs)
- **FR-21:** Epic 1 — Neo-Brutalist Tokens & Slanted Buttons (2px ink borders, solid shadows)
- **FR-22:** Epic 1 — Three-Voice Typography System (Space Mono + Inter)
- **FR-23:** Epic 1 — Accessibility Floor & Dark Mode (WCAG 2.2 AA)
- **FR-24:** Epic 1 — First-Run Onboarding Walkthrough (Driver.js)
- **FR-25:** Epic 1 — Daily Credit Governor (10 credits/day, midnight IST reset, composer lock)
- **FR-26:** Epic 1 — Notebook & Source Storage Quotas (10 nb, 10 src/nb, 10MB PDF)
- **FR-27:** Epic 1 — Notebook Lifecycle & Midnight Auto-Deletion Notice (Inngest purge cron)
- **FR-28:** Epic 1 — Developer Contract & Debug Instrumentation (data-testid, correlation IDs)
- **FR-29:** Epic 3 — Chat Prompt Usage Telemetry Monitoring
- **FR-30:** Epic 2 — File Upload Ingestion Telemetry Monitoring

## Epic List

- **Epic 1: Workspace Foundation, Authentication & Ephemeral Notebook Lifecycle** — Users can sign in securely via Clerk, complete an interactive Driver.js workspace walkthrough, create and manage up to 10 isolated research notebooks, view real-time daily credit balances (`⚡ 10/10`) with countdown warnings to 12:00 AM Asia/Kolkata auto-deletion, all within the tactile, precision-engineered Neo-Brutalist design system.
- **Epic 2: Multi-Modal Ingestion Pipeline & Durable Background Orchestration** — Users can add research sources across 5 modalities (Text, Web URLs via Firecrawl, PDFs via serverless JS parser, SRT/VTT Subtitles, and YouTube URLs with keyless captions), monitor live Inngest processing states (`queued` → `indexing` with orbital spin → `ready` / `failed` with retry), delete sources, and have content automatically normalized to Markdown, chunked, embedded via local or remote model endpoints (`EMBEDDING_BASE_URL`, `EMBEDDING_MODEL`, `EMBEDDING_API_KEY`), and indexed in Qdrant with ephemeral binary cleanup.
- **Epic 3: Grounded Conversational RAG with Local/Cloud LLM Support & Web Search Fallback** — Inside an active notebook, users can submit conversational queries against their indexed knowledge base, receiving streaming token responses strictly grounded in retrieved chunks with clickable inline citation pills (`[1]`, `[2]`), or receive an honest refusal card with an approval-gated live web search fallback (Tavily, costing 1 credit) when source material is insufficient. Supports local models (Ollama/vLLM) and cloud providers seamlessly via `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_API_KEY`.
- **Epic 4: Deep Original View Showcase & Multi-Surface Responsive Workspace** — Users can verify cited claims with tactile proof in the original source: clicking any citation pill in chat focuses the Showcase pane, jumping directly to the exact PDF page with cyan bounding-box highlights, seeking embedded YouTube videos to the exact timestamp with synchronized autoscrolling transcript dialogue, or scrolling to web article excerpts. On mobile viewports, users experience a smooth 3-tab navigation (`[Sources]` | `[Chat]` | `[Showcase]`) with an instant floating `← Back to Chat` return button.

---

## Epic 1: Workspace Foundation, Authentication & Ephemeral Notebook Lifecycle

Users can sign in securely via Clerk, complete an interactive Driver.js workspace walkthrough, create and manage up to 10 isolated research notebooks, view real-time daily credit balances (⚡ 10/10) with countdown warnings to 12:00 AM Asia/Kolkata auto-deletion, all within the tactile, precision-engineered Neo-Brutalist design system.

### Story 1.1: Project Scaffolding, Neo-Brutalist Tokens & Base Shell

As a researcher,
I want a responsive, high-contrast Neo-Brutalist application shell with design tokens and button elevation,
So that I can work in a fast, tactile, and accessible research workspace.

**Acceptance Criteria:**

**Given** a clean Next.js 16 (App Router) greenfield project with Tailwind CSS 4 and TypeScript
**When** the user loads the root layout
**Then** the design tokens for `--bg` (`#F4F4F0`), `--surface` (`#FFFFFF`), `--border` (`#111111`), `--accent` (`#FFE500`), and `--citation` (`#00E5FF`) are active in light mode
**And** dark mode tokens (`--bg: #0D0D0D`, `--surface: #18181B`, `--border: #E4E4E7`) toggle cleanly via theme switcher
**And** `<Button>` renders with a 2px ink border, solid offset shadow (`4px 4px 0 0`), elevating to `6px 6px 0 0` with `translate(-2px, -2px)` on hover, and collapsing to `0 0 0 0` with `translate(4px, 4px)` when pressed
**And** when `prefers-reduced-motion` is enabled, button translations are disabled and replaced by a 3px bottom border shift
**And** interactive components expose `data-testid` attributes for developer testing.

### Story 1.2: Clerk Authentication & Protected Session Routing

As a researcher,
I want to authenticate securely via Clerk,
So that my research notebooks and data remain strictly isolated to my personal account.

**Acceptance Criteria:**

**Given** an unauthenticated user attempting to access `/dashboard` or `/notebook/[id]`
**When** the request hits Next.js middleware
**Then** the user is redirected to the Clerk sign-in page
**And** once authenticated, the user is redirected to `/dashboard` with session JWT verified
**And** the top navigation bar displays the user avatar and sign-out action
**And** all subsequent API requests pass the verified `userId` to domain contexts.

### Story 1.3: Notebook CRUD, Neon Schema & Storage Quota Enforcement

As a researcher,
I want to create, view, rename, and delete research notebooks with strict quota enforcement,
So that I can organize discrete topics while respecting system storage caps.

**Acceptance Criteria:**

**Given** an authenticated user on `/dashboard`
**When** the user clicks `+ New Notebook` and enters a title
**Then** a new record is created in the Neon `notebooks` table with status `active` and returned via `POST /api/notebooks`
**And** the notebook appears in the 3-column dashboard grid with title, creation date, source count (`0 sources`), and meatball menu (Rename, Delete)
**And** if the user already has 10 active notebooks, the `+ New Notebook` button is disabled and `POST /api/notebooks` returns HTTP 422 with message `"Notebook limit reached (max 10 notebooks per user)"`
**And** clicking `Delete` removes the notebook record and triggers a cascading purge of its metadata.

### Story 1.4: Daily Credit Governor & Composer Lockout State

As a researcher,
I want my daily credit allocation tracked visibly with warnings and lockout enforcement,
So that I understand my query budget and reset schedule.

**Acceptance Criteria:**

**Given** an authenticated user with active notebooks
**When** viewing the top navigation bar
**Then** the `<CreditBadge>` displays current credits (e.g. `⚡ 10/10 credits`)
**And** when credits drop to ≤ 2, the badge transitions to warning yellow (`#FFE500`)
**And** when credits reach 0 (`🔒 0/10 credits`), the chat composer textarea and `Send` button are locked in disabled state with opacity `0.45`
**And** clicking `<CreditBadge>` opens a modal explaining the 10 credit daily pool and the 12:00 AM Asia/Kolkata reset schedule.

### Story 1.5: Ephemeral Lifecycle Warning & Midnight Purge Cascade

As a researcher,
I want a clear, persistent auto-deletion countdown banner and reliable midnight data purge,
So that I know active notebooks are ephemeral and reset nightly at midnight IST.

**Acceptance Criteria:**

**Given** a user viewing `/notebook/[id]`
**When** the workspace loads
**Then** the `<ExpirationBanner>` renders persistently below the topbar with text `"⏳ Auto-deletion Notice: This notebook will be auto-deleted tonight at 12:00 AM Asia/Kolkata (in X hours, Y minutes)"`
**And** at 18:30 UTC / 12:00 AM Asia/Kolkata, Inngest scheduled cron `fnMidnightMaintenance` executes an atomic cascade:
  1. Purges vector points in Qdrant matching active notebook IDs
  2. Purges any remaining temporary files in Cloudinary
  3. Deletes records from Neon `notebooks`, `sources`, and `chat_messages`
  4. Resets `limit_counters` back to 10 credits.

### Story 1.6: First-Run Onboarding Walkthrough (Driver.js)

As a first-time researcher,
I want an interactive step tour of the workspace,
So that I quickly understand how to add sources, ask questions, and verify citations.

**Acceptance Criteria:**

**Given** a user opening a notebook for the first time
**When** the workspace renders
**Then** a Driver.js guided tour automatically starts with 4 high-contrast Neo-Brutalist popover steps:
  1. Sources Pane (`+ Add Source`)
  2. Grounded Chat Composer
  3. Original View Showcase Pane
  4. Daily Credit Counter & Midnight Expiration Notice
**And** closing or completing the tour records a flag in `localStorage` so it does not auto-open again
**And** the user can re-trigger the tour anytime from the profile avatar menu.

---

## Epic 2: Multi-Modal Ingestion Pipeline & Durable Background Orchestration

Users can add research sources across 5 modalities (Text, Web URLs via Firecrawl, PDFs via serverless JS parser, SRT/VTT Subtitles, and YouTube URLs with keyless captions), monitor live Inngest processing states (queued → indexing with orbital spin → ready / failed with retry), delete sources, and have content automatically normalized to Markdown, chunked, embedded via local or remote model endpoints (EMBEDDING_BASE_URL, EMBEDDING_MODEL, EMBEDDING_API_KEY), and indexed in Qdrant with ephemeral binary cleanup.

### Story 2.1: Add Source Modal & Client-Side File Validation

As a researcher,
I want a 5-tabbed intake modal with client-side file and quota validation,
So that I can select my desired input modality and submit valid sources without rejected uploads.

**Acceptance Criteria:**

**Given** an open notebook with fewer than 10 sources
**When** the user clicks `+ Add Source`
**Then** `<AddSourceModal>` opens with 5 tabs: `Text`, `Web URL`, `PDF Dropzone`, `Transcript (.srt/.vtt)`, and `YouTube URL`
**And** file uploads enforce client-side limits: PDFs rejected if > 10MB; Transcripts rejected if > 5MB
**And** submitting a valid source sends `POST /api/sources` which creates a Neon record with `status: 'queued'`, dispatches an Inngest event, and returns HTTP 201 in < 200ms
**And** if the notebook already has 10 sources, the modal displays a quota warning preventing further submissions.

### Story 2.2: Inngest Durable Orchestration, Concurrency & Failure Isolation

As a system,
I want durable event-driven step execution with per-user concurrency limits and failure isolation,
So that heavy ingestion jobs run reliably on serverless infrastructure without timeouts or cascading failures.

**Acceptance Criteria:**

**Given** an ingestion event `source.ingest.*` dispatched to Inngest
**When** the background pipeline executes
**Then** Inngest enforces per-user concurrency limit of 2 concurrent pipelines via `concurrency: { key: "event.data.userId", limit: 2 }`
**And** transient errors (HTTP 429, 503, socket timeouts) retry up to 3 times with exponential backoff
**And** a failure in one source pipeline triggers `onFailure` which updates Neon status to `failed` with descriptive `errorReason` and cleans up temporary files
**And** other running ingestions and existing `ready` sources in the notebook continue operating without interruption.

### Story 2.3: Multi-Modal Content Extractors & Markdown Normalization

As a researcher,
I want my uploaded PDFs, web URLs, YouTube videos, subtitle files, and raw text converted into structured Markdown with anchors,
So that all content is universally normalized for accurate chunking and citation verification.

**Acceptance Criteria:**

**Given** a source in the Inngest processing pipeline
**When** the extraction step runs
**Then** PDFs are parsed page-by-page via pure-JS `unpdf`/`pdf-parse` into Markdown with `<!-- page: N -->` anchors, and the ephemeral Cloudinary binary is immediately deleted
**And** Web URLs are scraped via Firecrawl API returning sanitized Markdown
**And** YouTube URLs fetch captions keylessly via `youtube-transcript` with `<!-- time: mm:ss -->` anchors, or immediately fail with `"No captions found for this video"` if captions are absent
**And** `.srt`/`.vtt` files are parsed via regex into dialogue Markdown with `<!-- time: mm:ss -->` anchors
**And** Text inputs are normalized directly into standardized Markdown.

### Story 2.4: Chunking, Local/Remote Vector Embeddings & Qdrant Upsert

As a researcher,
I want normalized Markdown chunked into semantic segments and embedded via local or remote models into Qdrant,
So that my sources are immediately searchable for grounded AI answers.

**Acceptance Criteria:**

**Given** a normalized Markdown document
**When** chunking executes
**Then** the document is split into ~500 token segments while retaining anchor metadata (`pageNumber`, `timestampSeconds`, `link`, `excerpt`)
**And** vector embeddings are generated using LangChain's OpenAI-compatible adapter configured via `EMBEDDING_BASE_URL`, `EMBEDDING_MODEL`, and `EMBEDDING_API_KEY` (allowing local Ollama/vLLM or cloud providers)
**And** chunk points are upserted into Qdrant collection `contextual_chunks_v1` with payload fields (`chunkId`, `sourceId`, `notebookId`, `userId`, `text`, `excerpt`, `metadata`)
**And** the Neon source record transitions to `status: 'ready'` with updated `chunkCount`.

### Story 2.5: Source Management UI & Real-Time Status Telemetry

As a researcher,
I want to view all notebook sources with live status indicators and have the ability to delete them,
So that I have full transparency over what material is indexed.

**Acceptance Criteria:**

**Given** the Sources Pane (Pane 1) in the workspace
**When** sources are being ingested or are ready
**Then** each source renders a `<SourceCard>` showing type icon, title, and current state:
  - `queued`: gray border, gray dot
  - `indexing`: yellow border, animated orbital neo-brutalist shadow spin
  - `ready`: ink border, green pulse dot
  - `failed`: red border, alert tooltip explaining error cause and a `[Retry]` button
**And** clicking the delete action on a source card prompts confirmation, deletes vector points in Qdrant where `sourceId == target`, and removes the Neon source record.

### Story 2.6: File Upload Ingestion Operational Telemetry

As an operator,
I want non-blocking operational telemetry logging for file upload metrics,
So that I can monitor system load and error rates without degrading user performance.

**Acceptance Criteria:**

**Given** an ingestion pipeline execution
**When** processing finishes (either success or failure)
**Then** an asynchronous write logs to Neon `telemetry_file_uploads` recording byte size, MIME type, duration ms, and error category
**And** the database write adds < 15ms overhead to the request lifecycle
**And** records are aggregated nightly into `telemetry_daily_aggregates` at 12:00 AM IST.

---

## Epic 3: Grounded Conversational RAG with Local/Cloud LLM Support & Web Search Fallback

Inside an active notebook, users can submit conversational queries against their indexed knowledge base, receiving streaming token responses strictly grounded in retrieved chunks with clickable inline citation pills ([1], [2]), or receive an honest refusal card with an approval-gated live web search fallback (Tavily, costing 1 credit) when source material is insufficient. Supports local models (Ollama/vLLM) and cloud providers seamlessly via LLM_BASE_URL, LLM_MODEL, and LLM_API_KEY.

### Story 3.1: Scoped Semantic Vector Retrieval Service

As a researcher,
I want semantic vector search strictly isolated to my active notebook,
So that query results never leak data across notebooks or users.

**Acceptance Criteria:**

**Given** a user query submitted in an active notebook
**When** vector search executes
**Then** embeddings are generated for the query and Qdrant collection `contextual_chunks_v1` is searched
**And** search filter strictly enforces `notebookId == currentNotebookId AND userId == currentUserId`
**And** top-5 chunks are retrieved with cosine similarity scores
**And** if max similarity score is < 0.30, the system flags the retrieval as insufficient context for grounded answering.

### Story 3.2: LangChain Decoupled RAG Pipeline with Local/Cloud Configuration

As a researcher,
I want grounded answer generation using local or cloud LLMs with strict source isolation,
So that completions are truthful and link assertions directly to chunk IDs.

**Acceptance Criteria:**

**Given** retrieved chunks from the active notebook
**When** the RAG sequence executes
**Then** LangChain `RunnableSequence` wraps chunks into XML tags `<chunk id="chk_123" source="..." page="...">text</chunk>`
**And** system prompt enforces strict grounding: assertions must be followed by citation tag `[[C:chunkId]]`, and unsupported claims are forbidden
**And** the LLM client is initialized from environment variables: `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_API_KEY` (allowing local Ollama/vLLM endpoints or cloud APIs)
**And** the prompt includes the last 7 conversation turns from Neon as a sliding context window.

### Story 3.3: Real-Time SSE Token Streaming & Inline Citation Rendering

As a researcher,
I want streaming token-by-token responses with interactive cyan citation pills,
So that I can read answers without waiting for full completion and interact with citation references.

**Acceptance Criteria:**

**Given** a user submitting a prompt in the chat composer
**When** `/api/chat` processes the query
**Then** tokens stream to the client via Server-Sent Events (SSE) with time to first token (TTFT) < 1.5s
**And** 1 credit is deducted from the user's daily credit balance
**And** client parser converts `[[C:chunkId]]` markup into inline `<CitationPill>` components styled in `{colors.light.citation}` (`#00E5FF`) with Space Mono bold numerals (`[1]`, `[2]`)
**And** completed conversation turns are saved into Neon `chat_messages`.

### Story 3.4: Grounded Boundary Detection, Honest Refusal & Tavily Web Search Fallback

As a researcher,
I want honest refusal cards with an approval-gated web search option when sources lack answers,
So that the assistant never hallucinates and I retain explicit control over external web searches.

**Acceptance Criteria:**

**Given** a query where retrieved chunks have similarity < 0.30 or lack relevant facts
**When** the assistant completes reasoning
**Then** an inline `<RefusalCard>` renders in the chat stream with warning border: `"The uploaded sources do not specify the requested information."`
**And** an action card offers: `"Search the live web via Tavily? (Consumes 1 credit)"` with slanted button `[Search Web & Answer]`
**And** clicking the button checks credit balance, deducts 1 credit, executes Tavily search (top 3 results), synthesizes the answer, and renders distinct external web citation pills (`[Web: domain.com]`)
**And** if user credit balance is 0, the search button is disabled with a credit reset notice.

### Story 3.5: Chat Prompt Usage Operational Telemetry

As an operator,
I want non-blocking telemetry tracking chat prompt character counts and credit expenditures,
So that I have operational usage visibility without storing user chat text.

**Acceptance Criteria:**

**Given** a completed chat completion
**When** response streaming terminates
**Then** an asynchronous write logs to Neon `telemetry_chat_prompts` recording prompt character length, completion tokens, latency ms, and credit cost
**And** no raw prompt or response text is recorded in telemetry tables
**And** writes add < 15ms overhead and are rolled up nightly into `telemetry_daily_aggregates`.

---

## Epic 4: Deep Original View Showcase & Multi-Surface Responsive Workspace

Users can verify cited claims with tactile proof in the original source: clicking any citation pill in chat focuses the Showcase pane, jumping directly to the exact PDF page with cyan bounding-box highlights, seeking embedded YouTube videos to the exact timestamp with synchronized autoscrolling transcript dialogue, or scrolling to web article excerpts. On mobile viewports, users experience a smooth 3-tab navigation ([Sources] | [Chat] | [Showcase]) with an instant floating ← Back to Chat return button.

### Story 4.1: Showcase State Machine & Multi-Modal Dispatcher

As a researcher,
I want a unified Showcase pane that responds to citation clicks and switches viewer modalities,
So that I can inspect original source material seamlessly across PDFs, YouTube videos, web pages, and text.

**Acceptance Criteria:**

**Given** the Desktop Tri-Pane workspace (`≥1280px`)
**When** no citation is active
**Then** the Showcase Pane (Pane 3, 30% width) renders empty state: `"Click any citation pill in chat to verify proof in the original source."`
**When** the user clicks a `<CitationPill>` in chat
**Then** Showcase state machine activates and dispatches the appropriate viewer modality based on the cited chunk's source type (`PDF`, `YOUTUBE`, `WEB`, `TEXT`).

### Story 4.2: PDF Original View Showcase with Page Jumper & Bounding-Box Highlight

As a researcher,
I want clicking a PDF citation pill to jump straight to the source page with a cyan highlight,
So that I can verify facts in the original document layout in seconds.

**Acceptance Criteria:**

**Given** a citation pill referencing a PDF source chunk
**When** the user clicks the pill
**Then** the Showcase pane renders the embedded PDF page viewer navigated to `pageNumber`
**And** the viewer header displays `"Page X of Y"` with working previous/next controls (and keyboard shortcuts `[` and `]`)
**And** a high-contrast cyan bounding box (`3px solid #00E5FF` with semi-transparent cyan tint) highlights the cited excerpt text for 2.5 seconds
**And** hovering the citation pill in chat displays a tooltip with source title and page number.

### Story 4.3: YouTube & Subtitle Transcript Showcase with Player Sync

As a researcher,
I want video citations to seek the embedded player directly to the cited timestamp with transcript sync,
So that I can hear the speaker say the cited assertion in context.

**Acceptance Criteria:**

**Given** a citation pill referencing a YouTube or subtitle transcript source chunk
**When** the user clicks the pill
**Then** the Showcase pane loads the embedded YouTube player seeking immediately to `timestampSeconds`
**And** the autoscrolling transcript list below the player scrolls to the matching dialogue line
**And** the cited transcript cue is highlighted in cyan with bold monospace timestamp label (e.g. `[18:42]`).

### Story 4.4: Text & Web Source Showcase Readers

As a researcher,
I want text and web citations to render clean readable views centered on cited excerpts,
So that I can verify web articles and pasted notes with visual focus.

**Acceptance Criteria:**

**Given** a citation pill referencing a Web or direct Text source chunk
**When** the user clicks the pill
**Then** Web sources render in a clean, sanitized article reader view automatically scrolled to the cited paragraph with a cyan focus outline
**And** Text sources render full Markdown text scrolled to the cited sentence snippet.

### Story 4.5: Responsive Multi-Surface Layouts: Tablet Drawer & Mobile 3-Tab Workspace

As a mobile or tablet researcher,
I want an interface adapted to my screen size with smooth citation jumping and return navigation,
So that I can verify research sources efficiently on any device.

**Acceptance Criteria:**

**Given** a viewport between 768px and 1279px (Tablet)
**When** viewing `/notebook/[id]`
**Then** the layout displays a 50% Chat + 50% Showcase 2-column split, and Sources open in a slide-over Neo-Brutalist drawer
**Given** a viewport < 768px (Mobile, down to 320px)
**When** viewing `/notebook/[id]`
**Then** the workspace renders a single view with 3 top tabs: `[Sources (N)] | [Chat] | [Showcase]` (touch targets ≥ 44px)
**And** tapping an inline citation pill in `[Chat]` auto-switches active tab to `[Showcase]` centered on proof
**And** a sticky floating neo-brutalist action button `[← Back to Chat]` docks at bottom center
**And** tapping `[← Back to Chat]` returns the user to the `[Chat]` tab, restoring exact previous conversation scroll position.
