---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - planning-artifacts/prds/prd-chaibookLM-2026-08-04/prd.md
  - planning-artifacts/prds/prd-chaibookLM-2026-08-04/addendum.md
  - planning-artifacts/architecture/architecture-chaibookLM-2026-08-06/ARCHITECTURE-SPINE.md
  - planning-artifacts/ux-designs/ux-chaibookLM-2026-08-05/DESIGN.md
  - planning-artifacts/ux-designs/ux-chaibookLM-2026-08-05/EXPERIENCE.md
  - planning-artifacts/tech-stack.md
  - planning-artifacts/shikigami-sdk.md
  - planning-artifacts/sprint-change-proposal-2026-08-06.md
  - planning-artifacts/briefs/brief-chaibookLM-2026-08-04/brief.md
  - planning-artifacts/briefs/brief-chaibookLM-2026-08-04/addendum.md
---

# chaibookLM - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for chaibookLM, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-1: Create and manage notebooks — a signed-in user manages notebooks from a notebook dashboard: create, rename, open, delete (with confirmation), and bulk-delete. Cap of 10 notebooks per user; notebooks expire 1 week after creation and are auto-deleted.

FR-2: Add a text source — a signed-in user pastes text into the current notebook's textarea and submits it as a Text Source; full pasted text becomes the Source content. Empty/whitespace-only submissions rejected inline; text renders as markdown in its Original View.

FR-3: Add a web source by URL — a signed-in user submits a webpage URL; the system fetches and extracts the page's main content (title + body text) as a Web Source. Unfetchable URLs (404, paywall, non-HTML, JS-only render) surface a "failed" status with a clear reason without breaking other sources.

FR-4: List, inspect, and remove sources — the notebook shows all its sources with name, type, and status; users can remove a source (with confirmation), remove in bulk, and clear all failed sources at once. Removal removes the source's chunks from retrieval and its citations from future answers.

FR-5: Chunk and index sources with origin metadata — the system splits each Source into Chunks, stores origin metadata (which Source, position, span/offset within original text), embeds them, and makes them retrievable per notebook.

FR-6: Answer grounded in notebook sources — a signed-in user asks a question in the current notebook's chat; the answer is generated using only that notebook's Chunks as context, with per-sentence Citations to the Sources used. ≥90% of answers carry at least one Citation; cross-notebook Sources never appear as Citations; chat renders markdown.

FR-7: Refuse unanswerable questions honestly — if the notebook's Chunks cannot support an answer, the system says so plainly (no fabricated citations, no general-knowledge answer) and offers to fetch and index related web resources, executed only after explicit user approval.

FR-8: Open the original view from a citation — clicking a Citation opens the Original View: the live webpage for a Web Source (in the Showcase section), or the full pasted text for a Text Source with the cited passage highlighted via its recorded span/offset.

FR-9: Authenticate users and scope data per user — a user signs in with Clerk; all notebooks, Sources, Chunks, and chat are scoped to the authenticated user and persist server-side. Unauthenticated users cannot access another user's data; data survives a full session/logout cycle. Per-user Source cap (30) enforced with a pop-up warning.

FR-10: First-run product walkthrough — a signed-in user's first run is guided by a library-driven (Driver.js) product walkthrough introducing the sources panel, the original-view showcase, and chat. Appears on first run, is dismissible, and can be replayed.

FR-11: Public landing page — a public (no-auth) landing page explains the product and links to sign-in; uses smooth scrolling and scroll-based animations. Renders on desktop and mobile (320px+), honors Reduced Motion (animations degrade to static).

FR-12: Cookie consent and accessibility preferences — the app follows European (GDPR-style) standards: a clear notification stating exactly what is being stored ("We are storing cookies related to X and Y") must be approved before any cookies are stored. Browser accessibility configuration (color scheme, reduced motion, high contrast) honored automatically; manual overrides persisted as cookies only after consent.

FR-13: Rate-limit rejection under load — under load spikes, requests are rejected with an honest "experiencing high load at this time — try again later" message instead of failing silently or queueing unboundedly. Scoped to AI/ingestion operations; already-indexed sources and browsing remain usable.

FR-14: Dark mode — all app and landing surfaces render in a dark theme meeting the same contrast floor as light mode. Defaults from the browser's `prefers-color-scheme`, overridable and persisted via consented cookie.

### NonFunctional Requirements

NFR-1: Accessibility — the app meets WCAG 2.2 AA across the responsive web surface, in both light and dark mode (FR-14). Every interactive element is labeled with role + state; ingestion status announces on transition via aria-live (ready/failed only); streaming answers render inside a stable `aria-live="polite"` region.

NFR-2: Keyboard & focus — focus visible via a 3px ring + 2px offset on `:focus-visible` only (inverted on ink/brand fills); full keyboard path for citation chips (Tab focus, Enter open); dialogs trap focus; Esc closes the topmost dialog and returns from Showcase to Chat restoring focus; a "Skip to chat" link is the first tab stop on desktop; real tablist semantics for notebook tabs.

NFR-3: Touch targets — interactive elements are ≥44px on mobile, ≥24px on desktop.

NFR-4: Responsive — responsive web app, web-first with mobile optimization; minimum supported viewport 320px; three sections (Sources | Chat | Showcase) switched via tabs at every breakpoint; no notebook rail.

NFR-5: Performance & cost — chat history window of exactly the last 7 user+assistant turns fed per turn; chat list loads most recent 7 and pages by 7; ingestion callback must finish inside Vercel Hobby's function-duration cap; no unbounded queueing; streaming answers (AD-16).

NFR-6: Security — all LLM/embedding/search config env-driven (`baseURL`/`apiKey`/`model`); secrets never in client bundles; per-user data scoping; no raw `fetch` in client components (TanStack Query owns fetching/caching).

NFR-7: Persistence — data survives a full session/logout cycle; notebooks, sources, chunks, and chat persist server-side.

NFR-8: Privacy/consent — no non-essential cookie is written before explicit approval; consent notice lists each cookie category by name; accept, decline, and revisit supported.

NFR-9: Observability — structured application logging; event instrumentation for SM-1/SM-2 telemetry (citation attach + click-through); no credit/rate limits in development.

NFR-10: Data integrity — chunk data authority in Qdrant (vector + metadata together); single writer for chunk lifecycle; deterministic, idempotent chunk creation; fixed delete-cascade order; no rebuild on Qdrant loss (approved recovery: delete Filebase resources + honest error).

NFR-11: Limits & caps — 10 notebooks/user, 10 sources/notebook, 30 sources/user, 5MB/source, 1-week notebook TTL; caps enforced atomically server-side, configurable for future tiers; a Source that exceeds a limit is rejected with a pop-up warning.

NFR-12: Testing/acceptance floor — retrieval parameters (topK=5, minScore=0.30) are acceptance-run testable; the refusal gate value is testable in the acceptance run.

### Additional Requirements

- Greenfield project: no starter template specified in Architecture; the repo is seeded with the Next.js App Router + separate top-level `backend/` tree structural seed (AD in spine "Structural Seed").
- Ports-and-adapters (hexagonal) modular monolith over DDD bounded contexts: domain in separate top-level `backend/` tree as contexts (`notebooks`, `sources`, `chat`, `ingestion`, `limits`); Next.js is composition root + controllers only; single deployable (Vercel Hobby).
- AD-1 Chunk data authority: Qdrant is the system of record for Chunks (vector + metadata `sourceId`, `notebookId`, `span`, `position`, `text` stored together); Neon stores user + resource working metadata only; no chunk-level data in Neon; resolved-citation snapshots (chunkId + sourceId + span) allowed as rendering artifacts.
- AD-2 Recovery: Qdrant loss is NOT repaired by replaying ingestion; approved recovery = delete affected users' resource files from Filebase + surface honest error; zero backup posture in v0.1.
- AD-3 shikigami is coupled, not ported: app depends directly on `@glitch-guy0/shikigami`; SDK modifications require a detailed change-request + explicit approval; custom strategies/templates on top of the SDK are app code.
- AD-4 Single writer for chunk lifecycle: only the ingestion context creates and removes chunks; Qdrant filtered delete on `sourceId`; no other code path writes to the chunk collection.
- AD-5 One embedding model both sides: `EmbeddingService` is the only caller of the embeddings endpoint, shared by `SourceIndexer` and `VectorStoreMemoryStrategy`; env-driven (`EMBEDDING_BASE_URL`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`); changing the model is a deliberate re-index event.
- AD-6 One shared chunk kernel, deterministically split: shared type `{chunkId, sourceId, notebookId, span{start,end}, position, text}` used by ingestion, retrieval, and `CitationMapper`; splitter deterministic and span-preserving; `chunkId` = deterministic hash of `sourceId + position` (idempotent upsert); 500 chars/chunk with 25% overlap for plain text; heading-aware splitting for web (markdown from jina Reader).
- AD-7 Citation contract: markers validated, never trusted — retrieved chunks keyed by `chunkId`; `GroundedAnswerReasoningStrategy` emits per-sentence inline markers referencing only given chunkIds; `CitationMapper` validates every marker, drops unknowns, maps survivors to chips + span highlight; refusal is structural (no retrieval above minScore → no chunkIds → no citations).
- AD-8 Retrieval parameters: `topK = 5` chunks into context; `minScore = 0.30` absolute cosine threshold; retrieval scoped by `notebookId` (cross-notebook citations impossible by construction).
- AD-9 Chat history window: exactly the last 7 user+assistant turns fed per turn (sliding window); a turn = one user message + its assistant response (fetch-on-refusal sub-answer counts as its own turn); chat list loads most recent 7 and pulls next 7 on scroll; full history persists in Neon; persisted messages may carry resolved-citation snapshot.
- AD-10 Limits: one counter owner, atomic enforcement — the `limits` context owns all per-user/per-notebook counts in Neon; every write boundary routes through it; cap check-and-increment is a single Postgres transaction; only the write boundary bumps counters; delete/TTL paths reconcile counters down exactly once.
- AD-11 Notebook TTL is lazy: expiry check on dashboard load and notebook open; expired notebooks deleted and user informed; no cron in v0.1.
- AD-12 Honest degradation scoped to AI/ingestion ops: app-layer guard rejects with "experiencing high load at this time — try again later" and drops the request; trigger is env-driven request-rate threshold; already-indexed sources and browsing remain usable.
- AD-13 Web search approval-gated: `WebSearchTool` (jina) runs only after explicit user approval of a fetch-on-refusal offer; model never invokes search autonomously; fetched pages re-enter via `SourceIndexer` (counts against limits).
- AD-14 Delete cascade order: Qdrant → Filebase → Neon, owned by the ingestion context; each step idempotent; in-flight QStash ingestion must detect removal (generation/tombstone check before writing chunks).
- AD-15 Qdrant hosting is a build decision: one adapter driven by env (`QDRANT_URL` + key); cloud free-tier and self-hosted are the same adapter, different endpoints.
- AD-16 Streaming answers via shikigami events: answer delivery is streaming on; controller pulls from shikigami stream and forwards deltas to client; citation markers stream inline.
- Ingestion pipeline: app code in Upstash QStash job — fetch → readability + linkedom → Turndown → split → embed → store; QStash payload cap → callback passes `sourceId` reference only (serverless fn re-fetches metadata/raw).
- Image handling: interception layer strips images from Sources at indexing time only; original Source content never altered; implemented as a removable interceptor.
- Client data fetching via TanStack Query; markdown rendering via react-markdown + remark-gfm; first-run tour via Driver.js.
- Deployment: dev + prod environments, config entirely via environment variables, seed data for fresh/test environments; Vercel Hobby (free), Neon free, Qdrant free tier, Filebase free tier, QStash 1k msgs/day, Clerk dev.
- shikigami guardrails: `SimpleInputGuardrail` runs on every `execute()`; reasoning flows through `ReasoningManager`; Kairo stock templates are placeholders only — the custom set in `templates/` is authoritative.

### UX Design Requirements

UX-DR1: Design-token → Tailwind mapping — the `typography`/`colors`/`spacing`/`rounded`/`components` frontmatter in DESIGN.md maps 1:1 to the Tailwind theme config (colors, fontFamily, fontSize, lineHeight, borderRadius, boxShadow, spacing); components styled with utility classes only; the only custom CSS lives in globals.css for CSS custom properties that back the theme.

UX-DR2: Neo-brutalist design system — thick 2px hard borders in ink, solid offset shadows (zero blur/spread: 4px 4px for cards, 8px 8px for dialogs, 6px -6px for primary buttons), hard corners (radius 0), saturated palette, no gradients/glassmorphism/pastels; "lots of personality, zero noise"; max two loud chromas per screen.

UX-DR3: Slanted buttons — interactive buttons lean right via `skewX(-6deg)` with a more-slanted offset shadow (`skewX(-12deg)`) displaced up-right (`6px -6px 0 0`), capped at ~20°, "illuminated from bottom-left"; hover deepens lean to `skewX(-10deg)` with shadow stretched; press collapses offset to 0; only buttons slant (cards, dialogs, chips stay orthogonal); reduced-motion: hover lifts become border/underline change.

UX-DR4: Component library — primary, secondary, and danger buttons; citation chip (blue `{colors.cite}` fill, white Space Mono, 1px border, 2px radius, not slanted, rendered inline at the end of the sentence it supports, hover/tooltip reveals source title); source card (status dot + label always present, color never the only channel); user message (contained yellow right-aligned block); assistant message (open unbordered document text); composer (Enter sends, Shift+Enter newline, auto-grow, disabled while generating); dialog (heaviest object, 3px border + 8px 8px shadow, overlay-dim backdrop); showcase; notebook card (+ active brand state with non-color indicator).

UX-DR5: Dark mode everywhere — every token has a validated `-dark` pair holding the same AA floor against `surface-dark` (#16130D) and `surface-elevated-dark` (#201C14); class strategy (`dark` class on `<html>` from `prefers-color-scheme`, overridable via consented cookie); `color-scheme` set on both roots; light-on-dark inversions (e.g. yellow user chip keeps dark ink text).

UX-DR6: Typography system — three voices: Archivo Black (display: brand, empty states, notebook names, statement moments; tight 1.1–1.2; never for body), Space Grotesk (working: body, chat answers, source titles, UI labels), Space Mono (verifier/"receipt": citations, metadata, status labels); `typography` frontmatter is the single source of truth feeding Tailwind (`font-display`, `font-sans`, `font-mono`); fluid scaling down to 320px without truncation.

UX-DR7: Focus rule — 3px ring in `{colors.focus-ring}` + 2px offset in `{colors.surface}`, applied via `:focus-visible` only, inverted to surface on ink/brand fills (and to dark surface in dark mode); never shadow-based, never a glow; legible independently of hover/press.

UX-DR8: Indexing-state motion — while a Source is `queued → processing`, the card body stays static and its offset shadow animates as a rotating activity indicator (360° orbit around the card center, wider orbit radius than resting 3px); on `ready` the shadow snaps back and the card glows green (`{colors.success}`) for 1 second then fades; the glow is the only sanctioned glow; reduced-motion: rotation skipped, completion pulse is a flat non-animated color change.

UX-DR9: Notebook workspace IA — exactly three sections inside a notebook — Sources | Chat | Showcase — switched via tabs on top at every breakpoint with real tablist semantics (`role="tablist"`/`tab`, `aria-selected`, arrow-key navigation); no notebook rail and no side panel; each section is an explicit bordered/shadowed object on the cream canvas; "Back to notebooks" affordance; dashboard is the only notebook-management surface (create, open, rename, delete, bulk-delete); chat reading width max-w-2xl.

UX-DR10: Notebook dashboard — grid of notebook cards on the cream canvas: create card (opens inline creation, hits 10-notebook cap → pop-up warning with cap + current count), notebook cards showing title, source count, created + expiry meta ("Expires in N days"), per-card actions (rename/delete), bulk-select checkbox + bulk-delete (single confirmation); active/open state is brand fill with bold weight + filled glyph (never color-only); expired notebooks auto-deleted, next dashboard visit announces what was removed.

UX-DR11: Sources section — add source trigger is a `button-secondary` opening the upload dialog with two paths (textarea paste; URL field); empty/whitespace-only text rejected inline; malformed URL rejected inline before submit; source cards show icon, title, type + size, added time, status dot + label; click inspects metadata; remove via row action with confirmation ("Removing this removes its chunks from answers."); bulk remove supported; one-click "clear failed"; ingestion state `queued → processing → ready/failed` surfaced as color + label; source not queryable until ready.

UX-DR12: Chat section — assistant messages are open document-style text (react-markdown) with per-sentence citation chips inline; user messages are contained right-aligned blocks rendered as markdown; composer at bottom with Enter send / Shift+Enter newline; answer generating = sending state on composer, answer streams in as document text; network/LLM errors → inline retry on the failed message, no silent failures; "Skip to chat" link is the first tab stop on desktop.

UX-DR13: Showcase (Original View) — web source: live page in a showcase frame with loading state while the frame resolves (fallback to stored HTML snapshot if embedding blocked — OQ-U1 assumption); text source: full text with the cited passage highlighted via its recorded span/offset (`mark` semantics + highlight color, never color alone), scrolled into view; Esc returns to Chat with focus on the invoking citation chip; screen reader announces surface on navigation ("Showcase: {title}").

UX-DR14: Citation chips — first-class interactive targets: keyboard-focusable, Tab to focus, Enter to open, tooltip on hover/focus; click opens the Showcase section on the cited source; opened Original View announces the source title + highlighted passage.

UX-DR15: Upload dialog & dialogs — pop-up per addendum anchors; focus trap + initial focus inside; focus returns to the trigger on close; modal stacks one level deep (a dialog never opens on top of another dialog); warning dialog for limit violations (5MB/source, 10/notebook, 30/user, 10-notebook cap) lists limit + current count, one-button dismiss.

UX-DR16: Cookie consent banner — consent-first, visible on any surface until a decision, non-essential cookies blocked until then; names the cookie categories being stored ("We are storing cookies related to X and Y"); Accept / Decline; always revisitable from Account; theme/a11y overrides persisted as cookies only after consent.

UX-DR17: Landing page — public `/`, product story with smooth scroll + scroll-based animations; under `prefers-reduced-motion` renders statically (scroll animations degrade to static reveals); fully responsive including 320px.

UX-DR18: First-run tour — Driver.js walkthrough of the Sources, Chat, and Showcase tabs; dismissible and replayable from Account; configured with `prefers-reduced-motion`, `role="dialog"` `aria-modal`, focus containment, and Esc-to-dismiss matching the app dialog convention; no custom visual spec.

UX-DR19: Refusal + fetch-on-refusal — "Not in your sources." + single button "Find related web pages"; fetch executes only after explicit user approval; while fetching: pending state; success announces "Added N sources" (new sources appear in Sources and are queryable); failure → refusal state restored with a retryable "Try again" button, no sources added, notebook never left half-fetched.

UX-DR20: State & empty patterns — signed-out Clerk sign-in wall; cold-load skeletons matching tabbed section layout (Sources, Chat); empty notebook shows "This notebook has no sources yet." with primary action to add the first source and chat shows "Ask anything about your sources."; rate-limit rejection shows the honest high-load message with retry affordance; stale sources: after removal future answers cite only what remains.

UX-DR21: Accessibility floor behaviors — every interactive element labeled with role + state; ingestion status announces via aria-live on transition ("Source ready." / "Couldn't fetch this page." with reason; intermediate states not announced); streaming answers render inside a stable `aria-live="polite"` region (never assertive); status dots ≥3:1, meta/citation ink-muted text ≥4.5:1, active notebook brand-ink on brand ≥4.5:1, re-verified for dark tokens; `prefers-color-scheme`, `prefers-reduced-motion`, `forced-colors` detected; any transitions ≤150ms and skipped under Reduced Motion.

UX-DR22: Developer Contract — every component instance has a unique, stable debug name (e.g. `source-card-2`, `citation-chip-3`, `tab-chat`, `composer`); a debug environment (`UX_DEBUG` flag / dev mode) renders a zero-impact overlay label (absolute, top-left, pointer-events none, high z-index, no layout space); production builds strip the label at build time; components that cannot host the overlay expose a named placeholder anchor; acceptance: reviewer in debug mode reads any element's name, production shows no trace.

UX-DR23: Responsive breakpoints — ≥lg (1024px+): tabbed workspace with Sources/Chat/Showcase as bordered panels, dashboard grid 3+ cards per row; md (768–1023px): sections stack and scroll, dashboard narrows to 2 cards; <md (≤767px): single stacked surface with same tabs on top, Showcase opens full-screen from a citation tap with a labeled back button (≥44px) and Esc-to-close; minimum 320px supported; dashboard and landing page fully responsive.

### FR Coverage Map

FR-1: Epic 2 - Notebook CRUD, bulk-delete, 10-notebook cap, 1-week TTL
FR-2: Epic 3 - Paste text source
FR-3: Epic 3 - Add web source by URL
FR-4: Epic 3 - List, inspect, remove sources (bulk remove, clear failed)
FR-5: Epic 3 - Chunk + index sources with origin metadata
FR-6: Epic 4 - Answer grounded in notebook sources with citations
FR-7: Epic 4 - Honest refusal + approval-gated fetch-on-refusal
FR-8: Epic 4 - Open Original View from a citation
FR-9: Epic 1 - Clerk auth, per-user scoping, persistence, limits
FR-10: Epic 5 - First-run walkthrough
FR-11: Epic 5 - Public landing page
FR-12: Epic 5 - Cookie consent + accessibility preferences
FR-13: Epic 5 - Rate-limit rejection under load
FR-14: Epic 5 - Dark mode

## Epic List

### Epic 1: Sign In & Own Your Workspace

A user signs in with Clerk and their notebooks, sources, and chats are securely scoped to them and persist across sessions and devices.

**FRs covered:** FR-9

### Epic 2: Organize Your Research Notebooks

A user creates, renames, opens, deletes, and bulk-deletes notebooks from a dashboard, with the 10-notebook cap and 1-week auto-expiry surfaced clearly.

**FRs covered:** FR-1

### Epic 3: Bring & Index Your Sources

A user pastes text or adds a webpage URL, watches it index (queued → processing → ready/failed), inspects/removes sources (with bulk remove and clear-failed), and the system chunks + embeds them with origin metadata for retrieval.

**FRs covered:** FR-2, FR-3, FR-4, FR-5

### Epic 4: Ask Questions, Get Verifiable Answers

A user asks questions in a notebook and gets answers grounded only in that notebook's sources, with per-sentence citation chips that open the Original View (live page / highlighted text). Unanswerable questions are refused honestly, with approval-gated "find related web pages."

**FRs covered:** FR-6, FR-7, FR-8

### Epic 5: First Impressions & Trust Floor

The product opens well and behaves honestly: public landing page with scroll storytelling, first-run walkthrough, GDPR-style cookie consent, dark mode, and honest rate-limit rejection under load.

**FRs covered:** FR-10, FR-11, FR-12, FR-13, FR-14

## Epic 1: Sign In & Own Your Workspace

A user signs in with Clerk and their notebooks, sources, and chats are securely scoped to them and persist across sessions and devices.

**FRs covered:** FR-9

### Story 1.1: Bootstrap the workspace foundation

As a developer,
I want the modular monolith scaffolded with the design-token foundation,
So that every later feature builds on a consistent architecture and neo-brutalist visual system.

**Acceptance Criteria:**

**Given** a fresh clone,
**When** the app boots in dev,
**Then** a Next.js App Router app runs with a separate top-level `backend/` tree (contexts `notebooks`, `sources`, `chat`, `ingestion`, `limits`; ports `VectorStore`, `StorageService`, `Embeddings`, `search`; adapter stubs `qdrant`, `neon`, `filebase`, `clerk`, `llm`, `embeddings`, `jina`) and Next.js is the composition root and controller layer only.
**And** the whole thing ships as one deployable (Vercel Hobby), with `backend/` extractable later without a structural refactor.

**Given** the architecture rules,
**When** any adapter is needed,
**Then** it is injected at the composition root and domain code depends only on ports — adapters are never constructed by domain code.

**Given** environment configuration,
**When** the app boots,
**Then** all LLM/embedding/search/vector/storage/auth settings are env-driven (`baseURL`/`apiKey`/`model` pattern; `QDRANT_URL`, `JINA_API_KEY`, `EMBEDDING_*`, Clerk keys), dev + prod environments exist, and seed data is available for fresh/test environments.
**And** secrets are never present in client bundles.

**Given** the DESIGN.md design tokens,
**When** the Tailwind theme is configured,
**Then** colors, fontFamily, fontSize, lineHeight, borderRadius, boxShadow, and spacing map 1:1 from the DESIGN.md frontmatter; Archivo Black, Space Grotesk, and Space Mono fonts are loaded; and the `dark` class variant plus CSS custom properties in globals.css back the theme (UX-DR1).

**Given** the Developer Contract,
**When** a component renders in a debug build (dev mode or `UX_DEBUG` flag),
**Then** it shows a zero-impact overlay label with a unique stable debug name (absolute, pointer-events none, no layout space);
**And** production builds strip the label at build time with no trace (UX-DR22).

**Given** the answer runtime decision (AD-3),
**When** dependencies are installed,
**Then** `@glitch-guy0/shikigami` is a direct (coupled, not ported) dependency, with the custom template set in `backend/src/templates/` (`VectorStoreMemoryStrategy`, `GroundedAnswerReasoningStrategy`, `NotebookSession`, `WebSearchTool`, `SourceIndexer`, `EmbeddingService`, `CitationMapper`).

### Story 1.2: Sign in with your account

As a user,
I want to sign in securely with my account,
So that my workspace and research data are private and available to me.

**Acceptance Criteria:**

**Given** a signed-out visitor,
**When** they open the app,
**Then** they see the Clerk sign-in wall and cannot reach the dashboard, notebooks, sources, chat, or showcase (FR-9).

**Given** a signed-out user,
**When** they authenticate via Clerk,
**Then** they land on their own notebook dashboard.

**Given** a signed-in user,
**When** they sign out,
**Then** they return to the sign-in wall and lose access to the workspace.

**Given** a production build,
**When** client bundles are inspected,
**Then** no auth or API secrets are present; Clerk config is server-side and env-driven (NFR-6).

**Given** an expired session,
**When** a protected route is requested,
**Then** the user is redirected to sign-in and no workspace data is exposed.

### Story 1.3: Scope and persist my workspace data per user

As a user,
I want my notebooks, sources, and chats to persist and belong only to me,
So that I can resume research across sessions and devices without any risk of another user's data.

**Acceptance Criteria:**

**Given** a signed-in user with notebooks, sources, and chat history,
**When** they log out and back in (or open the app on another device),
**Then** all their data is present and intact (NFR-7).

**Given** two users A and B,
**When** B queries any API surface,
**Then** B's queries are scoped by userId at the data layer — verified at the API and data layer, not just the UI — and never return A's records (FR-9).

**Given** the persistence design (AD-1),
**When** data is written,
**Then** Neon stores only user + resource working metadata (notebooks, source records/status, limits, chat) and no chunk-level content; Qdrant remains the system of record for chunks.

**Given** an unauthenticated session,
**When** a workspace API route is hit,
**Then** it is rejected or redirected before any data access.

### Story 1.4: Establish workspace limits and counters

As a user,
I want my usage counted and capped correctly,
So that v0.1 limits are enforced honestly as I work.

**Acceptance Criteria:**

**Given** the `limits` context,
**When** any per-user or per-notebook count is needed,
**Then** the `limits` context is the single owner of those counters in Neon (AD-10).

**Given** a write boundary (create notebook, add source, upload),
**When** it routes through the limits context,
**Then** cap check-and-increment is a single Postgres transaction per operation (AD-10).

**Given** configurable caps,
**When** limits change for future tiers,
**Then** the v0.1 caps (10 notebooks/user, 10 sources/notebook, 30 sources/user, 5MB/source, 1-week TTL) are configurable server-side without code edits (NFR-11).

**Given** the Account surface,
**When** the account menu opens,
**Then** it shows a live limit overview (notebook and source counts vs. caps) sourced from the limits context (UX-DR IA Account).

**Given** a delete or TTL path,
**When** a resource is removed,
**Then** counters reconcile down exactly once (double-bump guard: only the write boundary bumps, deletion reconciles once — AD-10).

## Epic 2: Organize Your Research Notebooks

A user creates, renames, opens, deletes, and bulk-deletes notebooks from a dashboard, with the 10-notebook cap and 1-week auto-expiry surfaced clearly.

**FRs covered:** FR-1

### Story 2.1: Create a notebook

As a user,
I want to create notebooks from my dashboard,
So that I can organize my research into separate containers.

**Acceptance Criteria:**

**Given** a signed-in user on the dashboard,
**When** they use the create notebook card,
**Then** an inline name input opens, and submitting creates the notebook and opens it as an empty workspace (FR-1).

**Given** an empty or whitespace-only name,
**When** submitted,
**Then** an inline message rejects it without creating a notebook.

**Given** the user already has 10 notebooks,
**When** they attempt to create an 11th,
**Then** the create is blocked and a pop-up warning lists the cap (10) and current count (UX-DR10, NFR-11).

**Given** a new notebook,
**When** creation succeeds,
**Then** the limits context increments the notebook counter atomically in a single transaction (AD-10).

### Story 2.2: Open a notebook workspace

As a user,
I want to open a notebook and see its workspace with Sources | Chat | Showcase tabs,
So that I can work within a notebook without leaving the flow.

**Acceptance Criteria:**

**Given** a signed-in user on the dashboard,
**When** they click a notebook card,
**Then** the notebook workspace opens showing exactly three sections — Sources | Chat | Showcase — switched via tabs on top at every breakpoint, with no notebook rail and no side panel (UX-DR9).

**Given** the workspace,
**When** opened,
**Then** the tab bar uses real tablist semantics (`role="tablist"`/`tab`, `aria-selected`, arrow-key navigation) and a "Back to notebooks" affordance returns to the dashboard (UX-DR9, NFR-2).

**Given** a cold load,
**When** data is still resolving,
**Then** skeletons match the tabbed section layout and resolve on data (UX-DR20).

**Given** an empty notebook,
**When** opened,
**Then** Sources shows "This notebook has no sources yet." with a primary action to add the first source, and Chat shows "Ask anything about your sources." (UX-DR20).

**Given** the mobile viewport (≤767px),
**When** the workspace renders,
**Then** the same tabs remain on top of a single stacked surface at a minimum of 320px supported (UX-DR23).

### Story 2.3: Rename a notebook

As a user,
I want to rename a notebook,
So that its name stays meaningful as my research evolves.

**Acceptance Criteria:**

**Given** a notebook card on the dashboard,
**When** the user renames it,
**Then** the new name persists server-side and renders on the card immediately (FR-1).

**Given** an empty or whitespace-only name,
**When** submitted,
**Then** the rename is rejected inline and the previous name is preserved.

**Given** a duplicate name,
**When** submitted,
**Then** the rename is allowed (notebook names need not be unique).

### Story 2.4: Delete and bulk-delete notebooks

As a user,
I want to delete notebooks individually or in bulk with confirmation,
So that I can keep my dashboard current.

**Acceptance Criteria:**

**Given** a notebook card,
**When** the user deletes it,
**Then** a confirmation dialog appears, and confirming removes the notebook, its sources, their chunks from Qdrant, and its chat history (FR-1; AD-4/AD-14 removal path through the ingestion context).

**Given** the delete cascade,
**When** a notebook is deleted,
**Then** limits counters reconcile down exactly once (AD-10).

**Given** the dashboard,
**When** the user bulk-selects notebooks via checkboxes,
**Then** a bulk-delete toolbar appears and deleting requires a single confirmation (FR-1, UX-DR10).

**Given** a destructive action,
**When** the confirmation dialog opens,
**Then** focus is trapped and initial focus lands on the confirm button; focus returns to the trigger on close; Esc closes the dialog (NFR-2).

### Story 2.5: Auto-expire notebooks after one week

As a user,
I want notebooks to expire and auto-delete one week after creation with a clear notice,
So that my workspace never quietly accumulates stale notebooks.

**Acceptance Criteria:**

**Given** a notebook created 7+ days ago,
**When** the dashboard or the notebook is loaded,
**Then** the notebook is auto-deleted (sources, chunks, and chat) via the lazy TTL check, with no cron in v0.1 (AD-11).

**Given** the dashboard,
**When** notebooks are listed,
**Then** each card shows "Expires in N days" based on the 1-week TTL (FR-1, UX-DR10).

**Given** an expired notebook was removed,
**When** the user next reaches the dashboard,
**Then** a notice announces what was removed (FR-1, UX-DR10).

**Given** TTL expiry,
**When** the notebook is removed,
**Then** limits counters reconcile down exactly once (AD-10).

## Epic 3: Bring & Index Your Sources

A user pastes text or adds a webpage URL, watches it index (queued → processing → ready/failed), inspects/removes sources (with bulk remove and clear-failed), and the system chunks + embeds them with origin metadata for retrieval.

**FRs covered:** FR-2, FR-3, FR-4, FR-5

### Story 3.1: Build the ingestion pipeline

As a developer,
I want sources split, embedded, and stored with origin metadata by a single writer,
So that notebooks become queryable with trustworthy citations.

**Acceptance Criteria:**

**Given** a source record marked for ingestion,
**When** the pipeline runs,
**Then** the source splits deterministically into span-preserving chunks — 500 chars with 25% overlap for plain-text sources, heading-aware for web markdown — each recording its span `{start,end}` and position in the original text (AD-6).

**Given** the shared chunk kernel,
**When** chunks are produced,
**Then** they use the single type `{chunkId, sourceId, notebookId, span{start,end}, position, text}` shared by ingestion, retrieval, and CitationMapper, and `chunkId` is a deterministic hash of `sourceId + position` (AD-6).

**Given** the EmbeddingService,
**When** chunks are stored,
**Then** the OpenAI-compatible embedding model (env-driven `EMBEDDING_*`) is the only caller of the embeddings endpoint, shared later by query embedding, and each chunk is written to Qdrant with vector + metadata together (AD-1, AD-5).

**Given** the single-writer rule,
**When** ingestion runs,
**Then** only the ingestion context writes to the chunk collection (AD-4).

**Given** a QStash job,
**When** ingestion is triggered,
**Then** the callback passes only a `sourceId` reference (never the ≤5MB body), the serverless fn re-fetches source metadata/raw from Neon/Filebase, and the run finishes inside the Vercel Hobby function-duration cap.

**Given** a re-run or QStash retry,
**When** the pipeline runs again,
**Then** deterministic chunkIds make the upsert idempotent — no duplicate chunks (AD-6).

**Given** a removed source,
**When** stale in-flight ingestion fires,
**Then** a generation/tombstone check aborts the write so a deleted source's chunks never resurrect (AD-14).

**Given** source status,
**When** the pipeline transitions,
**Then** the source moves `queued → processing → ready/failed`; only final states are announced via `aria-live`, never intermediate ones (NFR-1).

### Story 3.2: Add a text source

As a user,
I want to paste text into my notebook as a source,
So that my material becomes part of my searchable notebook.

**Acceptance Criteria:**

**Given** the Sources section,
**When** the user clicks the add-source trigger (a `button-secondary`),
**Then** the upload dialog opens with both paths (paste text, URL), focus is trapped with initial focus inside, and focus returns to the trigger on close (UX-DR11, UX-DR15).

**Given** the textarea path,
**When** the user submits text,
**Then** it is enqueued for ingestion and appears in the source list as a Text Source; once ready the full pasted text is the Source content and renders as markdown in its Original View (FR-2).

**Given** empty or whitespace-only text,
**When** submitted,
**Then** an inline message rejects it without creating a source (FR-2).

**Given** a source exceeding a limit (5MB, 10/notebook, 30/user),
**When** submitted,
**Then** it is rejected with a pop-up warning listing the limit and the current count (UX-DR15).

**Given** limits,
**When** a text source is added,
**Then** the write boundary bumps the counter exactly once atomically (AD-10).

**Given** an indexing source,
**When** the card renders,
**Then** it shows the status dot + label and the shadow-only rotating loader (card body static); the source is not queryable until ready (UX-DR8, UX-DR11).

### Story 3.3: Add a web source by URL

As a user,
I want to add a webpage by URL,
So that live web content joins my notebook as a searchable source.

**Acceptance Criteria:**

**Given** the upload dialog URL path,
**When** the user submits a URL,
**Then** a malformed URL is rejected inline before submit (UX-DR11).

**Given** a valid public URL,
**When** submitted,
**Then** the system fetches the page, extracts main content (title + body text) via jina Reader (`r.jina.ai` → markdown) with readability/linkedom/Turndown, strips images at index time through the removable interceptor (original Source content never altered), and the source becomes ready with its title displayed (FR-3).

**Given** an unfetchable URL (404, paywall, non-HTML),
**When** submitted,
**Then** the source surfaces a "failed" status with a clear reason and does not break other sources (FR-3).

**Given** a page that fetches but yields no extractable main content (JS-only render),
**When** submitted,
**Then** the source surfaces a "failed" status with a clear reason (FR-3; no headless browser in v0.1).

**Given** a limit violation,
**When** submitted,
**Then** the source is rejected with a pop-up warning (cap + current count) (UX-DR15).

**Given** ingestion success,
**When** the web source becomes ready,
**Then** its chunks are heading-aware so no chunk crosses a section boundary (AD-6).

### Story 3.4: List, inspect, and remove sources

As a user,
I want to see, inspect, and remove my sources,
So that my notebook reflects only the material I trust.

**Acceptance Criteria:**

**Given** the Sources section,
**When** the notebook has sources,
**Then** each renders as a source card with icon, title, type + size, added time, and a status dot + label — color is never the only channel (UX-DR4, UX-DR11).

**Given** a source card,
**When** the user inspects it,
**Then** metadata (title, type, size, added time, status) is shown (FR-4).

**Given** a source removal,
**When** the user confirms,
**Then** the removal follows the fixed cascade order Qdrant → Filebase → Neon, each step idempotent, and the source's chunks are removed from retrieval (FR-4, AD-14).

**Given** a removal,
**When** confirmed,
**Then** the confirmation text states the consequence ("Removing this removes its chunks from answers.") and future answers cite only sources still in the notebook — never a silent drop (FR-4, UX-DR11).

**Given** multiple sources,
**When** the user bulk-selects,
**Then** they can remove them in bulk with a single confirmation (FR-4).

**Given** failed sources,
**When** the user uses "clear failed",
**Then** all failed sources are removed at once (FR-4).

**Given** removal,
**When** counters are involved,
**Then** limits counters reconcile down exactly once (AD-10).

## Epic 4: Ask Questions, Get Verifiable Answers

A user asks questions in a notebook and gets answers grounded only in that notebook's sources, with per-sentence citation chips that open the Original View (live page / highlighted text). Unanswerable questions are refused honestly, with approval-gated "find related web pages."

**FRs covered:** FR-6, FR-7, FR-8

### Story 4.1: Ask questions and get grounded, streaming answers

As a user,
I want to ask a question and see an answer grounded only in my notebook's sources,
So that I can trust that every answer comes from my own material.

**Acceptance Criteria:**

**Given** a notebook with ready sources,
**When** the user types a question in the composer and presses Enter (Shift+Enter for newline),
**Then** the answer streams in as open document text via shikigami events (AD-16), rendered as markdown; the composer is disabled while generating and auto-grows (UX-DR12).

**Given** the retrieval gate,
**When** an answer is generated,
**Then** only the current notebook's chunks are used as context (retrieval scoped by `notebookId`, `topK = 5`, `minScore = 0.30`) and sources from other notebooks never appear (AD-8, FR-6).

**Given** a completed answer,
**When** it is delivered,
**Then** ≥90% of answers carry at least one citation to a Source in the current notebook (SM-1), and citation markers stream inline with the answer text (AD-16).

**Given** the chat session,
**When** each turn is processed,
**Then** exactly the last 7 user+assistant turns are fed into context per turn (sliding window; a fetch-on-refusal sub-answer counts as its own turn) (AD-9).

**Given** an answer streaming,
**When** it renders,
**Then** it renders inside a stable `aria-live="polite"` region (NFR-1).

**Given** a network or LLM error,
**When** the answer fails,
**Then** the failed message shows an inline retry, never a silent failure (UX-DR12).

### Story 4.2: Render verifiable citation chips

As a user,
I want every answer sentence to carry an inline citation chip,
So that I can immediately see which source supports each claim.

**Acceptance Criteria:**

**Given** an answer with inline markers,
**When** it renders,
**Then** the CitationMapper validates every marker against the retrieved chunkId set, drops unknowns, and maps survivors to per-sentence inline citation chips at the end of the sentence they support (AD-7, UX-DR14).

**Given** the citation contract,
**When** a marker is invalid or unknown,
**Then** it never renders (markers are validated, never trusted — AD-7).

**Given** a citation chip,
**When** the user tabs to it,
**Then** it is keyboard-focusable, opens on Enter, and shows the source title on hover/focus (UX-DR14, NFR-2).

**Given** a refusal answer,
**When** it renders,
**Then** it carries zero citation markers (structural refusal — AD-7).

**Given** a successful answer,
**When** it carries citations,
**Then** a citation-attach telemetry event is recorded (SM-1) and each click-through is recorded (SM-2), feeding the success metrics (NFR-9).

### Story 4.3: Open the Original View from a citation

As a user,
I want to click a citation and open the original source,
So that I can verify a claim against the real material in one step.

**Acceptance Criteria:**

**Given** a citation on a Web Source,
**When** the user clicks it,
**Then** the Showcase section opens the live webpage in a showcase frame with a loading state; if embedding is blocked, it falls back to the stored HTML snapshot (FR-8, OQ-U1).

**Given** a citation on a Text Source,
**When** the user clicks it,
**Then** the Showcase opens the full text with the cited passage highlighted via its recorded span/offset using `mark` semantics + highlight color (never color alone), scrolled into view (FR-8, UX-DR13).

**Given** the Showcase tab,
**When** the user presses Esc,
**Then** it returns to Chat with focus restored to the invoking citation chip (UX-DR13, NFR-2).

**Given** Showcase navigation,
**When** it opens,
**Then** a screen reader announces the surface and the source title ("Showcase: {title}") and, for text sources, the highlighted passage (UX-DR13, UX-DR21).

**Given** a citation click,
**When** it resolves,
**Then** a click-through telemetry event records that the citation resolved to the correct Source's Original View (SM-2).

### Story 4.4: Refuse honestly and offer approval-gated fetch-on-refusal

As a user,
I want the AI to admit when it cannot answer from my sources and only search the web when I approve,
So that I am never misled by guesses and my material is never polluted without my say-so.

**Acceptance Criteria:**

**Given** a question the notebook's chunks cannot support,
**When** no retrieved chunk scores above `minScore` (0.30),
**Then** the answer is an explicit "Not in your sources." response with zero fabricated citations and a single button: "Find related web pages." (FR-7, AD-7, AD-8).

**Given** the refusal response,
**When** it appears,
**Then** it does not answer from general knowledge and the retrieval minimum (topK = 5, minScore = 0.30) is testable in the acceptance run (AD-8).

**Given** the fetch-on-refusal offer,
**When** the user approves,
**Then** the WebSearchTool (jina `s.jina.ai`, top-5) runs via the controller — the model never invokes search autonomously (AD-13) — and the fetched pages re-enter via the SourceIndexer, counting against limits (AD-13, AD-10).

**Given** the fetch running,
**When** new pages are indexed,
**Then** a pending state is shown, completion announces "Added N sources", the new sources appear in the Sources section, and subsequent answers may cite them (UX-DR19, FR-7).

**Given** a fetch failure,
**When** the search or ingestion fails,
**Then** the refusal state is restored with a retryable "Try again" button, no sources are added, and the notebook is never left half-fetched (UX-DR19).

### Story 4.5: Persist chat history with a sliding window

As a user,
I want my chat history to persist and load incrementally,
So that I can pick up a conversation where I left off without losing context.

**Acceptance Criteria:**

**Given** a chat session,
**When** the user opens a notebook,
**Then** the chat list loads the most recent 7 turns and pulls the next 7 upward on scroll (pagination by 7, never infinite scroll) (AD-9).

**Given** a conversation,
**When** the user leaves and returns,
**Then** full chat history persists in Neon and renders as before (FR-9, AD-9).

**Given** an old chat message with citations,
**When** it renders,
**Then** it carries a resolved-citation snapshot (`chunkId` + `sourceId` + span) so its chips render even though chunk data lives only in Qdrant (AD-9 carve-out).

**Given** the window,
**When** context is fed to the model,
**Then** exactly the last 7 turns are fed per turn (AD-9) — full history is never re-fed.

## Epic 5: First Impressions & Trust Floor

The product opens well and behaves honestly: public landing page with scroll storytelling, first-run walkthrough, GDPR-style cookie consent, dark mode, and honest rate-limit rejection under load.

**FRs covered:** FR-10, FR-11, FR-12, FR-13, FR-14

### Story 5.1: Public landing page with scroll storytelling

As a visitor,
I want a public landing page that tells the "grounded, verifiable" story,
So that I understand the product and can sign in before exploring.

**Acceptance Criteria:**

**Given** an unauthenticated visitor,
**When** they visit `/`,
**Then** the landing page renders with smooth scrolling and scroll-based animations explaining the product, and links to sign-in (FR-11).

**Given** a visitor who has requested reduced motion,
**When** the page renders,
**Then** scroll-based animations degrade to static reveals and smooth scroll is skipped (FR-11, UX-DR17).

**Given** any viewport,
**When** the page renders,
**Then** it is fully responsive from 320px up, on desktop and mobile (FR-11, UX-DR23).

**Given** the page content,
**When** animations run,
**Then** no autoplay, celebratory animations, or motion beyond the sanctioned scroll reveals are used (UX-DR3, UX-DR21).

### Story 5.2: Dark mode across all surfaces

As a user,
I want every surface to render in a dark theme that meets the same contrast floor as light mode,
So that I can research comfortably at night.

**Acceptance Criteria:**

**Given** the browser's `prefers-color-scheme` is dark,
**When** any surface loads (landing, dashboard, sources, chat, showcase, dialogs),
**Then** it renders in dark mode immediately with the `-dark` token pairs at the same AA floor, with no flash of the light UI (FR-14, UX-DR5).

**Given** the theme system,
**When** the user changes theme via the manual override,
**Then** the `dark` class on `<html>` updates and the choice persists across sessions via a consented cookie (FR-14, FR-12).

**Given** both roots,
**When** dark mode renders,
**Then** `color-scheme` is set on both roots so native controls match, and light-on-dark inversions hold (e.g. yellow user chip keeps dark ink text) (UX-DR5).

**Given** any theme,
**When** state changes (e.g. source removal),
**Then** switching theme does not lose state (FR-14).

### Story 5.3: Cookie consent and accessibility preferences

As a visitor,
I want clear, GDPR-style consent before any cookie is stored,
So that my privacy choices and accessibility preferences are respected.

**Acceptance Criteria:**

**Given** a first visit,
**When** the app loads,
**Then** a cookie banner appears naming the cookie categories being stored ("We are storing cookies related to X and Y" — session, preferences, usage) and no non-essential cookie is written before explicit approval (FR-12, UX-DR16).

**Given** the banner,
**When** the user chooses Accept or Decline,
**Then** the choice is honored and can be revisited later from Account (FR-12, UX-DR16).

**Given** the browser's accessibility configuration,
**When** the app loads,
**Then** `prefers-color-scheme`, `prefers-reduced-motion`, and forced-colors/high-contrast are detected automatically and honored (FR-12, UX-DR21).

**Given** a manual theme or accessibility override,
**When** the user sets it,
**Then** it persists as a cookie only after consent; if cookies are declined, the browser's live preferences are still honored every session (FR-12, UX-DR16).

### Story 5.4: First-run product walkthrough

As a new user,
I want a guided tour of the sources panel, the original-view showcase, and chat,
So that I understand the trust loop on my first run.

**Acceptance Criteria:**

**Given** a signed-in user's first run,
**When** they open a notebook,
**Then** a Driver.js walkthrough introduces the Sources, Chat, and Showcase tabs (FR-10).

**Given** the walkthrough,
**When** the user does not want it,
**Then** it is dismissible, and it can be replayed later from Account (FR-10, UX-DR18).

**Given** the tour configuration,
**When** it runs,
**Then** it honors `prefers-reduced-motion`, uses `role="dialog"` `aria-modal`, contains focus, and supports Esc-to-dismiss matching the app dialog convention (UX-DR18, NFR-1).

### Story 5.5: Honest rate-limit rejection under load

As a user,
I want the app to reject AI/ingestion requests honestly under load,
So that I get a clear message instead of a broken or erroring state.

**Acceptance Criteria:**

**Given** an AI or ingestion operation while the request-rate threshold is exceeded,
**When** the user triggers it,
**Then** an app-layer guard rejects with the honest message "Experiencing high load at this time — try again later." plus a retry affordance (FR-13, AD-12).

**Given** the rejection,
**When** it occurs,
**Then** the app never presents a broken/erroring state, and already-indexed sources and browsing remain usable (FR-13).

**Given** the guard,
**When** the threshold is exceeded,
**Then** the request is dropped (no unbounded queueing, no credit burn) and the threshold is env-driven (AD-12).

### Story 5.6: Harden the design system across all surfaces

As a user,
I want the neo-brutalist design system applied consistently and accessibly everywhere,
So that the product feels crafted and works for everyone.

**Acceptance Criteria:**

**Given** interactive buttons,
**When** they render on any surface,
**Then** they lean right via `skewX(-6deg)` with a more-slanted offset shadow (`skewX(-12deg)`, `6px -6px 0 0`, light from bottom-left); hover deepens the lean to `skewX(-10deg)`; press collapses the offset to 0; under Reduced Motion hover lifts become a border/underline change (UX-DR3).

**Given** any focusable element,
**When** it receives focus,
**Then** a `3px` ring + `2px` offset appears via `:focus-visible` only, inverted to cream on ink/brand fills (and to dark surface in dark mode) — never shadow-based, never a glow (UX-DR7).

**Given** the component library,
**When** buttons, dialogs, cards, chips, and messages render,
**Then** they follow the DESIGN.md specs (2px ink borders, hard corners, hard offset shadows, two loud chromas max per screen, `{colors.cite}` used only for citations and links) (UX-DR2, UX-DR4).

**Given** any surface,
**When** it renders,
**Then** touch targets are ≥44px on mobile and ≥24px on desktop (NFR-3), transitions are ≤150ms and skipped under Reduced Motion, and contrast is re-verified for `-dark` token pairs (ink-muted meta/citation ≥4.5:1, status dots ≥3:1, active notebook brand-ink on brand ≥4.5:1) (UX-DR21, NFR-1).
