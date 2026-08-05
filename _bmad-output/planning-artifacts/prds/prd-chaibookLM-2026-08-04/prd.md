---
title: chaibookLM — v0.1 PRD
status: final
created: 2026-08-04
updated: 2026-08-05
---

# PRD: chaibookLM (v0.1)

## 0. Document Purpose

This PRD specifies **v0.1** of chaibookLM — the first shippable slice of a NotebookLM-style research workspace: users upload sources (textarea text and webpages), and an AI answers questions grounded **only** in those sources, with citations that open the original source. It is written for the builder and downstream AI workflows (UX, architecture, epics/stories). It builds on the product brief at `_bmad-output/planning-artifacts/briefs/brief-chaibookLM-2026-08-04/brief.md`; positioning and long-term roadmap live there, not here. Later milestones (PDF, transcripts, YouTube) are deliberately out of this PRD.

## 1. Vision

chaibookLM is a research workspace where the AI never answers from general knowledge — only from *your* material — and every claim points back to the exact source you can check. v0.1 proves the core loop: bring your own text and webpages into a notebook, ask questions, get grounded answers with citations, and click a citation to see the original source itself, not a parsed extract.

Why now: NotebookLM proved the market but stays heavy, Google-bound, and feature-first. chaibookLM competes on **trust and focus**. v0.1 validates that the citation-to-original loop is worth building the rest on (positioning detail lives in the brief).

## 2. Target User

### 2.1 Jobs To Be Done
- **JTBD-1:** "When I study a topic across mixed sources, I want answers that are anchored to my own material so I can trust and verify them."
- **JTBD-2:** "When I read an answer, I want to jump to the original page/paragraph in one click, not dig through summaries."
- **JTBD-3:** "When I collect sources, I want them to become a searchable, queryable knowledge base — not a pile of files." *(v0.1: queryable via chat; a standalone search surface comes later.)*

### 2.2 Key User Journeys

- **UJ-1. Meera builds a research notebook for a topic and verifies an answer.**
  - **Persona + context:** Meera, a lifelong learner researching "indoor plant care" from a blog post and a pasted article.
  - **Entry state:** Signed in via Clerk. Opens the app on her laptop.
  - **Path:** Creates a notebook → pastes text from one article → adds a webpage URL as a second source → waits for indexing confirmation → types "What's the best way to avoid overwatering?" in chat.
  - **Climax:** The answer returns with two inline citations, one per source.
  - **Resolution:** She clicks the webpage citation and the Showcase tab opens the live original page. She trusts the answer and continues asking.
  - **Refusal turn:** If she asks something her sources don't cover, the answer says so and offers to fetch related web resources; on her approval they are fetched, indexed, and join the notebook.

- **UJ-2. Sam curates his sources over time.**
  - **Persona + context:** Sam, a student who keeps returning to the same study notebook across sessions.
  - **Entry state:** Signed in; lands on his **notebook dashboard**, which lists his notebooks with their sources, age, and expiry.
  - **Path:** Opens a notebook from the dashboard → inspects a source's metadata → removes an outdated source (with confirmation) → returns to the dashboard to bulk-delete a couple of stale notebooks → opens his study notebook again and asks a new question in chat.
  - **Climax:** The new answer cites only sources still in the notebook.
  - **Resolution:** He trusts the notebook reflects only his current sources and keeps working.

## 3. Glossary

- **Notebook** — a named container of sources and chat history. Users can have multiple notebooks, each with its own set of sources.
- **Source** — a unit of ingested content within a notebook: either a **Text Source** (pasted textarea content) or a **Web Source** (fetched webpage).
- **Chunk** — a discrete indexed unit of a Source, created during ingestion, carrying metadata (origin, position).
- **Citation** — a clickable reference attached to an answer sentence, pointing to the Source (and, where possible, the specific Chunk/position) the model grounded on.
- **Original View** — the rendered original resource behind a Citation: the pasted text for a Text Source; the live webpage for a Web Source.

## 4. Features

### 4.1 Notebooks
**Description:** Users create, rename, switch between, and delete notebooks. Each notebook isolates its Sources and chat.

**Functional Requirements:**

#### FR-1: Create and manage notebooks
A signed-in user manages their notebooks from a **notebook dashboard**: create, rename, open, delete (with confirmation), and bulk-delete notebooks. Each user is capped at **10 notebooks**. A notebook **expires 1 week after creation** and is auto-deleted (cost-cutting measure). Realizes UJ-1 and UJ-2.
**Consequences (testable):**
- A user can create 2+ notebooks and open them without losing chat history or sources.
- Deleting a notebook removes its sources and chat history after confirmation; bulk-delete removes multiple selected notebooks after a single confirmation.
- A 10th notebook creation attempt is rejected with a pop-up warning showing the cap and current count.
- A notebook created 7+ days ago shows its expiry date; an expired notebook is auto-deleted with its sources and chat, and the user is informed the next time they reach the dashboard.

### 4.2 Sources (Text & Web)
**Description:** Users add Sources to the current notebook via two paths: pasting text into a textarea, or providing a webpage URL. Ingestion runs async with visible status (queued → processing → ready/failed).

**Functional Requirements:**

#### FR-2: Add a text source
A signed-in user can paste text into the current notebook's textarea and submit it as a Text Source; the full pasted text becomes the Source content. Realizes UJ-1.
**Consequences (testable):**
- Submitted text appears in the notebook's source list with a "ready" status after ingestion.
- Empty or whitespace-only submissions are rejected with an inline message.
- The submitted text renders as markdown in its Original View.

#### FR-3: Add a web source by URL
A signed-in user can submit a webpage URL; the system fetches and extracts the page's main content (title + body text) as a Web Source. Realizes UJ-1.
**Consequences (testable):**
- A valid public URL becomes a ready Web Source with its title displayed.
- Unfetchable URLs (404, paywall, non-HTML) surface a "failed" status with a clear reason and do not break other sources.
- A page that fetches but yields no extractable main content (e.g. a JS-only render) surfaces a "failed" status with a clear reason.

#### FR-4: List, inspect, and remove sources
The notebook shows all its sources with name, type, and status; users can remove a source (with confirmation) and see metadata (e.g., title, added time). Realizes UJ-1 and UJ-2.
**Consequences (testable):**
- Removing a source removes its chunks from retrieval and its citations from future answers.
- Sources can be removed in bulk (with confirmation).
- All failed Sources can be cleared at once with a single action.

### 4.3 Indexing
**Description:** During ingestion, each Source is split into Chunks with rich metadata (origin Source, position, and for Web Sources the section/heading if extractable). Chunks are embedded and stored for retrieval. This is the foundation for Citations — visible to users only as an ingestion status indicator.

**Functional Requirements:**

#### FR-5: Chunk and index sources with origin metadata
The system splits each Source into Chunks, stores origin metadata (which Source, position in order, and span/offset within the original text), embeds them, and makes them retrievable per notebook. Realizes UJ-1.
**Consequences (testable):**
- Every Chunk stored is associated with exactly one Source; retrieval returns Chunks scoped to the current notebook only.
- Each Chunk records the span/offset it occupies within its Source's original text (start/end), so a cited passage can be located and highlighted in the Original View.

### 4.4 Chat with Citations
**Description:** The chat surface answers questions grounded only in the current notebook's Chunks. Every answer sentence carries inline Citations to the Sources used; clicking a Citation opens the Original View. Answers that cannot be grounded are refused honestly.

**Functional Requirements:**

#### FR-6: Answer grounded in notebook sources
A signed-in user can ask a question in the current notebook's chat; the answer is generated using only that notebook's Chunks as context, with per-sentence Citations to the Sources used. Realizes UJ-1.
**Consequences (testable):**
- ≥90% of answers carry at least one Citation to a Source in the current notebook.
- Sources from other notebooks never appear as Citations.
- Chat messages (user and assistant) render markdown.

#### FR-7: Refuse unanswerable questions honestly
If the notebook's Chunks cannot support an answer, the system says so plainly instead of answering from general knowledge, and offers to fetch and index related web resources — executed only after explicit user approval.
**Consequences (testable):**
- A question outside all Sources returns an explicit "not found in your sources" response with no fabricated Citations, plus a suggestion to fetch related web resources.
- The refusal fires when no retrieved Chunk scores above the retrieval minimum; the minimum is defined in architecture and its value is testable in the acceptance run.
- A fetch suggestion is executed only after explicit user approval; the fetched Sources are indexed, join the notebook, and appear in subsequent answers.

#### FR-8: Open the original view from a citation
Clicking a Citation opens the Original View of the referenced Source: the full pasted text for a Text Source; the live webpage for a Web Source. Realizes UJ-1.
**Consequences (testable):**
- A Citation on a Web Source opens the original URL in the Showcase section (in-app tab — see addendum Design anchors).
- A Citation on a Text Source opens the Source's full text with the cited passage highlighted via its recorded span/offset.

### 4.5 Auth & Persistence
**Description:** Accounts via Clerk. Each user's Notebooks, Sources, and chat persist server-side so sessions resume across devices.

**Functional Requirements:**

#### FR-9: Authenticate users and scope data per user
A user signs in with Clerk; all notebooks, Sources, Chunks, and chat are scoped to the authenticated user and persist server-side. [ASSUMPTION: exact persistence store (database choice) is an architecture decision, not a PRD requirement]
**Consequences (testable):**
- An unauthenticated user cannot access another user's notebooks.
- Data survives a full session/logout cycle.
- The user's total Source count is tracked and the per-user cap (30) is enforced with a pop-up warning when exceeded.

#### FR-10: First-run product walkthrough
A signed-in user's first run is guided by a library-driven product walkthrough introducing the sources panel, the original-view showcase, and chat. Realizes UJ-1.
**Consequences (testable):**
- The walkthrough appears on first run, is dismissible, and can be replayed.

### 4.6 Landing, Consent & Platform

**Description:** A public landing page presents the product and signs users in; the app follows European web standards for cookies and accessibility; and the service degrades honestly under load instead of erroring.

#### FR-11: Public landing page
A public (no-auth) landing page explains the product and links to sign-in. It uses smooth scrolling and scroll-based animations to tell the "grounded, verifiable" story. Realizes the brief's first-impression differentiator.
**Consequences (testable):**
- The landing page is reachable unauthenticated, renders on desktop and mobile (320px+), and honors Reduced Motion (animations degrade to static).
- Smooth scroll and scroll-triggered animations run only when the user has not requested reduced motion.

#### FR-12: Cookie consent and accessibility preferences
The app follows European (GDPR-style) standards: before any cookies are stored, the user is shown a clear notification stating exactly what is being stored ("We are storing cookies related to X and Y") and must approve. Browser accessibility configuration (color scheme, reduced motion, high contrast) is honored automatically; manual overrides are available and persisted as cookies only after consent. Realizes the accessibility floor.
**Consequences (testable):**
- No non-essential cookie is written before explicit approval.
- The consent notice lists each cookie category by name; the user can accept, decline, and revisit the choice.
- `prefers-color-scheme`, `prefers-reduced-motion`, and forced-colors/high-contrast are detected from the browser; a manual theme/accessibility override persists via consented cookies.

#### FR-13: Rate-limit rejection under load
When the service is under load (spikes), requests are rejected with an honest "experiencing high load at this time — try again later" style message instead of failing silently or queueing unboundedly. Realizes cost posture and honest-degradation.
**Consequences (testable):**
- A rejected request returns a clear, human message and a retry affordance; the app never presents a broken/erroring state.
- The rejection is scoped to AI/ingestion operations; already-indexed sources and browsing remain usable.

#### FR-14: Dark mode
All app and landing surfaces render in a dark theme that meets the same contrast floor as light mode. Dark mode defaults from the browser's `prefers-color-scheme` and is overridable (persisted via consented cookie). Realizes the accessibility floor and modern web-standard expectation.
**Consequences (testable):**
- Every surface (landing, dashboard, sources, chat, showcase, dialogs) renders in dark mode with AA contrast.
- Switching theme does not lose state; the choice persists across sessions (with consent).

## 5. Non-Goals (Explicit)

People who need these capabilities are non-users for v0.1 (and mostly for v1):

- No PDF, transcript, or YouTube ingestion in v0.1 (deferred to v0.3–v1).
- No unprompted web search or resource discovery. Fetch-on-refusal is in v0.1 (FR-7) and always requires explicit user approval; standalone websearch-to-ingest remains deferred.
- No audio transcription (not planned, even at v1), OCR/image sources, collaboration, sharing, enterprise features, or native mobile apps.
- No payments or billing; no credit/rate limiting in v0.1 [ASSUMPTION: cost is bounded by single-builder usage; a credit gate arrives at v1 per the brief]. `[NOTE FOR PM]` cost watch: commercial APIs in v0.1 mean per-use cost; revisit if usage grows beyond builder-only.
- No offline mode.

## 6. MVP Scope

### 6.1 In Scope
- Clerk sign-in; per-user data persistence (notebooks, Sources, Chunks, chat).
- Notebook dashboard as the only notebook-management surface (create/open/rename/delete, bulk-delete); **no persistent notebook rail** inside a notebook.
- Multiple notebooks (up to **10 per user**); notebook auto-delete after **1 week** (cost-cutting).
- Text Sources (textarea) and Web Sources (URL fetch + extraction).
- Chunking + embedding with origin metadata; per-notebook retrieval.
- Chat grounded in Sources with inline Citations, honest refusal, and approval-gated fetch-on-refusal (FR-7).
- Citation → Original View (live page for Web; full text for Text).
- Markdown rendering for Text Sources and chat messages (user and assistant).
- Responsive web app, mobile-optimized (minimum supported viewport 320px). Inside a notebook, exactly **three sections — Sources | Chat | Showcase — switched via tabs on top**.
- Neo-brutalist, zero-noise design language applied to all surfaces, with **dark mode** (FR-14) and a **Tailwind CSS** design stack. [ASSUMPTION: a lightweight design pass precedes or runs parallel to build]
- Public **landing page** with smooth scroll + scroll-based animations (FR-11).
- **Cookie consent** following European standards, with clear per-category cookie disclosure and accessibility-preference persistence (FR-12).
- **Rate-limit rejection** under load with an honest "high load, try again later" message (FR-13).
- Event instrumentation for SM-1/SM-2 telemetry (citation attach + click-through).
- First-run product walkthrough (FR-10).
- Structured application logging; no credit/rate limits in development.
- Up to 10 Sources per notebook (a v0.1 product bound, not a storage limit).
- Up to 30 Sources total per user.
- 5 MB max per Source (applies to any Source type).
- A Source that exceeds a limit (size or count) is rejected with a pop-up warning.
- Per-user Source and notebook counts and limits are stored server-side and configurable for future tiers.

## 7. Success Metrics

**Primary**
- **SM-1:** ≥90% of chat answers carry ≥1 Citation to a Source in the current notebook. Validates FR-6. *Counter: citation spam — answers citing sources they didn't use. Do not optimize by always-citing; keep citations factual.*
- **SM-2:** Citation click-through — ≥60% of answers that carry Citations see at least one Citation clicked, resolving to the correct Source's Original View. Validates FR-8.

**Secondary**
- **SM-3:** Multiple notebooks created and used, with Sources growing beyond the first upload (targets: builder creates 2+ notebooks within the first month; at least one notebook reaches ≥3 Sources). Validates FR-1.
- **SM-4:** Ingestion success — Web Source fetch+extraction succeeds on normal public URLs ≥80% of the time. Validates FR-3.

**Counter-metrics (do not optimize)**
- **SM-C1:** Citation count per answer — optimizing this upward encourages citation inflation; the target is factual grounding, not density.

## 8. Open Questions

1. Retrieval approach and the specific OpenAI-compatible provider [decision: OpenAI-compatible only] — architecture decision. [OQ-1]
2. ~~Citation granularity~~ — **resolved in UX (2026-08-05): per-sentence inline citation chips.** [OQ-4]

## 9. Assumptions Index

- §4.5 FR-9 — persistence store choice is an architecture decision.
- §5 — no credit gate in v0.1; cost bounded by builder-only usage.
- §6.1 — a lightweight neo-brutalist design pass runs before/parallel to build.
