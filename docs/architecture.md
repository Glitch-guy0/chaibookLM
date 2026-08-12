# chaibookLM — Architecture Reference

Condensed from `_bmad-output/planning-artifacts/architecture/architecture-chaibookLM-2026-08-06/ARCHITECTURE-SPINE.md`. These decisions are load-bearing for any new feature work — read the AD you're touching before changing that area's code.

## Paradigm

Ports-and-adapters (hexagonal) modular monolith over DDD bounded contexts, with one approved tight-coupling carve-out (shikigami).

- Domain lives in a separate top-level `backend/` tree as bounded contexts: `notebooks`, `sources`, `chat`, `ingestion`, `limits`. Domain code depends only on **ports** (interfaces), never infrastructure.
- Adapters (Qdrant, Neon, Filebase, Clerk, LLM/embeddings, jina) are injected at the composition root.
- **Next.js is the composition root and controller layer only** — no business logic. One deployable (Vercel Hobby); `backend/` stays extractable later without a structural refactor.
- **Carve-out:** the shikigami agent SDK is tightly coupled — not behind a port. Ports-and-adapters applies to storage/vector/LLM/embeddings/search, not the answer runtime.

```
backend/src/
  contexts/{notebooks,sources,chat,ingestion,limits}/
  shared-kernel/     # chunk shape, citation marker types
  ports/             # VectorStore, StorageService, Embeddings, search
  adapters/          # qdrant, neon, filebase, clerk, llm, embeddings, jina
  templates/         # VectorStoreMemoryStrategy, GroundedAnswerReasoningStrategy,
                      # NotebookSession, WebSearchTool, SourceIndexer,
                      # EmbeddingService, CitationMapper
```

## Architecture Decisions

| AD | Rule |
|----|------|
| AD-1 | Qdrant is the **sole** system of record for Chunks (vector + metadata together: `sourceId`, `notebookId`, `span`, `position`, `text`). Neon holds only user/resource working metadata — never chunk content. Carve-out: resolved-citation snapshots on persisted chat messages are a rendering artifact, not chunk content. |
| AD-2 | Qdrant loss is **not** repaired by re-ingesting. Approved recovery: delete the affected users' Filebase resources + surface an honest error. Zero backup posture in v0.1. |
| AD-3 | `@glitch-guy0/shikigami` is a direct dependency, not ported. SDK modifications need a change-request + explicit approval; custom strategies/templates built on top are ordinary app code. |
| AD-4 | Only the `ingestion` context creates/removes chunks. Removal = filtered delete on `sourceId`. No other code path writes the chunk collection. |
| AD-5 | `EmbeddingService` is the only embeddings-endpoint caller, shared by `SourceIndexer` and `VectorStoreMemoryStrategy`. Env-driven (`EMBEDDING_BASE_URL/API_KEY/MODEL`), independent of LLM env vars. Model change = deliberate re-index event. |
| AD-6 | One shared chunk type `{chunkId, sourceId, notebookId, span{start,end}, position, text}` used by ingestion/retrieval/CitationMapper. Splitter is deterministic + span-preserving. `chunkId` = hash(`sourceId + position`) → idempotent upsert. 500 chars/25% overlap for plain text; heading-aware for web (markdown via jina Reader). |
| AD-7 | Citation markers are **validated, never trusted**: `GroundedAnswerReasoningStrategy` emits per-sentence markers referencing only retrieved `chunkId`s; `CitationMapper` drops unknown markers. Refusal is structural — no chunk above `minScore` → no `chunkId`s in context → zero citation markers possible. |
| AD-8 | Retrieval: `topK=5`, `minScore=0.30` absolute cosine, scoped by `notebookId` (cross-notebook citations impossible by construction). |
| AD-9 | Chat window: exactly last 7 user+assistant turns fed per turn (a fetch-on-refusal sub-answer counts as its own turn). Chat list loads/paginates by 7. Full history persists in Neon; only the window is re-fed. |
| AD-10 | `limits` context is the single owner of all per-user/per-notebook counters in Neon. Cap check-and-increment is one Postgres transaction per write boundary. Only the write boundary bumps; delete/TTL paths reconcile down exactly once. |
| AD-11 | Notebook TTL is lazy — checked on dashboard load / notebook open, no cron in v0.1. |
| AD-12 | App-layer guard in front of AI/ingestion ops rejects with the honest high-load message under an env-driven request-rate threshold; already-indexed content/browsing stay usable. |
| AD-13 | `WebSearchTool` (jina) runs only after explicit user approval of a fetch-on-refusal offer — the model never invokes search autonomously. |
| AD-14 | Delete cascade is fixed order: Qdrant → Filebase → Neon, each step idempotent, owned by `ingestion`. In-flight QStash ingestion must tombstone-check before writing chunks for a removed source. |
| AD-15 | Qdrant adapter is one implementation driven by env (`QDRANT_URL` + key) — cloud vs self-hosted is a config choice, not a fork. |
| AD-16 | Answers stream via shikigami events; controller forwards deltas to the client; citation markers stream inline. |

## Conventions

- IDs are UUIDs (`chunkId`, `sourceId`, `notebookId`); spans are `{start,end}` char offsets in the source's original text.
- Citation marker syntax `[[C:chunkId]]`, shared by strategy + mapper.
- All LLM/embedding/search config is env-driven (`baseURL`/`apiKey`/`model`); secrets never in client bundles.
- No raw `fetch` in client components — TanStack Query owns fetching/caching.
- jina: `r.jina.ai` (Reader, URL→markdown, web-source fetch) and `s.jina.ai` (Search, top-5, fetch-on-refusal) share one `JINA_API_KEY`.
- QStash callback passes only a `sourceId` reference; the serverless fn re-fetches metadata/raw — never the ≤5MB body.

## Deployment

Vercel Hobby (Next.js, single deployable) → Neon (working metadata) + Qdrant (chunk system of record) + Filebase (raw html/assets) + QStash (ingestion jobs) + env-driven LLM/embeddings + jina search. Dev + prod environments, config entirely via env vars.

## Known deferred-by-design (not gaps, deliberate)

- No Qdrant backups/monitoring (AD-2 zero-backup posture).
- No daily TTL sweep (AD-11), only lazy checks.
- Embeddings limited to OpenAI-compatible providers (AD-5).
- No standalone search surface — chat is the only query interface (PRD v0.1).

For actual known rough edges and bugs to pick up next, see [deferred-work.md](deferred-work.md). Full source docs (PRD, UX design/experience, epics, tech stack, review logs) remain archived under `_bmad-output/planning-artifacts/`.
