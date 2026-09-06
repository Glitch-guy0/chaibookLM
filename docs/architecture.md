# Contextual — Architecture Reference (v1 Direct Production)

Condensed from [`ARCHITECTURE-SPINE.md`](../_bmad-output/planning-artifacts/architecture/architecture-Contextual-2026-09-06/ARCHITECTURE-SPINE.md). These architectural decisions (ADs) are authoritative invariants for Contextual v1.

---

## Paradigm

Contextual is a **Modular Monolith** applying **Ports-and-Adapters (Hexagonal Architecture)** over domain-driven bounded contexts, orchestrated asynchronously via **Inngest Durable Workflows**:
- **Presentation & Controllers (`app/api/`)**: Thin Next.js App Router handlers managing HTTP requests, Clerk session authentication, and SSE streaming.
- **Domain & Application Services (`backend/src/contexts/`)**: Organized strictly by bounded context (`notebooks`, `sources`, `chat`, `ingestion`, `limits`, `telemetry`).
- **Ports (`backend/src/ports/`)**: Pure TypeScript interfaces insulating domain logic from vendor SDKs (`VectorStore`, `StorageService`, `Embeddings`, `Search`, `WebExtractor`, `CaptionsService`).
- **Composite Adapters (`backend/src/adapters/`)**: Swappable infrastructure implementations (`QdrantAdapter`, `NeonRepository`, `CloudinaryAdapter`, `OpenAIEmbeddingsAdapter`, `TavilyAdapter`, `FirecrawlAdapter`, `YouTubeCaptionsAdapter`).
- **Asynchronous Execution Backbone (`app/api/inngest/route.ts`)**: Inngest durable step-functions partitioning multi-modal ingestion into sub-5s memoized steps with concurrency caps and failure isolation.
- **Universal Intermediate Representation**: All source modalities are normalized into clean, structured **Markdown** prior to chunking and vector indexing.

```
backend/src/
  contexts/          # notebooks, sources, chat, ingestion, limits, telemetry
  shared-kernel/     # canonical chunk types, citation marker syntax, DTOs
  ports/             # VectorStore, StorageService, Embeddings, Search, WebExtractor, CaptionsService
  adapters/          # qdrant, neon, cloudinary, clerk, openai, tavily, firecrawl, youtube
  chunking/          # markdown-aware semantic token segmenters
```

---

## Authoritative Architecture Decisions

| AD | Category | Rule & Invariant |
|---|---|---|
| **AD-1** | Chat / Citations | Assistant completions must be grounded exclusively in retrieved chunks from the active notebook. LLM emits inline markers `[[C:chunkId]]`. Refusal triggers if top retrieval score < 0.30. Client parser maps `[[C:chunkId]]` to sequential Inline Citation Pills `[1]`, `[2]`. |
| **AD-2** | Vector Store | Qdrant is the **sole system of record for chunks** (vectors + text + metadata together). All chunks live in a single unified collection `contextual_chunks_v1` with indexed keyword fields (`notebookId`, `userId`, `sourceId`). Neon never stores chunk text. Explicit invariant: **No Graph Database** in this project. |
| **AD-3** | Ephemeral Storage | Uploaded binaries (PDFs in Cloudinary) exist **only temporarily** during active ingestion. Once parsed, chunked, and upserted into Qdrant (`status: 'ready'`), Cloudinary binaries are immediately deleted. Users solely rely on indexed chunks and chat. Zero backup infra. |
| **AD-4** | Ingestion Engine | `POST /api/sources` immediately commits `status: 'queued'`, dispatches an Inngest event, and returns HTTP 201 (< 200ms). Pipeline: `extract` → `normalize-to-markdown` → `chunk-markdown` → `embed` → `index-qdrant` → `delete-temp-binary` → `update-neon-status`. Per-user concurrency cap of 2. |
| **AD-5** | Failure Isolation | Failure during ingestion of one source NEVER blocks, corrupts, or delays any other source or the active notebook. Upon retry exhaustion or deterministic error, Inngest triggers `onFailure`, marking the source `status: 'failed'` with an actionable `errorReason` in Neon and purging temp binaries. |
| **AD-6** | Universal Markdown | **Markdown is the single universal intermediate format across all modalities.** PDFs convert to paginated Markdown (`<!-- page: N -->`), YouTube/subtitles convert to timecoded Markdown (`<!-- time: mm:ss -->`), Web converts to clean markdown. Chunks segment at ~500 tokens from this Markdown. Deep Original View pairs structural locators with substring text search for `excerpt`. |
| **AD-7** | Multi-Modal Parsers | PDF extracted via pure-JS serverless parser (`unpdf` / `pdf-parse`) in Inngest step. YouTube captions extracted keyless via `youtube-transcript`. Web extracted via Firecrawl API. Subtitles parsed via native regex timecode splitters. |
| **AD-8** | RAG Runtime | LangChain (`@langchain/core`, `@langchain/openai`, `langchain`) orchestrates prompt templates, retrievers, and streaming runnable sequences. Chat and Embeddings endpoints are independently configured via environment variables. |
| **AD-9** | Web Search | Live web search NEVER executes autonomously. When active notebook sources yield an Honest Refusal, UI renders `[Search Web & Answer (1 Credit)]`. Search executes via Tavily only on explicit user click, tagging citations as `[Web: domain.com]`. |
| **AD-10** | Unified 12 AM IST Reset | Daily user credits reset to **10 credits** at a strict, unified schedule: **12:00 AM Asia/Kolkata (18:30 UTC / 00:00 IST)**. Grounded chat completions consume 1 credit; approved web searches consume 1 credit. Ingestion and browsing consume 0 credits. |
| **AD-11** | Midnight Purge Cascade | Active notebooks auto-delete at **12:00 AM Asia/Kolkata (18:30 UTC / 00:00 IST)** via Inngest cron (`fnMidnightMaintenance`). Purges Qdrant vector points, Cloudinary temp assets, and Neon records (`notebooks`, `sources`, `chat_messages`). Notice banner permanently displayed on workspace. |
| **AD-12** | Telemetry & OLAP Rollup | Operational tables `telemetry_chat_prompts` and `telemetry_file_uploads` track daily activity. At **12:00 AM IST (18:30 UTC)**, an OLAP processing step consolidates all recorded rows for the day into a single summary record in `telemetry_daily_aggregates`, preserving historical analytics while purging raw operational rows. |
| **AD-13** | Monolith Boundary | Next.js App Router owns routing, authentication middleware, and presentation only. All domain entities, bounded context services, ports, and composite adapters reside in the top-level `backend/src/` directory. |
| **AD-14** | Chat Window | Exactly the last 7 conversation turns (user + assistant) are pulled from Neon and injected into the LLM context. Full conversation history is retained in Neon for client pagination, but older messages are excluded from the active LLM prompt. |
| **AD-15** | Quotas & Caps | Hard server-side caps: max 10 notebooks per user, max 10 sources per notebook, max 30 sources per user, max 10MB per PDF upload, max 5MB for transcript files. Violations return HTTP 422 with an actionable modal. |
| **AD-16** | Neo-Brutalism & UI | Desktop (≥1280px) renders persistent 3-column split (`Sources 25% | Chat 45% | Showcase 30%`). Mobile (<768px) renders single tabbed pane `[Sources | Chat | Showcase]`. Slanted buttons use `-6deg` skew with `6px -6px` solid ink shadow. Full WCAG 2.2 AA compliance in light and dark modes. |

---

## Deployment & Environments

- **Deployment Platform**: Vercel Serverless (Hobby Free Tier)
- **Relational Store**: Neon Serverless PostgreSQL (one multi-tenant database)
- **Vector Store**: Qdrant Cloud Free Tier (1GB cluster, single collection `contextual_chunks_v1`)
- **Blob Storage**: Cloudinary (temporary buffer during active ingestion only; purged post-index)
- **Async Execution & Crons**: Inngest Cloud (`/api/inngest` worker gateway)
- **Web Scraping**: Firecrawl API
- **Web Search**: Tavily API
- **Authentication**: Clerk

---

## Related Diagrams & Specifications

- **L1 System Context**: [`docs/c4/system-context.mmd`](c4/system-context.mmd)
- **L2 Containers**: [`docs/c4/containers.mmd`](c4/containers.mmd)
- **L3 Ingestion Components**: [`docs/c4/components/ingestion.mmd`](c4/components/ingestion.mmd)
- **L3 Chat Components**: [`docs/c4/components/chat.mmd`](c4/components/chat.mmd)
- **Ingestion Flow**: [`docs/flows/sequence-ingestion.mmd`](flows/sequence-ingestion.mmd)
- **Chat Flow**: [`docs/flows/sequence-chat.mmd`](flows/sequence-chat.mmd)
- **Lifecycle Flow**: [`docs/flows/sequence-lifecycle.mmd`](flows/sequence-lifecycle.mmd)
- **Master Index**: [`docs/indexes/diagram-index.md`](indexes/diagram-index.md)
