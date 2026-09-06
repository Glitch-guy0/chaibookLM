# Contextual — Tech Stack (v1)

Decided 2026-08-05, updated 2026-08-06, updated 2026-08-12 (Jina → Tavily/Firecrawl, Filebase → Cloudinary), updated 2026-09-06 (shikigami SDK → LangChain, QStash → Inngest). Source of truth for external dependencies. Mirrors `prds/prd-contextual-v1-2026-09-05/` dependency map + PRD decisions. For provisioning/account status of every external service named below, see `external-tools-tracker.md`.

## Stack

| Concern | Pick | Note |
|---|---|---|
| Frontend/Backend | Next.js (App Router) on **free Vercel deployment (Hobby)** | **Modular monolith**: controllers/routes live in Next only; domain + application + infrastructure services live in a `backend/` folder |
| Client data fetching | **TanStack Query** (default recommendations) | Internal caching for all client data; no raw `fetch` in components |
| Design/CSS | **Tailwind CSS** | DESIGN.md tokens map 1:1 to Tailwind theme config; dark mode via `dark` variant over CSS custom properties |
| Cookies/consent | Consent-first cookie handling (GDPR-style, FR-12) | Per-category disclosure ("cookies related to X and Y"); a11y/theme prefs persisted as cookies only after explicit approval; `prefers-color-scheme`/`prefers-reduced-motion`/`forced-colors` read from the browser |
| Landing page motion | Smooth scroll + scroll-based animations (FR-11) | Honors `prefers-reduced-motion`; degrades to static |
| Auth | Clerk | Locked in PRD |
| Chat LLM | env-configured OpenAI-compatible endpoint (`baseURL`, `apiKey`, `model`) | Provider-agnostic; DeepSeek V4 Flash / GPT-5.4-mini / Groq / Together / OpenRouter swap with no code change |
| Embeddings | env-configured OpenAI-compatible endpoint (`baseURL`, `apiKey`, `model`) | Same env-driven pattern as chat LLM; `text-embedding-3-small`-class default |
| Vector DB | **Qdrant**, behind a `VectorStore` interface (**composite adapter**) | **System of record for Chunks** — vectors + chunk metadata (origin source, span/offset, position) stored together; separate service — cloud free tier or self-hosted; composite adapter allows more vector stores later |
| Relational DB | Neon (one multi-tenant Postgres) | User + resource **working metadata only** (notebooks, source records/status, resource-limit counters, chat); **no chunk-level data** |
| RAG runtime | **LangChain** (`@langchain/core`, `@langchain/openai`, `langchain`) | Standardized prompt templates, retriever abstractions, and streaming runnable sequences. Decoupled behind application chat/retrieval services (replaces `@glitch-guy0/shikigami`) |
| Ingestion & Failure Management | **Inngest** durable step workflows (`/api/inngest`) | Durable multi-step pipeline: extract → parse → chunk → embed → upsert → status. Auto-retries, exponential backoff, failure isolation, and per-user concurrency caps (replaces Upstash QStash) |
| Fetch/extract (Web) | **Firecrawl** (scrape URL → clean markdown) | Replaces native `fetch` + `@mozilla/readability` + linkedom + Turndown; JS-only pages → honest "failed" status still applies where Firecrawl can't extract content |
| File storage | **Cloudinary**, behind a `StorageService` interface (**composite adapter**) | Replaces Filebase; raw HTML, PDF binaries, and assets; composite adapter allows multiple providers/databases later |
| Web search (FR-14) | Pluggable `search` port — **Tavily** | Approval-gated fallback on honest refusal only (`FetchOnRefusalService` / `TavilyAdapter`) |
| Markdown render | react-markdown + remark-gfm | Text sources + chat |
| First-run tour (FR-24) | Driver.js | First-run interactive walkthrough |
| Monitoring / Telemetry | **Neon telemetry tables** (`telemetry_chat_prompts`, `telemetry_file_uploads`) | Ultra-lean operational telemetry: chat prompt submissions + file uploads (type, size, count). Strictly no third-party tracking |
| Performance Testing | **k6** (`tests/perf/load-test.js`) | Automated load and latency benchmark suite simulating 50–100 concurrent chat users and 10–15 concurrent uploaders |

## Code architecture

- **DDD (domain-driven design)** — code organized by domain/bounded context (notebooks, sources, chat, ingestion, limits), entities + value objects + aggregates + repositories per bounded context.
- **Modular monolith** — single deployable; Next.js is the controller/presentation layer only; all domain/application/infra services live in a **separate top-level `backend/` tree**, not nested inside the Next app — so it can be extracted into its own deployable later without a structural refactor.
- **Composite adapters** — storage and vector DB are ports with composite adapter implementations: route/aggregate across multiple backing providers, so adding a provider or second database later never touches domain code.
- **LangChain RAG Orchestration** — LangChain (`@langchain/core`, `@langchain/openai`, `langchain`) serves as the standard RAG and prompt engineering layer, utilizing `RunnableSequence`, chat prompt templates, and streaming callbacks. Unlike the legacy shikigami setup, LangChain is completely decoupled behind standard ports-and-adapters and does not impose proprietary agent/session abstractions.
- **Inngest Workflow Orchestration** — background ingestion tasks execute as multi-step Inngest functions, breaking long-running workloads (PDF parsing, YouTube transcript fetching, Firecrawl web scraping, OpenAI embedding batches) into idempotent sub-steps to circumvent serverless execution limits.
- **Chunk authority & recovery** — Qdrant is the sole record of chunk-level data (metadata + vector together); Neon never stores chunk content. Qdrant loss is **not** rebuilt by re-indexing; the approved recovery is to delete the affected users' resource files from Cloudinary and surface an error to those users.
- **LLM + embeddings both env-driven** — `baseURL`/`apiKey`/`model` from environment, OpenAI-compatible only.

## Explicit non-picks

- No shikigami SDK — deprecated and completely removed in favor of standard LangChain ecosystem tools.
- No LlamaIndex — LangChain selected for standardized prompt templates and streaming runnable pipelines.
- No headless browser — SPA/JS-only pages marked "failed" instead.
- No self-hosted AI — commercial APIs throughout (PRD decision).
- No raw `fetch` in the client — TanStack Query owns data fetching/caching.
- No persistent notebook rail — notebook management happens on the dashboard; a notebook page shows only Sources | Chat | Showcase tabs.

## Cost posture

Free tier throughout: Vercel Hobby · Neon free · Qdrant free tier (1GB cluster) · Cloudinary free tier · Inngest free tier · Clerk dev · Tavily free tier · Firecrawl free tier — paid line is LLM + embeddings usage only.

**Cost controls:** notebooks auto-delete **1 week** after creation (lazy TTL + Inngest cron); per-user **10-notebook cap**; **daily 10-credit governor** on rolling 24h reset; **rate-limit rejection** under load ("experiencing high load at this time — try again later") so spikes drop requests instead of burning credits.
