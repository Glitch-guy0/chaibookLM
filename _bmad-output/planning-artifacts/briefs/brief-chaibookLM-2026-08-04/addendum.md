# Addendum — Contextual (Gemini Notebook Clone)

Companion to `brief.md`. Technical context, failure management architecture, and downstream decisions captured for reference.

## Competitive Landscape (NotebookLM / Gemini Notebook)

- **Source Breadth:** Google supports text, URLs, Google Drive, PDFs, audio files (with transcription), and YouTube links.
- **Citation Model:** Google provides inline citation chips opening a quote preview popup. **Our advantage:** Contextual opens the actual original document/media (exact PDF page, live webpage, YouTube timestamped player, or full text with persistent highlight).
- **Proactive Search:** Google's "Deep Research" proactively searches and ingests. **Our stance:** Approval-gated fallback via Tavily when notebook chunks fail to answer (FR-3.3). Search does not run autonomously.

## Direct v1 Production Release Scope Rationale

Phased milestone delivery (v0.1 → v0.3 → v0.6 → v1) introduced unnecessary serialization when the core domain architecture (`backend/` contexts) already accommodates multi-modal source extractors. Shipping all source modalities (text, web, PDF, transcripts, YouTube) directly in v1 meets the real-world standard for a true research workspace.

## Inngest Internal Failure Management Architecture

Serverless environments (Vercel Hobby) enforce execution timeout limits (~10s to ~60s max) and lack native background job retries. Heavy ingestion workloads (extracting 30-page PDFs, scraping JS-rendered web pages, pulling long YouTube transcripts, batch embedding) will fail if run synchronously in the request path.

### Why Inngest
1. **Durable Step Functions:** Ingestion is decomposed into idempotent steps (`step.run('extract-content')`, `step.run('chunk-text')`, `step.run('generate-embeddings')`, `step.run('upsert-qdrant')`). If step 3 fails due to an API timeout, Inngest resumes directly at step 3 on retry without re-scraping or re-parsing.
2. **Automatic Retries & Exponential Backoff:** Built-in resilience against transient provider errors (Firecrawl 429s, OpenAI 503s, Qdrant timeouts) without custom polling or cron code.
3. **Failure Isolation & Status Reporting:** Inngest handlers catch terminal errors, log structured diagnostics, and update Neon source status to `failed` with a user-friendly error reason. Notebook state and other active sources are never corrupted.
4. **Zero-Infra Setup:** Integrates directly into Next.js via `/api/inngest` with no Redis or dedicated worker fleet required on Vercel.

## Upgraded Neo-Brutalist UI Specification

1. **Tri-Pane Workspace:**
   - **Left Pane (Sources & Upload):** Source list, ingestion progress badges (`queued`, `indexing`, `ready`, `failed`), upload modal supporting direct text paste, URL entry, PDF dropzone, `.srt`/`.vtt` file dropzone, and YouTube link submission.
   - **Center Pane (Chat):** Conversation stream, grounded answer cards, inline citation pill markers (`[1]`, `[2]`), copy controls, streaming cursor, and honest refusal banners with "Search Web" trigger buttons.
   - **Right Pane (Showcase / Original View):** Dynamic viewer dynamically switching based on active citation:
     - Text viewer with auto-scroll and mark-highlight.
     - Web reader view with article text and original URL linkout.
     - Canvas-based PDF page renderer (PDF.js / React-PDF) displaying the target page with bounding box highlight.
     - Embedded YouTube video player configured with `start={seconds}&autoplay=1`.
2. **Responsive Adaptation:**
   - Desktop (≥1280px): Persistent 3-column layout.
   - Tablet (768px–1279px): Collapsible Left pane, split Chat + Showcase.
   - Mobile (320px–767px): Tabbed interface (`Sources` | `Chat` | `Showcase`), auto-switching to `Showcase` tab upon citation tap.
3. **Neo-Brutalist Tokens:**
   - High-contrast 2px solid borders (`border-black` / `dark:border-white`).
   - Tactile button offsets (`shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`).
   - Modern monospace and clean grotesque typography with high legible hierarchy.

## Daily Credit Limit & Cost Governance

- **10 credits/day** per user, rolling 24-hour reset.
- Each grounded chat answer consumes 1 credit.
- Each approved web search consumes 1 credit.
- Source uploads, parsing, indexing, and browsing remain ungated (free).
- **Billing / Payments:** Deliberately omitted from v1. The credit limit serves as an automated firewall against runaway API costs.

## Rejected / Reframed Approaches

- ~~Multi-phase phased release (v0.1, v0.3, v0.6, v1)~~ → Replaced with direct v1 production release.
- ~~Synchronous serverless ingestion / ad-hoc QStash jobs~~ → Replaced with Inngest step functions for durability and error recovery.
- ~~Quote-snippet citations~~ → Replaced with rich Original View across all media formats.
- ~~Unprompted web crawling~~ → Replaced with strict citation grounding and approval-gated web search.
