# Contextual — Tech Stack (v0.1)

Decided 2026-08-05, updated 2026-08-06, updated 2026-08-12 (Jina → Tavily/Firecrawl, Filebase → Cloudinary). Source of truth for external dependencies. Mirrors `prds/prd-chaibookLM-2026-08-04/addendum.md` dependency map + PRD decisions. For provisioning/account status of every external service named below, see `external-tools-tracker.md`.

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
| RAG runtime | shikigami agent SDK (`@glitch-guy0/shikigami`) | Retrieval = custom `MemoryStrategy` backed by the `VectorStore` port; answer path via `Agent`. **Tightly coupled by approved decision — NOT behind a port** |
| Ingestion | App code in Upstash QStash job | Fetch → readability + linkedom → Turndown → split → embed → store. Job writes, agent reads |
| Fetch/extract | **Firecrawl** (scrape URL → clean markdown) | Replaces native `fetch` + `@mozilla/readability` + linkedom + Turndown; JS-only pages → honest "failed" status still applies where Firecrawl can't extract content |
| File storage | **Cloudinary**, behind a `StorageService` interface (**composite adapter**) | Replaces Filebase; raw HTML + assets; composite adapter allows multiple providers/databases later |
| Web search (FR-7) | Pluggable `search` port — Kairo `WebSearchTool({ search: impl })` | v0.1 impl: **Tavily** (replaces Jina; duckduckgo dropped earlier) |
| Markdown render | react-markdown + remark-gfm | Text sources + chat |
| First-run tour (FR-10) | Driver.js | |

## Code architecture

- **DDD (domain-driven design)** — code organized by domain/bounded context (notebooks, sources, chat, ingestion, limits), entities + value objects + aggregates + repositories per bounded context.
- **Modular monolith** — single deployable; Next.js is the controller/presentation layer only; all domain/application/infra services live in a **separate top-level `backend/` tree**, not nested inside the Next app — so it can be extracted into its own deployable later without a structural refactor.
- **Composite adapters** — storage and vector DB are ports with composite adapter implementations: route/aggregate across multiple backing providers, so adding a provider or second database later never touches domain code.
- **Shikigami coupling** — the shikigami agent SDK (`@glitch-guy0/shikigami`) is **tightly coupled** into the application (approved decision), *not* behind a port. The ports-and-adapters rule applies to storage, vector DB, LLM, embeddings, and web search — not to the answer runtime. Any modification to the SDK itself requires a detailed change-request document and explicit approval.
- **Chunk authority & recovery** — Qdrant is the sole record of chunk-level data (metadata + vector together); Neon never stores chunk content. Qdrant loss is **not** rebuilt by re-indexing; the approved recovery is to delete the affected users' resource files from Cloudinary and surface an error to those users.
- **LLM + embeddings both env-driven** — `baseURL`/`apiKey`/`model` from environment, OpenAI-compatible only.

## Explicit non-picks

- No LangChain / LlamaIndex — custom thin pipeline via shikigami ports
- No headless browser — SPA/JS-only pages marked "failed" instead
- No self-hosted AI — commercial APIs throughout (PRD decision)
- No raw `fetch` in the client — TanStack Query owns data fetching/caching
- No persistent notebook rail — notebook management happens on the dashboard; a notebook page shows only Sources | Chat | Showcase tabs

## Cost posture

Free tier throughout: Vercel Hobby · Neon free · Qdrant free tier (1GB cluster) · Cloudinary free tier · QStash 1k msgs/day · Clerk dev · Tavily free tier · Firecrawl free tier — paid line is LLM + embeddings usage only.

**Cost controls (decided 2026-08-06):** notebooks auto-delete **1 week** after creation (TTL); per-user **10-notebook cap**; **rate-limit rejection** under load ("experiencing high load at this time — try again later") so spikes drop requests instead of burning credits. Credit gate / cost cap = FR-5 design (v1).

Caveat: Vercel Hobby caps serverless function duration (default 10s, max ~60s) — the QStash ingestion callback must finish inside that cap; monitor once real sources index.
