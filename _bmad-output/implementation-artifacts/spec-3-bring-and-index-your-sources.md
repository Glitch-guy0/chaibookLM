---
title: 'Epic 3 — Bring & Index Your Sources'
type: 'feature'
created: '2026-08-09'
status: 'in-review'
baseline_revision: aa2c42b61aac435b56d760d63b6b81aa25061dc6
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** A signed-in user inside a notebook workspace currently sees a static Sources tab with no way to add, index, inspect, or remove sources. The `Source` schema, chunk kernel, ports (`VectorStore`, `Embeddings`, `StorageService`, `Search`) and template stubs (`SourceIndexer`, `EmbeddingService`) exist but are unimplemented, so a notebook cannot become queryable for Epic 4.

**Approach:** Build the ingestion pipeline (deterministic span-preserving splitter → embed → store with origin metadata, single writer), a `sources` context exposing CRUD + limits + delete cascade, real API routes wired through the composition root, and a Sources UI (upload dialog with paste-text/URL paths, source cards with live status, bulk remove, clear-failed) rendered in the workspace's Sources tab. All client data flows through TanStack Query; no raw `fetch` in client components.

## Boundaries & Constraints

**Always:**
- Client components never call `fetch` directly; all data access is via TanStack Query mutations/queries to the new API routes.
- Every source route verifies Clerk auth and scopes by `userId`/`notebookId` ownership; never expose another user's sources.
- All backend logic goes through owning contexts (`SourceService`, `IngestionService`); adapters are constructed only at the composition root, never in domain/API code.
- Only the ingestion context writes to the chunk collection (single writer, AD-4). Chunks use the single shared kernel `{chunkId, sourceId, notebookId, span{start,end}, position, text}` with `chunkId` = deterministic hash of `sourceId + position` (AD-6).
- Splitter is deterministic and span-preserving: 500 chars/chunk with 25% overlap for plain text; heading-aware for web markdown so no chunk crosses a section boundary (AD-6).
- Qdrant is the system of record for chunks (vector + metadata together); Neon stores only source working metadata/status. `EmbeddingService` is the only caller of the embeddings endpoint (AD-5).
- Delete cascade order is Qdrant → Filebase → Neon, each step idempotent; in-flight ingestion checks a tombstone/generation before writing chunks (AD-14).
- Limits route through `LimitsService`; the write boundary bumps counters exactly once atomically; deletion reconciles exactly once (AD-10).
- Every interactive element has a unique `data-debug` name; dialogs trap focus and restore it on close; status dots/labels use color + text (never color-only); cards and workspace responsive to 320px.

**Block If:**
- If Qdrant/embedding env (QDRANT_URL/KEY, EMBEDDING_*) is required to typecheck/build and is unavailable. Implementation must still typecheck and build.
- If external adapters (Filebase storage, Jina reader, QStash) cannot degrade gracefully to a `failed` status with a clear reason when unconfigured — ingestion must never crash the request; it surfaces honest failures per FR-3.

**Never:**
- No chunks written to Neon (AD-1); no re-implementing the ingestion context elsewhere; no constructing adapters inside route files.
- No headless browser (v0.1); a JS-only-render page that yields no extractable content fails with a clear reason.
- No modifying the original pasted text or fetched content; images are stripped only at index time via a removable interceptor (source content never altered).
- No blocking the API on external ingestion latency beyond the request that returns the created source; ingestion is enqueued and status updates independently.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_TEXT | Non-empty text under limits | 201 + queued Text Source; enqueues ingestion; counters bump once | none |
| EMPTY_TEXT | Empty / whitespace-only text | reject inline, no source created | 400 INVALID_BODY |
| HAPPY_URL | Well-formed public URL under limits | 201 + queued Web Source; enqueues ingestion | none |
| BAD_URL | Malformed URL string | reject inline before submit | 400 INVALID_URL |
| LIMIT_HIT | Over 10/notebook, 30/user, or 5MB | 409 with message listing limit + current count | client pop-up warning (cap + count) |
| FETCH_FAIL | 404 / paywall / non-HTML URL | source status `failed` with clear reason; other sources unaffected | honest failure status |
| NO_CONTENT | Page fetched but no main content (JS-only) | source status `failed` with clear reason | honest failure status |
| REMOVE_SINGLE | Owned source | 200 `{deleted:true}`; chunks removed Qdrant→Filebase→Neon; counter reconciles once | 404 if not owned/missing |
| REMOVE_BULK | Multiple owned ids | 200 `{deleted:n}`; counters reconcile to actual | per-id ownership honored |
| CLEAR_FAILED | Notebook has failed sources | deletes all failed; 200 `{deleted:n}` | none |
| STALE_INGEST | Source removed while QStash job fires | tombstone/generation check aborts chunk write | no resurrected chunks |

</intent-contract>

## Code Map

- `backend/src/shared-kernel/types.ts` -- `Source` exists; add `failReason?` to `Source`.
- `backend/src/chunking/splitter.ts` -- NEW deterministic splitter (text + heading-aware web variants) + `chunkId` hash.
- `backend/src/contexts/sources/index.ts` -- NEW `SourceService`: CRUD, limits, delete cascade orchestration.
- `backend/src/contexts/ingestion/index.ts` -- NEW `IngestionService`: single-writer chunk pipeline (split→embed→store, tombstone check, status transitions).
- `backend/src/templates/SourceIndexer.ts` -- implement real orchestrator delegating to `IngestionService`.
- `backend/src/templates/EmbeddingService.ts` -- implement embed + upsert via `Embeddings` + `VectorStore`.
- `backend/src/adapters/qdrant/index.ts` -- implement `upsert`/`deleteBySourceId`; `search` stays stub for Epic 4.
- `backend/src/adapters/embeddings/index.ts` -- implement OpenAI-compatible `embed`/`embedBatch`.
- `backend/src/adapters/filebase/index.ts` -- implement `get`/`put`/`delete` for raw source content (graceful when unconfigured).
- `backend/src/adapters/jina/index.ts` -- implement reader (`r.jina.ai`) fetch → markdown for web sources (graceful failure).
- `backend/src/adapters/neon/index.ts` -- add `setSourceStatus`, `deleteSource`, `findSourcesByNotebookId` (exists), `countSourcesByNotebook` (exists), source `fail_reason` column in migration.
- `app/api/lib/backend.ts` -- extend composition root: Embeddings, VectorStore, Storage, Jina, SourceIndexer, IngestionService, SourceService.
- `app/api/helpers.ts` -- add `serializeSource`.
- `app/api/notebooks/[id]/sources/route.ts` -- NEW GET (list, scoped) / POST (create + enqueue; inline-reject empty/malformed; 409 on limits).
- `app/api/sources/[id]/route.ts` -- NEW DELETE single (cascade).
- `app/api/sources/bulk/route.ts` -- NEW DELETE bulk.
- `app/api/sources/clear-failed/route.ts` -- NEW DELETE all failed in a notebook.
- `components/notebooks/api.ts` -- add source client functions + `SourceRecord` types.
- `components/sources/upload-dialog.tsx` -- NEW dialog with paste-text + URL paths.
- `components/sources/source-card.tsx` -- NEW card (icon, title, type+size, added time, status dot+label, indexing loader, remove).
- `components/sources/sources-panel.tsx` -- NEW panel: add trigger, list, bulk-select, clear-failed, empty state.
- `components/notebooks/workspace.tsx` -- render `SourcesPanel` in the Sources tab.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/chunking/splitter.ts` -- deterministic text splitter (500 chars, 25% overlap) + heading-aware web splitter + `chunkId` hash; pure functions -- AD-6 core.
- [x] `backend/src/adapters/embeddings/index.ts` -- OpenAI-compatible embed/embedBatch from `EMBEDDING_*` env -- AD-5.
- [x] `backend/src/adapters/qdrant/index.ts` -- upsert chunks (vector+metadata) + deleteBySourceId filter -- AD-1/AD-4.
- [x] `backend/src/adapters/filebase/index.ts` -- S3-compatible put/get/delete for raw content; honest failure when unconfigured -- AD-14.
- [x] `backend/src/adapters/jina/index.ts` -- reader fetch (`r.jina.ai` → markdown) + image-strip interceptor -- FR-3.
- [x] `backend/src/templates/EmbeddingService.ts` -- embed chunks and upsert to VectorStore -- AD-5.
- [x] `backend/src/templates/SourceIndexer.ts` + `backend/src/contexts/ingestion/index.ts` -- orchestrate split→embed→store, tombstone check, `queued→processing→ready/failed` transitions -- story 3.1.
- [x] `backend/src/contexts/sources/index.ts` -- create (limits via `LimitsService.checkSourceCap` + size), list scoped, find, remove single/bulk/clear-failed with Qdrant→Filebase→Neon cascade + counter reconcile -- stories 3.2/3.3/3.4.
- [x] `backend/src/adapters/neon/index.ts` -- `setSourceStatus(id,status,reason?)`, `deleteSource(id)`, add `fail_reason` to migration -- persistence.
- [x] `backend/src/shared-kernel/types.ts` -- add `failReason?` to `Source` -- honest failure surfacing.
- [x] `app/api/lib/backend.ts` -- wire all new adapters/services into the singleton composition root -- DI.
- [x] `app/api/helpers.ts` -- add `serializeSource` (dates→ISO, include failReason) -- wire format.
- [x] `app/api/notebooks/[id]/sources/route.ts` -- GET list scoped by notebook ownership; POST create + validate + limits + enqueue -- stories 3.2/3.3.
- [x] `app/api/sources/[id]/route.ts`, `app/api/sources/bulk/route.ts`, `app/api/sources/clear-failed/route.ts` -- DELETE routes with ownership + cascade -- story 3.4.
- [x] `components/notebooks/api.ts` -- source client functions + types (list, create text/url, delete, bulk, clear-failed) -- TanStack Query wiring.
- [x] `components/sources/upload-dialog.tsx` -- focus-trapped dialog, paste-text + URL paths, inline empty/malformed rejection, limit warning pop-up -- stories 3.2/3.3.
- [x] `components/sources/source-card.tsx` -- status dot+label, indexing rotating-shadow loader, ready glow, remove action, metadata -- UX-DR8/UX-DR11.
- [x] `components/sources/sources-panel.tsx` -- list, add trigger, bulk-select remove, clear-failed, empty state "This notebook has no sources yet." -- story 3.4 + UX-DR20.
- [x] `components/notebooks/workspace.tsx` -- render `SourcesPanel` inside the Sources tab -- integration.

**Acceptance Criteria:**
- Given a notebook with sources, when the Sources tab renders, then each source shows icon, title, type+size, added time, and status dot + label (color never the only channel).
- Given the upload dialog, when the user pastes text and submits, then it creates a queued Text Source, enqueues ingestion, and rejects empty/whitespace-only text inline.
- Given the upload dialog URL path, when a user submits a URL, then a malformed URL is rejected inline before submit; a valid URL enqueues a Web Source.
- Given a limit violation (10/notebook, 30/user, 5MB), when a source is submitted, then it is rejected with a pop-up warning listing the limit and current count.
- Given an unfetchable or content-less URL, when indexed, then the source surfaces a `failed` status with a clear reason without affecting other sources.
- Given a ready source, when removed (single/bulk/clear-failed), then its chunks are removed from retrieval via the Qdrant→Filebase→Neon cascade and counters reconcile exactly once.
- Given a source being indexed, when its card renders, then the status dot + label and rotating shadow-loader are shown and the source is not queryable until `ready`.

## Spec Change Log

(Empty until first review loopback.)

## Review Triage Log

(Empty until first review pass.)

## Design Notes

Chunk splitter is pure and deterministic (no I/O). Text: scan the string forward, emit 500-char slices with 25% (125-char) overlap, recording `span{start,end}` and `position`; a final partial chunk is emitted if trailing text remains. Web: split the markdown on `#`/`##` heading boundaries first, then apply the fixed-size rule within each heading section so no chunk crosses a section. `chunkId = sha256(sourceId + ':' + position).slice(0,32)` — idempotent on retry.

Ingestion is enqueued: the POST route creates the source row (status `queued`, counters bumped) then returns immediately; ingestion runs via the source indexer (QStash when configured, else inline) which re-fetches the source, sets `processing`, extracts content (text direct; web via jina reader + interceptor), splits, embeds, upserts to Qdrant, and sets `ready`. Any failure sets `failed` with `failReason`. A generation/tombstone check (source still exists in Neon with a matching non-terminal state) gates the chunk write so a deleted source's chunks never resurrect.

Delete cascade: `deleteBySourceId(sourceId)` on Qdrant → `storage.delete(rawKey)` → `deleteSource(id)` in Neon → counter reconcile. Each step idempotent and wrapped so a missing chunk/storage record doesn't fail the cascade.

## Verification

**Commands:**
- `npm run typecheck` -- expected: no type errors.
- `npm run build` -- expected: production build succeeds with all routes.

**Manual checks (if no CLI):**
- Review that no client component calls `fetch`; all data goes through TanStack Query hooks.
- Confirm every interactive element carries a unique `data-debug` name; upload dialog traps focus; status uses color + text.
- Confirm ingestion degrades gracefully: with no FILEBASE/JINA/QStash configured, a web source fails with a clear reason rather than crashing.
