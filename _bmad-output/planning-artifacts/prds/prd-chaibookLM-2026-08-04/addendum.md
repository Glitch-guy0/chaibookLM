# Addendum — chaibookLM v0.1 PRD

Companion to `prd.md`. Depth that belongs downstream (UX spec, architecture, design system), captured for reference and review.

## Design identity (from brief addendum, 2026-08-04)

**Neo-brutalism + minimalistic maximalism** — funky, modern, deliberately unique; not premium/quiet. Brand-level contrast to NotebookLM's clean Google minimalism; the lead differentiator on first impression.

Practical anchors for execution [ASSUMPTION]: thick hard borders, bold offset shadows, saturated/confident color palette, chunky playful typography, visible structure over airy whitespace — applied with discipline ("minimalistic maximalism": lots of personality, zero noise). Web-first with mobile optimization, so the aesthetic must survive small screens.

Needs a design pass before/parallel to build (per PRD §6.1 assumption); exact palette, type scale, shadow/border tokens are for the UX spec (`bmad-ux` / `bmad-agent-ux-designer`).

## Design anchors (decided 2026-08-05)

- Layout: Sources panel on the left; the Original View (resource showcase) on the right.
- Uploading a Source opens a pop-up/dialog; indexing state is shown as color on the Source's button/card (queued → processing → ready/failed).
- Limit violations surface as a pop-up warning (per PRD §6.1).
- First-run product walkthrough via a tour library (FR-10).

## Architecture anchors (decided 2026-08-05)

- **Models are OpenAI-compatible only** — LLM and embeddings both config-driven via env (`baseURL`, `apiKey`, `model`); any OpenAI-compatible host swaps in without code change.
- **Answer runtime is the shikigami agent SDK** (`@glitch-guy0/shikigami`) — retrieval is a custom `MemoryStrategy` wired into `MemoryManager`; ingestion is app code (queue job) writing to the same store.
- **Web search is a pluggable port** — Kairo `WebSearchTool` takes an injected `search` implementation; v0.1 ships jina / duckduckgo impls.
- **Code is DDD + modular monolith** — bounded-context modules in `backend/` (domain + application + infrastructure); Next.js holds the controller/presentation layer only.
- **Storage is a port with a composite adapter** — `StorageService` interface backed by Filebase (S3-compatible) via composite adapter, so more providers/databases can be added without touching domain code.
- **Vector DB is a port with a composite adapter** — `VectorStore` interface backed by Qdrant via composite adapter; more vector stores can be added later.
- **Client data fetching via TanStack Query** (default recommendations) — no raw `fetch` in components.
- **Image handling:** an interception layer strips images from Sources at indexing time only — the original Source content is never altered. Implemented as a removable interceptor so image recognition can be added later.
- **Seed data** for fresh/test environments (per PRD §6.1).
- **Resource limits:** 5 MB per Source, 30 Sources per user, 10 Sources per notebook; per-user count and limits stored server-side, configurable for future tiers.

## Dependency map (decided 2026-08-05)

| Concern | Pick | Note |
|---|---|---|
| Chat LLM | env-configured OpenAI-compatible endpoint (baseURL/apiKey/model) | Provider-agnostic; default host TBD per environment |
| Embeddings | env-configured OpenAI-compatible endpoint (baseURL/apiKey/model) | `text-embedding-3-small`-class default |
| Vector DB | Qdrant behind `VectorStore` composite adapter | Cloud free tier or self-hosted; more stores later |
| Relational DB | Neon, one multi-tenant Postgres | Metadata + limits; vectors live in Qdrant |
| RAG runtime | shikigami agent SDK | Custom `MemoryStrategy` → `VectorStore` port |
| Ingestion | App code in Upstash QStash job | Fetch → readability+linkedom → Turndown → split → embed → store; job writes, agent reads |
| File storage | Filebase (S3-compatible) behind `StorageService` composite adapter | Raw HTML + assets; more providers later |
| Web search (FR-7) | Pluggable `search` port; v0.1 = jina / duckduckgo | Kairo `WebSearchTool` |
| Client data | TanStack Query (default recommendations) | No raw fetch in components |
| Deploy | Vercel + Next.js, free (Hobby) | Modular monolith; controllers in Next, services in `backend/` |
| Markdown render | react-markdown + remark-gfm | Text sources + chat |
| First-run tour | Driver.js | FR-10 |

Cost posture: no framework (LangChain/LlamaIndex) — custom thin pipeline via shikigami ports; no vector-DB lock-in (composite adapter). Free tier throughout; paid line = LLM + embeddings usage only. Caveat: Hobby function-duration cap (~10-60s) bounds the QStash ingestion callback.

