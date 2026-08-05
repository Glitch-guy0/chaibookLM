# Extract — tech-stack.md (UX-relevant only)

## Client-side deps constraining the experience
- TanStack Query owns all client data fetching ("no raw fetch in components") → loading/error/stale-while-revalidate states come from its conventions.
- react-markdown + remark-gfm render both text sources and chat output.
- Driver.js powers the first-run tour (FR-10).
- Clerk auth gates entry.

## Async ingestion behavior constraints
- Ingestion fully async via QStash job (Fetch → readability+linkedom → Turndown → split → embed → store). Job writes, agent reads.
  - UX: source is NOT queryable the moment it's uploaded — window between "accepted" and "indexed" → requires pending/progress → ready/failed states on source cards.
- Images stripped at index time (removable interceptor) → indexed sources render WITHOUT images.
- JS-only/SPA pages → honest "failed" status (no headless browser). Failure is a first-class expected outcome for some URLs.
- Vercel Hobby caps serverless function duration (~10s default, max ~60s) → ingestion callback must finish inside cap; monitor once real sources index.

## Limits/caps with UX implications
- QStash free tier = 1k msgs/day → daily ceiling on ingestion volume; upload bursts can be throttled/failed at queue layer.
- Neon holds resource-limit counters (5MB/source, 10/notebook, 30/user live in PRD §6.1).
- Qdrant free tier = 1GB cluster → vector corpus cap; "storage full" UX at scale.
- Cost posture: free tier throughout; paid line = LLM + embeddings only; credit gate is a v1 concern.

## Error/empty/loading states to design
- Source upload → pending → ready OR failed (JS-only/SPA = expected "failed").
- Two distinct ceilings: QStash daily message cap and Qdrant 1GB storage cap → surfaced states.
- LLM/embeddings provider-agnostic/env-driven → latency/quality varies by provider; no retry/timeout specified.
- Everything else (empty notebooks, query no-hits, auth states) → refer to PRD.

## NOT UX-relevant (excluded)
- DDD/modular-monolith/composite-adapter/port structure, Qdrant+Neon split, shikigami internals, Filebase/S3 behind StorageService, env-driven config mechanics.
