# Contextual — Comprehensive Project Details Report: Requirements & User Experience (UX)

**Document Version:** 1.0 (Production Release Scope)  
**Target Delivery:** Direct v1 Production Release  
**Authors:** Mary (Business Analyst) 📊 & John (Product Manager) 📋  
**Domain Focus:** Product Requirements, User Personas & JTBD, Grounded Citation Workflows, and Neo-Brutalist UX Design System  
**Exclusion Notice:** This document strictly excludes technical architecture decisions, infrastructure topologies, internal code design patterns, and database schemas.

---

## Table of Contents

1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [Target Users, Personas & Jobs-to-be-Done (JTBD)](#2-target-users-personas--jobs-to-be-done-jtbd)
3. [Core Strategic Wedge: The Deep Verification Loop](#3-core-strategic-wedge-the-deep-verification-loop)
4. [Functional Requirements Inventory](#4-functional-requirements-inventory)
   - [4.1 Multi-Modal Source Ingestion & Management](#41-multi-modal-source-ingestion--management)
   - [4.2 Grounded Conversational AI & Citation Engine](#42-grounded-conversational-ai--citation-engine)
   - [4.3 Original View (Showcase) Interactive Verification](#43-original-view-showcase-interactive-verification)
   - [4.4 User Governance, Storage Quotas & Daily Credit Governor](#44-user-governance-storage-quotas--daily-credit-governor)
   - [4.5 Ephemeral Lifecycle & Midnight Auto-Deletion Schedule](#45-ephemeral-lifecycle--midnight-auto-deletion-schedule)
   - [4.6 Product Observability & Operational Telemetry](#46-product-observability--operational-telemetry)
5. [Non-Functional Requirements (NFRs)](#5-non-functional-requirements-nfrs)
6. [Explicit Non-Goals & Scope Boundaries](#6-explicit-non-goals--scope-boundaries)
7. [Comprehensive User Experience (UX) & Design System Specification](#7-comprehensive-user-experience-ux--design-system-specification)
   - [7.1 Design Philosophy: Upgraded Modern Neo-Brutalism](#71-design-philosophy-upgraded-modern-neo-brutalism)
   - [7.2 Color System & Semantic Palette (OKLch & Hex)](#72-color-system--semantic-palette-oklch--hex)
   - [7.3 Three-Voice Typography System](#73-three-voice-typography-system)
   - [7.4 Tactile Elevation, Shadows & Spacing Rules](#74-tactile-elevation-shadows--spacing-rules)
   - [7.5 Screen Hierarchy & Multi-Surface Information Architecture](#75-screen-hierarchy--multi-surface-information-architecture)
   - [7.6 Responsive Layout Matrix (Desktop, Tablet, Mobile)](#76-responsive-layout-matrix-desktop-tablet-mobile)
   - [7.7 Detailed Component Specifications](#77-detailed-component-specifications)
   - [7.8 Voice, Tone & Microcopy Standards](#78-voice-tone--microcopy-standards)
   - [7.9 Interactive Primitives & Keyboard Ergonomics](#79-interactive-primitives--keyboard-ergonomics)
   - [7.10 Accessibility Floor & Motion Reduction (WCAG 2.2 AA)](#710-accessibility-floor--motion-reduction-wcag-22-aa)
   - [7.11 First-Run Onboarding Walkthrough](#711-first-run-onboarding-walkthrough)
8. [End-to-End User Journeys](#8-end-to-end-user-journeys)
   - [Journey 1: Elena Audits a Technical Research Paper](#journey-1-elena-audits-a-technical-research-paper)
   - [Journey 2: Marcus Conducts Mobile Market Research](#journey-2-marcus-conducts-mobile-market-research)
   - [Journey 3: Dev Resolves Source Gaps via Approval-Gated Web Search](#journey-3-dev-resolves-source-gaps-via-approval-gated-web-search)
9. [Requirements Traceability Matrix](#9-requirements-traceability-matrix)

---

## 1. Executive Summary & Product Vision

### 1.1 The Market Problem
Knowledge work is overwhelmed by disconnected source formats. Researchers, software engineers, financial analysts, and university students routinely juggle 20+ browser tabs: multi-page academic PDFs, live documentation URLs, YouTube keynote recordings, interview subtitle files, and handwritten Markdown notes.

General-purpose conversational AI models (e.g., vanilla ChatGPT or Gemini) fail this workflow in two fatal ways:
1. **Hallucination & Broad Corpora Bleed:** They generate answers synthesized from vast pre-training datasets rather than grounding their claims strictly in the user's specific reference materials.
2. **Shallow Citation Verification:** Even specialized tools like Google's NotebookLM offer only surface-level verification—displaying an isolated excerpt snippet in a side card without rendering the true source artifact in its surrounding native context.

### 1.2 The Contextual Solution
**Contextual** is a high-velocity personal research workspace engineered in the spirit of Google NotebookLM, elevated by two uncompromising product principles:
1. **Strict Grounded Citation Discipline:** The AI assistant is constrained to answer *exclusively* from active notebook sources. Every single factual assertion maps directly to an interactive, high-contrast inline citation pill (`[1]`, `[2]`). If the uploaded sources lack an answer, the assistant refuses to fabricate and offers an approval-gated web search fallback.
2. **The Deep Original View (Showcase):** Clicking any citation pill immediately activates the **Original View Showcase** pane, navigating to the true source artifact in native fidelity:
   - Jumping directly to the exact page of a multi-page PDF with a cyan bounding-box overlay.
   - Seeking an embedded YouTube video directly to the cited second mark with synchronized autoscrolling transcript dialogue.
   - Opening a clean web reader highlighted at the matching passage with an external canonical linkout.
   - Scrolling raw markdown text with a high-contrast persistent highlight.

Wrapped in an **upgraded neo-brutalist visual system** (bold 2px ink borders, solid zero-blur offset shadows, tactile slanted interactive buttons, and vivid yellow and cyan accents), Contextual delivers an authoritative, high-energy research tool built for speed, transparency, and auditability.

---

## 2. Target Users, Personas & Jobs-to-be-Done (JTBD)

### 2.1 Primary User Personas

| Persona | Role & Context | Core Pain Point | Value Realized in Contextual |
|---|---|---|---|
| **Elena (Senior Staff Engineer)** | Evaluates distributed systems specs, API whitepapers, and recorded conference keynotes. | "I spend more time cross-checking whether the AI fabricated a protocol edge case than reading the paper." | Clicks citation pills to inspect the exact PDF paragraph and theorem equation in under 3 seconds. |
| **Marcus (Equity Research Associate)** | Analyzes quarterly 10-Ks, earnings call transcripts, and industry news on mobile while commuting. | "Mobile AI apps give unverified summaries; I cannot bet investment recommendations on unverified bullet points." | Uses the mobile tabbed interface with single-tap citation jumping and a sticky `← Back to Chat` return button. |
| **Dev (Technical Product Manager)** | Synthesizes customer interview transcripts (`.srt`/`.vtt`), competitive pricing tables, and web articles. | "AI tools blend general internet fluff with my actual user quotes, muddying real customer feedback." | Strict notebook isolation ensures zero cross-contamination; transparent refusal when competitive data is missing. |

### 2.2 Jobs-to-be-Done (JTBD) Framework

- **JTBD-1 (Multi-Modal Synthesis):** *When* I am investigating a complex domain across heterogeneous materials (PDFs, YouTube lectures, web articles, subtitle files), *I want* to deposit them into a single unified notebook and query them simultaneously, *so that* I can synthesize cross-modal connections without losing context across disconnected windows.
- **JTBD-2 (Instant Auditability):** *When* an AI assistant generates a summary or answer, *I want* to click every claim and immediately inspect the exact highlighted sentence, PDF page, or video second mark, *so that* I have 100% confidence before citing facts in external presentations, code, or reports.
- **JTBD-3 (Zero Ingestion Anxiety):** *When* I submit long PDFs or YouTube links, *I want* real-time telemetry on the processing status with clear, honest error diagnostics if a source cannot be parsed, *so that* I never experience silent drops or mysterious failures.
- **JTBD-4 (Focused High-Velocity Ergonomics):** *When* I spend hours deep in research, *I want* an interface that feels tactile, responsive, keyboard-navigable, and free of corporate SaaS fluff, *so that* interacting with my sources feels fast and direct.

### 2.3 Explicit Non-Users (v1 Scope)
- **Real-Time Enterprise Collaborators:** Multi-seat teams requiring live co-authoring, shared cursor presence, and role-based permissions (Contextual v1 is strictly single-user per notebook).
- **Raw Audio Creators:** Users needing speech-to-text transcription for uncaptioned `.mp3` or `.wav` voice memos (Contextual requires existing subtitle files or captioned YouTube URLs).
- **Unlimited Document Archival Consumers:** Users seeking an indefinite file storage cloud (Contextual enforces strict storage caps and an automated ephemeral cleanup schedule).

---

## 3. Core Strategic Wedge: The Deep Verification Loop

The central differentiator separating Contextual from market alternatives is the **Deep Verification Loop**. 

```
+-------------------------------------------------------------------------------+
|                        THE DEEP CITATION VERIFICATION LOOP                    |
+-------------------------------------------------------------------------------+
|                                                                               |
|   1. User Query: "How does leader election resolve split votes?"              |
|                                                                               |
|   2. Assistant Streams Grounded Answer:                                       |
|      "Raft uses randomized election timeouts to ensure that split             |
|       votes are resolved quickly and split votes are rare [1]."               |
|                                                            ▲                  |
|                                                            │ Click Pill       |
|                                                            │                  |
|   3. Right-Hand Showcase Pane Activates:                   ▼                  |
|      +--------------------------------------------------------------------+   |
|      | SOURCE: raft-consensus.pdf • Page 14                               |   |
|      |                                                                    |   |
|      | [PDF.js Render Canvas]                                             |   |
|      | +----------------------------------------------------------------+ |   |
|      | | Section 5.2: Leader Election                                   | |   |
|      | |                                                                | |   |
|      | | ┌────────────────────────────────────────────────────────────┐ | |   |
|      | | │ [CYAN BOUNDING-BOX HIGHLIGHT OVER MATCHING TEXT]           │ | |   |
|      | | │ "Raft uses randomized election timeouts to ensure that     │ | |   |
|      | | │ split votes are resolved quickly and split votes are rare."│ | |   |
|      | | └────────────────────────────────────────────────────────────┘ | |   |
|      | +----------------------------------------------------------------+ |   |
|      | [Page 14 of 28] [Zoom In/Out] [Open External ↗]                   |   |
|      +--------------------------------------------------------------------+   |
|                                                                               |
+-------------------------------------------------------------------------------+
```

### Competitor Comparison: The Verification Gap

| Dimension | Standard AI Chat (ChatGPT / Claude) | Google NotebookLM | Contextual |
|---|---|---|---|
| **Grounding Scope** | Open internet pre-training weights (hallucinations frequent) | Restricted to uploaded sources | Restricted strictly to active notebook sources |
| **Citation Granularity** | General source links or none | Numbered bracket markers | Sentence-level interactive cyan pills (`[1]`) |
| **Citation Inspection** | None / Web linkout | Isolated text quote preview snippet in a drawer | **Deep Original View:** Renders the actual PDF page with bounding box, seeks YouTube video to second, or scrolls full text |
| **Media Handling** | Text-only or manual transcript upload | YouTube summary (no video sync) | Embedded YouTube player synchronized with autoscrolling dialogue timecodes |
| **Fallback on Missing Data**| Hallucinates plausible answer | May state lack of data | **Honest Refusal Card** with explicit, user-approved web search fallback button |
| **Visual Aesthetic** | Generic corporate SaaS minimal | Sterile corporate Google Material | **Upgraded Modern Neo-Brutalist:** Bold ink borders, offset shadows, slanted buttons |

---

## 4. Functional Requirements Inventory

### 4.1 Multi-Modal Source Ingestion & Management

#### FR-1: Direct Text Source Ingestion
- Authenticated users can add text sources by entering an optional title and pasting raw text or Markdown into the dedicated modal tab.
- **Validation Rules:** Minimum length 50 characters; maximum size 500,000 characters (~500KB). Rejects empty or whitespace-only inputs with an inline error banner.
- **Preservation:** Preserves line breaks, Markdown formatting, bullet hierarchies, and code blocks.
- **Metadata Recorded:** `{ sourceName: string }`.

#### FR-2: Web URL Ingestion
- Authenticated users can submit any public HTTP/HTTPS URL.
- **Validation Rules:** URL syntax validation; automatic rejection of non-HTTP protocols and local/private IP ranges (`localhost`, `127.0.0.1`, RFC 1918 private subnets).
- **Processing Behavior:** Extracts clean main article body content, title, and author while stripping navigation menus, cookie banners, advertisements, and scripts.
- **Error Handling:** If the target page is paywalled, bot-blocked (HTTP 403), or returns HTTP 404, the source transitions immediately to `failed` state with the specific HTTP error displayed.
- **Metadata Recorded:** `{ sourceName: string, link: string }`.

#### FR-3: PDF Document Ingestion
- Authenticated users can upload multi-page PDF documents up to 10MB in size via drag-and-drop or file system picker.
- **Validation Rules:** Client-side check of MIME type `application/pdf` and file size `≤ 10MB`. Over-limit files are blocked before upload with a toast: *"File exceeds maximum 10MB limit."*
- **Extraction Behavior:** Parses text content page-by-page, retaining sequential page numbers and paragraph text blocks.
- **Metadata Recorded:** `{ sourceName: string, pageNumber: number }`.

#### FR-4: Subtitle & Transcript File Ingestion
- Authenticated users can upload `.srt` or `.vtt` transcript files up to 5MB in size.
- **Validation Rules:** Rejects non-subtitle extensions; validates standard timestamp timecodes (`hh:mm:ss.ms` / `mm:ss.ms`).
- **Extraction Behavior:** Normalizes dialogue turns with associated playback start times.
- **Metadata Recorded:** `{ sourceName: string, timestamp: string }` (e.g. `"04:15"`).

#### FR-5: YouTube Video Ingestion
- Authenticated users can submit public YouTube video URLs (standard `youtube.com/watch?v=...` or shortened `youtu.be/...`).
- **Validation Rules:** Extracts 11-character video ID; verifies public availability.
- **Extraction Behavior:** Pulls existing official or auto-generated subtitle tracks into timestamped dialogue chunks.
- **Edge Case / Error Handling:** If the video has disabled captions or lacks a transcript, ingestion transitions immediately to status `failed` with the diagnostic: *"No captions or transcript available for this YouTube video. Try uploading an .srt transcript file."* Raw audio speech-to-text is explicitly out of scope.
- **Metadata Recorded:** `{ sourceName: string, timestamp: string, link: string }` (where `link` includes deep-link time parameter `&t=...`).

#### FR-6: Source Management & State Telemetry
- The Left Pane of the active notebook displays the complete inventory of sources with source type icons (`Text`, `Web`, `PDF`, `Transcript`, `YouTube`) and real-time status badges:
  - `queued`: Gray border, static gray dot, label "Queued".
  - `indexing`: Brand yellow border, animated orbital shadow spin indicator, label "Indexing...".
  - `ready`: Solid ink border, green pulse dot, label "Ready". Emits a 1-second subtle success glow on initial transition.
  - `failed`: Red border, red alert dot, label "Failed", with tooltip displaying failure root cause.
- **Actions:**
  - **Single-click Retry:** Available on any `failed` source to re-dispatch processing.
  - **Clear Failed:** Top-of-list action button appears whenever one or more sources fail.
  - **Individual Deletion:** Hovering/tapping reveals a menu with "Remove from notebook". Deletion cascades to purge associated chunks and stored files, but preserves existing chat messages.

#### FR-7: Notebook CRUD & Workspace Lifecycle
- Users manage notebooks from the central Dashboard.
- **Quota Enforced:** Hard ceiling of 10 notebooks per user. Reaching 10 notebooks disables the `+ New Notebook` button and displays a quota limit notice.
- **Notebook Properties:** Displays title, creation date, source count, and midnight auto-deletion countdown badge.
- **Bulk Actions:** Supports multi-selection checkboxes for bulk notebook deletion.

---

### 4.2 Grounded Conversational AI & Citation Engine

#### FR-8: Scoped Semantic Retrieval
- When a user submits a question in the Center Pane, retrieval searches *exclusively* within chunks belonging to the active notebook. Chunks from other notebooks or users are cryptographically and logically excluded.
- **Retrieval Parameters:** Top-5 candidate chunks (`topK = 5`) with a strict minimum relevance threshold (`minScore = 0.30`).

#### FR-9: Grounded Answer Synthesis & Inline Citation Pills
- The assistant constructs responses using *only* facts supported by retrieved chunks.
- **Citation Syntax:** Supported statements are tagged with inline citation markers (`[[C:chunkId]]`).
- **Client Rendering:** Client dynamically parses tokens on-the-fly, transforming tags into sequential, high-contrast Inline Citation Pills (`[1]`, `[2]`, `[3]`).
- **Citation Quality Metric:** ≥ 90% of non-refusal assistant answers MUST contain at least one verified citation pill.
- **Hover Micro-interaction:** Hovering/focusing a pill displays a tooltip showing the source title and page/timestamp (e.g. *"Raft Consensus — Page 14"*).

#### FR-10: Honest Refusal & Approval-Gated Web Search Fallback
- If the highest retrieval score is below 0.30 or retrieved chunks do not contain the answer, the assistant refuses to fabricate or confabulate.
- **Refusal Banner:** Displays a prominent inline card: *"The uploaded sources do not contain information regarding this query."*
- **Interactive Fallback Card:** Directly below the refusal, renders an approval-gated button: `[Search Web & Answer (1 Credit)]`.
- **User Gate:** Web search is NEVER initiated autonomously. Clicking the button deducts 1 daily credit, performs a live web search of verified top sources, and formats citations with explicit web domain tags (e.g. `[Web: arxiv.org]`).

#### FR-11: Real-Time Token Streaming & Conversational Context
- Assistant responses stream token-by-token via Server-Sent Events (SSE) into the chat container with an active typing cursor.
- Inline citation tags parse cleanly during streaming without broken syntax flashes.
- Conversation history retains a sliding context window of the last 7 conversation turns to balance contextual continuity against prompt limits.

---

### 4.3 Original View (Showcase) Interactive Verification

#### FR-12: Text Source Showcase
- Clicking a citation pill referencing a `TEXT` source activates the full markdown document in the Right Pane.
- Smoothly scrolls to the cited sentence and applies a persistent high-contrast highlight overlay (cyan in light mode, bright amber in dark mode).

#### FR-13: Web Source Showcase
- Clicking a citation pill referencing a `WEB` source opens the sanitized reader view.
- Auto-scrolls to the cited passage with an active focus highlight.
- Header provides the article title, publication domain, and a prominent external button: `[Open Live Page ↗]` to view the original URL in a new tab.

#### FR-14: PDF Document Showcase
- Clicking a citation pill referencing a `PDF` source activates the embedded PDF viewer.
- Instantly navigates to the exact `pageNumber` recorded in the chunk.
- Renders a semi-transparent cyan bounding-box overlay directly on top of the cited paragraph.
- Includes page navigation controls (`Page X of Y`), zoom in/out, and fullscreen toggle.

#### FR-15: YouTube & Subtitle Transcript Showcase
- Clicking a citation pill referencing a `YOUTUBE` source embeds the responsive video player pre-configured to autoplay starting at the referenced timestamp second.
- The adjacent or subordinate transcript list auto-scrolls to the matching dialogue timecode and applies an active highlight ring.
- Clicking any transcript line seeks the video player directly to that timecode.
- For uploaded `.srt`/`.vtt` transcript files (without video), displays the full timestamped dialogue list with auto-scroll and highlight on the cited block.

---

### 4.4 User Governance, Storage Quotas & Daily Credit Governor

#### FR-16: Daily Credit Governor (10 Credits / Day)
- To balance free access with computational discipline, each user receives an allowance of 10 interaction credits per day, governed on a rolling 24-hour reset window.
- **Consumption Rules:**
  - Grounded Chat response: **1 credit** per completed query.
  - Approved Web Search fallback: **1 credit** per executed search.
  - Source Ingestion (uploading, chunking, embedding, indexing): **0 credits (100% UNGATED & FREE)**.
  - Source Browsing & Original View inspection: **0 credits (100% UNGATED & FREE)**.
- **UI Credit Badge:** Top navigation bar renders a persistent badge: `⚡ 8/10 credits`. Hovering displays a tooltip indicating the exact hours/minutes until the oldest consumed credit resets.
- **Zero-Credit State:**
  - When balance reaches 0, the chat composer input and Send button are disabled.
  - Renders a locked banner: *"Daily credit limit reached (10/10). Ingestion, source inspection, and existing chat browsing remain available. Credits reset in X hours."*

#### FR-17: Storage Quotas & Size Boundaries
- Hard limits enforced server-side upon creation:
  - Max **10 Notebooks** per user.
  - Max **10 Sources** per Notebook.
  - Max **30 total Sources** across all notebooks per user.
  - Max **10MB** per PDF upload.
  - Max **5MB** per subtitle/transcript upload.
- Exceeding quotas blocks submission with a clear explanatory dialog.

---

### 4.5 Ephemeral Lifecycle & Midnight Auto-Deletion Schedule

#### FR-18: Midnight Auto-Deletion Notice (12:00 AM Asia/Kolkata)
- Active notebooks in this environment follow an explicit scheduled cleanup policy: **notebooks are auto-deleted tonight at 12:00 AM Asia/Kolkata time (UTC+05:30)**, with a secondary lazy inactivity TTL of 7 days.
- **Prominent User Notice:** The active notebook workspace displays a persistent, full-width high-contrast warning banner docked immediately below the header:
  `"⏳ Auto-deletion Notice: This notebook will be auto-deleted tonight at 12:00 AM Asia/Kolkata (UTC+05:30). Please ensure critical research is backed up."`
- **Dashboard Badge:** Notebook cards on the dashboard display an expiration badge indicating the scheduled midnight purge.
- **Purge Cascade:** At 12:00 AM IST, automated background cleanup purges notebook records, source files, vector points, and chat histories.

---

### 4.6 Product Observability & Operational Telemetry

#### FR-19: Purposeful, Minimal Operational Metrics
- Contextual implements a strictly bounded, non-invasive operational telemetry layer limited exclusively to two operational event streams:
  1. **Chat Prompt Telemetry:** Records timestamp, user ID, notebook ID, prompt character length, and credit cost (0 or 1). Never records prompt text, user queries, or assistant answers.
  2. **File Ingestion Telemetry:** Records timestamp, user ID, notebook ID, source ID, file type (`PDF`, `SRT`, `VTT`, `TEXT`), and file byte size.
- **Strict Scope Boundary:** No third-party tracking scripts, no session recording tools, no mouse movement heatmaps, and no client-side advertising pixels.

---

## 5. Non-Functional Requirements (NFRs)

| ID | Category | Target Specification | Verification Method |
|---|---|---|---|
| **NFR-1** | **Accessibility** | Full WCAG 2.2 Level AA compliance. Minimum contrast 4.5:1 for body copy; 3:1 for graphic components. All interactive controls feature high-contrast `3px solid #00E5FF` focus rings with 2px offset. Full screen reader navigation with `aria-live="polite"` on ingestion updates. | Automated axe-core audits + manual keyboard screen reader passes. |
| **NFR-2** | **Latency & Speed** | Time-to-First-Token (TTFT) for chat streaming `< 1,200ms` on broadband. Source upload acceptance acknowledgement `< 200ms` (HTTP 201). Citation pill click-to-Showcase highlight `< 250ms`. | Client performance profiling and automated synthetic tests. |
| **NFR-3** | **Failure Isolation** | 100% isolation across sources. A failure in one source (e.g. uncaptioned video or paywalled web URL) MUST NOT corrupt, delay, or block other sources in the notebook. | Error injection test suite verifying adjacent source indexing. |
| **NFR-4** | **Privacy & Security** | Strict multi-tenant data isolation. No cross-user or cross-notebook vector leakage. Uploaded user materials and conversations are NEVER used for training public foundational models. | Tenant boundary security audits. |
| **NFR-5** | **Viewport Range** | Completely fluid responsiveness from 320px mobile viewports up to 4K ultra-wide monitors without horizontal layout breaks or hidden critical actions. | Cross-browser responsive test matrix. |
| **NFR-6** | **Motion Reduction** | Honors user system setting `prefers-reduced-motion: reduce`. Disables slanted transforms, shadow lifts, and orbital spin animations, replacing them with static high-contrast underlines and border state shifts. | Accessibility compliance verification. |

---

## 6. Explicit Non-Goals & Scope Boundaries

To guarantee shipping velocity and product clarity, the following features are explicitly out of scope for v1:

- **NG-1: Raw Audio Speech-to-Text Transcription:** No custom Whisper transcription of raw `.mp3`, `.wav`, or `.m4a` files. Users must supply `.srt`/`.vtt` transcript files or YouTube URLs with existing captions.
- **NG-2: Multi-User Real-Time Collaboration:** No multi-tenant team notebooks, shared cursors, live co-authoring, or role-based access control. Each notebook is strictly private to the authenticated user.
- **NG-3: Native Mobile Applications:** No standalone iOS or Android app store downloads. Contextual is delivered as an optimized, responsive Progressive Web App (PWA) running smoothly in mobile Safari and Chrome down to 320px.
- **NG-4: AI Podcast / Audio Overviews:** No synthetic dual-host audio overviews (differentiating from Google NotebookLM's "Audio Overview" feature to focus 100% on verifiable visual proof).
- **NG-5: Paid Subscription Tiers & Billing Portals:** No Stripe checkout, premium credit add-ons, or paywalls in v1. Cost governance is enforced purely via the daily 10-credit quota.
- **NG-6: Autonomous Unsupervised Web Crawling:** The assistant never browses or indexes arbitrary web links without explicit user approval via the Honest Refusal fallback card.

---

## 7. Comprehensive User Experience (UX) & Design System Specification

### 7.1 Design Philosophy: Upgraded Modern Neo-Brutalism
Contextual's aesthetic is precision-engineered, modern neo-brutalism: high-energy, functional, crisp, and tactile. It feels like an advanced technical workbench rather than a sterile enterprise SaaS tool or a retro 90s novelty.

- **Hard Edges & Zero Blur:** Hard 2px ink borders, crisp corners (`2px–4px` radius), and solid zero-blur drop shadows (`4px 4px 0 0`).
- **Slanted Energy:** Primary interactive buttons lean forward at a `-6deg` skew (`skewX(-6deg)`), expressing momentum and velocity.
- **Reserved Semantic Accents:** Vivid yellow (`#FFE500`) represents primary user action and warnings; electric cyan (`#00E5FF`) represents citations and verified proof; emerald green (`#00E575`) represents ready state; sharp red (`#FF3333`) signals errors and credit lockouts.

```
+-------------------------------------------------------------------------------+
|                       NEO-BRUTALIST VISUAL ANATOMY                            |
+-------------------------------------------------------------------------------+
|                                                                               |
|   SLANTED BUTTON (skewX -6deg):                                               |
|   +--------------------------+                                                |
|    \  + ADD SOURCE          /  <-- 2px solid ink border                       |
|     \                      /   <-- Saturated yellow fill (#FFE500)            |
|      +--------------------+                                                   |
|       \  SOLID SHADOW     \   <-- Zero-blur offset shadow (6px -6px 0 0 ink)  |
|        +-------------------+                                                  |
|                                                                               |
|   CITATION PILL (Non-slanted, Space Mono 11px Bold):                          |
|   +-----+                                                                     |
|   | [1] | <-- 1.5px solid ink border, Electric Cyan fill (#00E5FF)           |
|   +-----+                                                                     |
|                                                                               |
+-------------------------------------------------------------------------------+
```

---

### 7.2 Color System & Semantic Palette (OKLch & Hex)

#### Light Palette (Default Mode)
| Token Name | Hex Code | OKLch Value | Semantic Role in Interface |
|---|---|---|---|
| `--bg` | `#F4F4F0` | `oklch(0.982 0.003 90)` | Canvas background (warm industrial paper) |
| `--surface` | `#FFFFFF` | `oklch(1 0 0)` | Workspace panels, cards, dialogue sheets |
| `--fg` | `#111111` | `oklch(0.21 0 0)` | High-contrast body text, primary ink borders, solid shadows |
| `--muted` | `#555555` | `oklch(0.44 0 0)` | Secondary metadata, inactive icons, timestamps |
| `--border` | `#111111` | `oklch(0.21 0 0)` | Hard 2px structural ink borders |
| `--accent` | `#FFE500` | `oklch(0.93 0.17 95)` | Brand yellow: primary CTAs, active user bubble, auto-delete banner |
| `--citation` | `#00E5FF` | `oklch(0.84 0.19 215)` | Verification cyan: citation pills, PDF bounding boxes, text anchors |
| `--danger` | `#FF3333` | `oklch(0.65 0.22 27)` | Credit exhaustion, deletion triggers, failed source state |
| `--success` | `#00E575` | `oklch(0.82 0.20 155)` | Ingestion ready status, successful verification pulse |

#### Dark Palette
| Token Name | Hex Code | OKLch Value | Semantic Role in Interface |
|---|---|---|---|
| `--bg` | `#0D0D0D` | `oklch(0.15 0 0)` | Dark canvas background |
| `--surface` | `#18181B` | `oklch(0.21 0.005 280)` | Elevated dark panels and cards |
| `--fg` | `#FFFFFF` | `oklch(1 0 0)` | Crisp white typography |
| `--muted` | `#A1A1AA` | `oklch(0.68 0.01 285)` | Dark-mode secondary labels |
| `--border` | `#E4E4E7` | `oklch(0.9 0.01 285)` | Crisp light ink borders |
| `--accent` | `#FACC15` | `oklch(0.86 0.17 95)` | Dark-mode primary yellow CTA |
| `--citation` | `#22D3EE` | `oklch(0.78 0.14 220)` | Dark-mode verification cyan |
| `--danger` | `#FF3333` | `oklch(0.65 0.22 27)` | Dark-mode destructive & error state |
| `--success` | `#00E575` | `oklch(0.82 0.20 155)` | Dark-mode ready indicator |

---

### 7.3 Three-Voice Typography System

Contextual pairs three typefaces to separate structure, narrative, and verifiable evidence:

1. **Display Voice (`Space Mono`, Weight 700 Bold):**
   - Applied to: Brand logo, page titles, notebook card titles, uppercase tags, section headers.
   - Purpose: Establishes industrial, technical authority.
2. **Working Voice (`Inter`, Weights 400 / 500 / 600):**
   - Applied to: Chat message body, assistant answers, extracted article reader text, modal instructions, form labels.
   - Line Height: Generous `1.6` line-height for effortless long-form scanning.
3. **Verifier / Receipt Voice (`Space Mono`, Monospaced Numerics):**
   - Applied to: Citation pills (`[1]`), credit counter (`⚡ 8/10`), source status badges, video timestamps (`18:42`), PDF page numbers (`Page 14 of 28`).
   - Purpose: Imparts data-dense, receipt-like auditability.

---

### 7.4 Tactile Elevation, Shadows & Spacing Rules

#### Solid Offset Elevation Scale
Zero-blur solid shadows reinforce a physical, cut-paper physical presence. All interactive surfaces follow a standardized 3-state elevation flow:

| Interaction State | Shadow Offset | Transform Vector | Behavioral Effect |
|---|---|---|---|
| **Standard / Resting** | `4px 4px 0 0 #111111` | `none` | Clean, tactile resting elevation |
| **Hover / Focus** | `6px 6px 0 0 #111111` | `translate(-2px, -2px)` | Element appears to lift toward user |
| **Active / Pressed** | `0 0 0 0 #111111` | `translate(4px, 4px)` | Element physically presses flat into the canvas |

*Exception:* Modal dialogs utilize a deeper resting shadow of `8px 8px 0 0 #111111` to establish prominent focal depth.

#### Corner Radii & Spacing Scale
- **Radii:** Sharp `sm: 2px` (citation pills, focus rings) and `md: 4px` (cards, buttons, panels). Bubbly large radii are banned; only the credit badge pill uses `9999px`.
- **Spacing Grid:** Disciplined 5-step scale: `4px` (xs), `8px` (sm), `16px` (md), `24px` (lg), `40px` (xl).

---

### 7.5 Screen Hierarchy & Multi-Surface Information Architecture

```
Contextual Web Application
├── / (Marketing Landing Page)
│   ├── Top Navigation (Brand, Features, Sign In / Sign Up)
│   ├── Hero Section (Interactive Demo Sandbox, Core Value Proposition)
│   └── Verification Feature Breakdown (PDF, YouTube, Web deep links)
├── /dashboard (Personal Notebook Hub)
│   ├── Top Bar (Brand Logo, Credit Counter "⚡ 8/10", Theme Toggle, Profile Menu)
│   ├── Quota Indicator ("Notebooks: 3/10 | Sources: 8/30")
│   ├── Notebooks Grid (3 cols desktop, 2 cols tablet, 1 col mobile)
│   │   ├── "+ New Notebook" Card (Dashed border, slanted button)
│   │   └── Active Notebook Cards (Title, creation date, midnight auto-delete badge, source count)
│   └── Create / Rename Notebook Dialog (Modal with focus trap)
└── /notebook/[id] (Research Workstation)
    ├── Persistent Expiration Banner ("⏳ Auto-deletes tonight at 12:00 AM Asia/Kolkata (UTC+05:30)")
    ├── Workspace Top Bar (Breadcrumb "← Notebooks / Consensus", Credit Badge, User Profile)
    └── Synchronized Tri-Pane Workspace (Desktop) / Tabbed Workspace (Mobile)
        ├── Pane 1: Sources & Ingestion (Left, 25% width)
        │   ├── Header ("Sources (3/10)" + Slanted "+ Add Source" Button)
        │   ├── Add Source Modal (5 Tabs: Text | Web | PDF | Subtitles | YouTube)
        │   └── Source Cards List (Type icon, title, real-time status pill, menu)
        ├── Pane 2: Grounded Chat (Center, 45% width)
        │   ├── Chat Stream (User prompt yellow bubble; Assistant markdown with [1] pills)
        │   ├── Honest Refusal Banner + Tavily Web Search Fallback Card
        │   └── Prompt Composer (Auto-expanding textarea, Send button, Credit warning)
        └── Pane 3: Original View Showcase (Right, 30% width)
            ├── Empty State ("Click any citation in chat to inspect original proof here")
            ├── PDF Viewer (PDF.js canvas, page selector, cyan bounding box)
            ├── YouTube / Transcript Viewer (Embedded iframe + synchronized scrolling dialogue)
            ├── Web Reader (Sanitized article + live URL linkout button)
            └── Text Viewer (Full markdown + highlighted span)
```

---

### 7.6 Responsive Layout Matrix (Desktop, Tablet, Mobile)

```
[ DESKTOP VIEWPORT: ≥1280px (Tri-Pane Research Workstation) ]
+----------------------------------------------------------------------------------------------------+
| BANNER: ⏳ Auto-deletion Notice: This notebook will be auto-deleted tonight at 12:00 AM IST       |
+----------------------------------------------------------------------------------------------------+
| TOPBAR: ← Notebooks / Consensus Protocols               | ⚡ 8/10 Credits | [Theme] | [Avatar]     |
+------------------------------+-------------------------------------+-------------------------------+
| SOURCES PANE (25%)           | GROUNDED CHAT PANE (45%)            | ORIGINAL VIEW SHOWCASE (30%)  |
|                              |                                     |                               |
| • Sources (3/10)             | User:                               | [PDF.js Viewer: Page 14]      |
| • [PDF] raft-paper.pdf   [R] | "How does leader election handle    | +---------------------------+ |
| • [YT]  mit-lecture.yt   [R] |  split votes in round 3?"           | | Section 5.2: Leader Elect | |
| • [WEB] arxiv-review.web [R] |                                     | | ┌───────────────────────┐ | |
|                              | Assistant:                          | | │ [CYAN HIGHLIGHT BOX]  │ | |
| [ + ADD SOURCE BUTTON ]      | "Raft resolves split votes by       | | │ "Raft uses randomized │ | |
|                              |  using randomized election          | | │  election timeouts..."│ | |
|                              |  timeouts [1]..."                   | | └───────────────────────┘ | |
|                              |                                     | +---------------------------+ |
|                              | +---------------------------------+ | [Page 14 of 28] [Zoom] [↗]   |
|                              | | Ask a grounded question... [Send] |                               |
|                              | +---------------------------------+ |                               |
+------------------------------+-------------------------------------+-------------------------------+

[ TABLET VIEWPORT: 768px - 1279px (Split Chat + Showcase) ]
+----------------------------------------------------------------------------------------------------+
| TOPBAR: [≡ Sources (3)] | Consensus Protocols                   | ⚡ 8/10 Credits | [Avatar]       |
+--------------------------------------------------+-------------------------------------------------+
| GROUNDED CHAT COLUMN (50%)                       | ORIGINAL VIEW SHOWCASE COLUMN (50%)             |
| (Sources pane opens via slide-over drawer)       | (PDF Page Render or YouTube Player + Dialogue)  |
+--------------------------------------------------+-------------------------------------------------+

[ MOBILE VIEWPORT: 320px - 767px (Single-Surface Tabbed Workspace) ]
+----------------------------------------------------------------------------------------------------+
| TOPBAR: Contextual | ⚡ 8/10 Credits                                                               |
+----------------------------------------------------------------------------------------------------+
| TAB BAR: [ Sources (3) ]        | [ Chat (Active) ]               | [ Showcase ]                   |
+----------------------------------------------------------------------------------------------------+
| Assistant: "...randomized election timeouts [1] prevent split votes..."                            |
|                                                                                                    |
| (Tapping [1] auto-switches to Showcase tab)                                                        |
|                                                                                                    |
| +------------------------------------------------------------------------------------------------+ |
| | Composer Input...                                                                       [Send] | |
| +------------------------------------------------------------------------------------------------+ |
|                                                                                                    |
| [STICKY FLOATING ACTION BUTTON (Visible when viewing Showcase): ← Back to Chat]                    |
+----------------------------------------------------------------------------------------------------+
```

---

### 7.7 Detailed Component Specifications

#### 1. Slanted Button (`<NeoButton>`)
- **Structure:** Leans forward with `transform: skewX(-6deg)`.
- **Borders & Shadow:** 2px solid ink border (`#111111`), offset drop shadow (`6px -6px 0 0 #111111`).
- **Variants:**
  - *Primary:* Yellow background (`#FFE500`), ink text.
  - *Secondary:* Pure white background (`#FFFFFF`), ink text.
  - *Destructive:* Bright red background (`#FF3333`), white text.
- **States:** Hover deepens skew to `skewX(-10deg)` with `translate(-2px, 2px)`; active press resets skew to `0` and collapses shadow.
- **Accessibility:** `prefers-reduced-motion` collapses all skews to standard rectangular orientation with a 3px underline shift.

#### 2. Inline Citation Pill (`<CitationPill>`)
- **Structure:** Non-slanted rectangle, 2px corner radius, `1.5px solid #111111` border.
- **Colors:** Vibrant cyan background (`#00E5FF`), crisp black `Space Mono` 11px bold text.
- **Interaction:** Single click activates Showcase pane and navigates to target asset. Focus/hover displays tooltip with source name and page/timestamp.

#### 3. Source Card (`<SourceCard>`)
- **Structure:** Hard 2px ink border, 4px 4px solid shadow, source type icon, truncated title.
- **Status Machine:**
  - `queued`: Muted gray border, gray dot.
  - `indexing`: Brand yellow border with orbital shadow spin indicator.
  - `ready`: Solid ink border with emerald green pulse dot.
  - `failed`: Solid red border with alert tooltip and single-click `[Retry]` button.

#### 4. Top-Bar Credit Counter (`<CreditBadge>`)
- **Structure:** Monospace pill container with 2px border displaying `⚡ {remaining}/10 credits`.
- **Thresholds:**
  - Normal (>2 credits): White surface background.
  - Warning (1–2 credits): Yellow background with warning indicator.
  - Locked (0 credits): Bright red background (`🔒 0/10 credits`), locks chat composer.
- **Interaction:** Clicking opens a modal explaining the rolling reset schedule.

#### 5. Ephemeral Expiration Banner (`<ExpirationBanner>`)
- **Structure:** Persistent full-width banner docked directly below the header.
- **Visuals:** Brand yellow background (`#FFE500`), 2px ink border, 3px solid drop shadow, bold `Space Mono` text.
- **Content:** `"⏳ Auto-deletion Notice: This notebook will be auto-deleted tonight at 12:00 AM Asia/Kolkata time (UTC+05:30)."`

#### 6. Honest Refusal & Fallback Card (`<RefusalCard>`)
- **Structure:** In-stream card with warning ink border and yellow accent corner tag.
- **Content:** Refusal statement: *"The uploaded sources do not specify the requested information."* Followed by fallback prompt: *"Search the live web via Tavily? (Consumes 1 credit)"*.
- **CTA:** Contains a `<NeoButton>` variant `[Search Web & Answer]`.

#### 7. Mobile Floating Return Button (`<MobileBackToChat>`)
- **Behavior:** Renders exclusively on mobile viewports (<768px) when the `Showcase` tab is active after being triggered by a citation click.
- **Positioning:** Fixed at bottom center (`bottom: 24px`, `z-index: 50`).
- **Visuals:** Yellow background, 2px ink border, text: `← Back to Chat`.
- **Action:** Returns user to the `Chat` tab and restores exact previous conversation scroll position.

---

### 7.8 Voice, Tone & Microcopy Standards

Contextual speaks with concise, technical honesty. It treats the user as a serious researcher who prioritizes speed and clarity over conversational pleasantries:

| Context | Contextual Voice (Correct) | Generic AI Voice (Banned) |
|---|---|---|
| **Source Gap Refusal** | "The uploaded sources do not specify Competitor X's enterprise SLA guarantee. Search the live web via Tavily? (Consumes 1 credit)" | "I'm sorry, I couldn't find that in your files! Maybe try asking something else? 😊" |
| **Low Credit Warning** | "⚠️ 2/10 credits remaining. Resets in 4h 15m." | "You're running low on credits! Click here to top up!" |
| **Credit Lockout** | "🔒 0/10 credits remaining. Composer disabled until reset at 12:00 AM IST. Ingestion and browsing remain active." | "Oops! You've used up all your fun tokens for today!" |
| **Auto-Deletion Notice**| "⏳ Auto-deletion Notice: This notebook will be auto-deleted tonight at 12:00 AM Asia/Kolkata (UTC+05:30)." | "Heads up! We might clean up your workspace soon." |
| **Video Ingestion Error**| "Failed: No captions found for this video. Upload an .srt transcript instead." | "Something went wrong! Please try again later." |
| **Showcase Empty State**| "Click any citation pill in chat to verify proof in the original source." | "No document selected yet." |

---

### 7.9 Interactive Primitives & Keyboard Ergonomics

Power researchers demand keyboard speed. Contextual implements global keyboard shortcuts across all workspace surfaces:

- `⌘K` or `Ctrl+K`: Open Notebook Switcher & Quick Navigation modal.
- `/`: Instantly focus the chat prompt composer input from anywhere in the workspace.
- `Enter`: Submit chat prompt (when composer is focused).
- `Shift + Enter`: Insert clean newline into chat composer without submitting.
- `Esc`: Close open modal sheets, dismiss credit popup, or close slide-over drawers.
- `[` / `]`: Navigate to Previous / Next page in the PDF Showcase viewer.

#### Prohibited Anti-Patterns
- ❌ **No Infinite Scrolling:** Chat conversations maintain clean session pagination; sources are capped at 10 items.
- ❌ **No Hover-Only Affordances on Touch:** Every action discoverable via hover on desktop is explicitly accessible via tap on mobile.
- ❌ **No Modal Stacking:** Sub-dialogs replace or close their parent sheets; modals never stack on top of other modals.

---

### 7.10 Accessibility Floor & Motion Reduction (WCAG 2.2 AA)

- **Contrast Compliance:** All text-to-background combinations exceed WCAG AA 4.5:1 standards (ink on paper achieves `16.2:1`; cyan on black achieves `13.1:1`).
- **Focus Rings:** Every focusable element renders a distinct `:focus-visible` ring: `3px solid #00E5FF` with a `2px` offset.
- **Screen Reader Regions:**
  - Real-time ingestion state transitions announce updates via `aria-live="polite"` (e.g. *"Source raft-paper.pdf is ready for queries"*).
  - Streaming chat updates stream into an accessible live assertive region.
- **Motion Reduction (`prefers-reduced-motion: reduce`):**
  - All button skew transforms collapse to `skewX(0)`.
  - Elevation shadow lifts collapse to static 3px solid ink underlines.
  - Ingestion orbital spin animations collapse to a static yellow badge.

---

### 7.11 First-Run Onboarding Walkthrough

First-time users entering their first notebook encounter a lightweight 3-step interactive walkthrough (powered by Driver.js):
1. **Step 1 (Highlight Left Pane):** *"Add Sources Here: Drop multi-page PDFs, YouTube links, web articles, or subtitle transcripts."*
2. **Step 2 (Highlight Center Pane):** *"Chat Grounded in Facts: Ask questions. The assistant answers strictly from your uploaded files with zero hallucinations."*
3. **Step 3 (Highlight Right Pane):** *"Deep Original View: Click any citation pill in chat to verify proof directly on the original PDF page or video timestamp."*
- Tour is dismissible at any step and can be replayed at any time from the account menu.

---

## 8. End-to-End User Journeys

### Journey 1: Elena Audits a Technical Research Paper
*Elena is a senior staff engineer investigating distributed consensus edge cases on a 1440px desktop workstation.*

1. **Intake:** Elena creates a notebook titled `"Consensus Protocols"`, drops a 28-page PDF (`raft-paper.pdf`), and pastes a conference lecture YouTube URL.
2. **Telemetry:** The Sources pane renders both items: the PDF moves from `queued` to `indexing` with an orbital neo-brutalist shadow animation, turning `ready` with a green pulse dot after 4 seconds.
3. **Inquiry:** Elena types: *"How does the leader election handle network partitions during round 3?"* and presses `Enter`.
4. **Grounded Response:** The assistant streams a concise 2-paragraph response with citation pills `[1]` and `[2]`.
5. **The Climax (Deep Verification):**
   - Elena clicks `[1]`. The right-hand Showcase instantly renders page 14 of `raft-paper.pdf`, highlighting the exact election timeout equation in vibrant cyan.
   - She clicks `[2]`. The Showcase pane switches seamlessly to the embedded YouTube player, seeking straight to `18:42` while autoscrolling the transcript dialogue to the cited sentence.
6. **Resolution:** Elena verifies the exact mechanism in under 8 seconds without leaving her keyboard or switching browser tabs.

---

### Journey 2: Marcus Conducts Mobile Market Research
*Marcus is an equity research associate reviewing earnings filings on an iPhone (390px viewport).*

1. **Intake:** Marcus logs into Contextual on mobile Safari. The screen renders the mobile tabbed interface: `[Sources (4)] | [Chat] | [Showcase]`.
2. **Inquiry:** Marcus selects the `[Chat]` tab and submits: *"What was the reported cloud gross margin guidance for Q4?"*
3. **Grounded Response:** The assistant streams an answer terminating in citation pill `[1]`.
4. **The Climax (Mobile Verification Loop):**
   - Marcus taps `[1]`.
   - The view automatically flips from `[Chat]` to the `[Showcase]` tab.
   - The PDF viewer renders page 6, centered and highlighted over the financial summary table.
   - A sticky neo-brutalist floating action button docks at the bottom center: `← Back to Chat`.
5. **Return:** Marcus audits the table, then taps `← Back to Chat`. The view flips back to the Chat tab, perfectly preserving his previous scroll position.

---

### Journey 3: Dev Resolves Source Gaps via Approval-Gated Web Search
*Dev is a product manager evaluating competitor pricing sheets on desktop Chrome.*

1. **Inquiry:** In his `"Competitor Research"` notebook containing 4 PDF pricing sheets, Dev asks: *"What is Competitor X's enterprise tier SLA guarantee?"*
2. **Missing Facts:** The uploaded pricing sheets mention seat tiers but contain no SLA data.
3. **The Climax (Honest Refusal):**
   - Instead of fabricating a plausible SLA, the assistant renders the `<RefusalCard>`:
     *"The uploaded sources do not specify Competitor X's enterprise SLA guarantee."*
   - Directly underneath: *"Search the live web via Tavily? (Consumes 1 credit)"*.
4. **User-Approved Fallback:** Dev clicks the slanted `<NeoButton>`: `[Search Web & Answer]`.
5. **Resolution:** His credit counter decrements from `⚡ 8/10` to `⚡ 7/10`. The system retrieves live web results and synthesizes a verified answer citing external domain links (e.g. `[Web: competitorx.com/sla]`).

---

## 9. Requirements Traceability Matrix

| Requirement ID | Requirement Summary | Primary User Surface | Verification Method |
|---|---|---|---|
| **FR-1** | Direct Text Ingestion (Markdown/raw text, min 50 chars, max 500KB) | Left Pane Modal | Unit & E2E form validation |
| **FR-2** | Web URL Ingestion (Clean markdown extraction, paywall error handling) | Left Pane Modal | Live web scraping test suite |
| **FR-3** | PDF Document Ingestion (≤10MB, page-by-page text extraction) | Left Pane Modal | Multi-page PDF upload validation |
| **FR-4** | Subtitle & Transcript Ingestion (.srt/.vtt, dialogue timecodes) | Left Pane Modal | Parser regex tests against timecodes |
| **FR-5** | YouTube Video Ingestion (Keyless caption fetch, missing caption warning) | Left Pane Modal | YouTube URL test suite with caption checks |
| **FR-6** | Source Management & Real-Time Telemetry (`queued`/`indexing`/`ready`/`failed`) | Left Pane Card List | UI state machine & retry tests |
| **FR-7** | Notebook CRUD & Hard Limit (Max 10 notebooks, bulk deletion) | Dashboard | Quota enforcement & cascade delete tests |
| **FR-8** | Scoped Semantic Vector Retrieval (Notebook ID isolation, topK=5, score≥0.30) | Center Chat Pane | Vector isolation security audits |
| **FR-9** | Grounded Answer Synthesis & Inline Citation Pills (`[[C:chunkId]]` → `[1]`) | Center Chat Pane | Groundedness assertion & citation regex tests |
| **FR-10** | Honest Refusal & Approval-Gated Web Search Fallback (Tavily search, 1 credit) | Center Chat Pane | Source gap refusal & approval gate tests |
| **FR-11** | Real-Time Token Streaming & Sliding Chat History (SSE stream, 7 turns) | Center Chat Pane | SSE streaming & context window tests |
| **FR-12** | Text Source Showcase (Full markdown render with persistent highlight span) | Right Showcase Pane | Text scroll & highlight DOM tests |
| **FR-13** | Web Source Showcase (Article reader + live URL linkout button) | Right Showcase Pane | Reader view & external navigation tests |
| **FR-14** | PDF Document Showcase (PDF.js canvas, page jumper, cyan bounding box) | Right Showcase Pane | PDF.js page jump & canvas overlay tests |
| **FR-15** | YouTube & Transcript Showcase (Video player synced to timecode dialogue) | Right Showcase Pane | Player seek & transcript autoscroll tests |
| **FR-16** | Daily Credit Governor (10 credits/day, rolling 24h reset, lock at 0) | Top Bar Badge | Credit decrement & lockout banner tests |
| **FR-17** | Storage Quotas & Boundaries (10 notebooks, 10 sources/notebook, 10MB PDF) | App-wide Modals | Quota boundary assertion tests |
| **FR-18** | Ephemeral Auto-Deletion Notice (12:00 AM Asia/Kolkata midnight warning) | Persistent Top Banner| Countdown banner & purge schedule tests |
| **FR-19** | Minimal Operational Telemetry (Prompt chars, file upload types/sizes) | App-wide Non-blocking| Telemetry logging verification |
| **UX-DR1** | OKLch Color Palette (Industrial paper, brand yellow, citation cyan) | Global CSS Tokens | Automated style linting & contrast audit |
| **UX-DR2** | Three-Voice Typography System (`Space Mono` Display/Verifier + `Inter` Body) | Global Fonts | Typography scale inspection |
| **UX-DR3** | Tactile Slanted Button (`skewX -6deg`, solid shadow elevation flow) | `<NeoButton>` | Micro-interaction & hover state testing |
| **UX-DR4** | Inline Citation Pill (`Space Mono` 11px, `#00E5FF`, non-slanted, tooltip) | `<CitationPill>` | Pill rendering & tooltip event tests |
| **UX-DR5** | Source Card Status Machine (4 states: queued, indexing, ready, failed) | `<SourceCard>` | Visual state transition tests |
| **UX-DR6** | Top-Bar Credit Badge (`⚡ N/10`, yellow warning ≤2, red locked at 0) | `<CreditBadge>` | Badge visual state threshold tests |
| **UX-DR7** | Ephemeral Auto-Deletion Banner (Full-width yellow band with IST countdown) | `<ExpirationBanner>` | Timezone calculation & banner layout tests |
| **UX-DR8** | Honest Refusal Card & Web Fallback (Warning border + slanted button) | `<RefusalCard>` | Refusal trigger & credit warning tests |
| **UX-DR9** | Multi-Surface Responsive Layouts (Desktop tri-pane, tablet, mobile tabs) | Workspace Layout | Viewport breakpoint tests (320px–1920px) |
| **UX-DR10** | Add Source Intake Dialog (5 modal tabs with file validation) | `<AddSourceModal>` | Tab switching & dropzone tests |
| **UX-DR11** | Deep Original View Showcase (Multi-modal inspection engine) | Showcase Container | Source-type renderer dispatch tests |
| **UX-DR12** | Keyboard Primitives & WCAG 2.2 AA Accessibility (Shortcuts, `:focus-visible`) | Global Workspace | Full keyboard navigation & axe-core pass |
