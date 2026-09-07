---
title: 'Story 2.4: Chunking, Local/Remote Vector Embeddings & Qdrant Upsert'
type: 'feature'
created: '2026-09-07'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-Contextual-2026-09-06/ARCHITECTURE-SPINE.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Extracted markdown must be semantically segmented into ~500 token chunks retaining anchor provenance (`pageNumber`, `timestampSeconds`, `link`, `excerpt`), vectorized through OpenAI-compatible model endpoints (`EMBEDDING_BASE_URL`, `EMBEDDING_MODEL`), and stored in Qdrant collection `contextual_chunks_v1` with `ready` status and updated `chunkCount`.
**Approach:**
- Extend `splitMarkdown` and chunking to parse and attach anchor metadata (`pageNumber`, `timestampSeconds`, `link`, `excerpt`).
- Update `QdrantAdapter` default collection to `contextual_chunks_v1` and attach payload fields (`chunkId`, `sourceId`, `notebookId`, `userId`, `text`, `excerpt`, `metadata`).
- Update Neon source status transition to include `chunkCount`.

## Boundaries & Constraints

**Always:**
- Segments ~500 characters/tokens with overlap.
- Preserve anchor metadata (`pageNumber` from `<!-- page: N -->`, `timestampSeconds` from `<!-- time: mm:ss -->`).
- Upsert into Qdrant collection `contextual_chunks_v1` with full payload schema.
- Update Neon source record to `status: 'ready'` with updated `chunkCount`.

**Never:**
- Never drop anchor metadata during chunk generation.
- Never write to vector store without verifying vector dimensions.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Page-anchored Markdown | Text with `<!-- page: 2 -->` | Chunk contains `metadata.pageNumber = 2` | If absent, pageNumber is undefined |
| Time-anchored Markdown | Text with `<!-- time: 01:23 -->` | Chunk contains `metadata.timestampSeconds = 83` | If absent, timestampSeconds is undefined |
| Qdrant Upsert | 4 generated chunks + embeddings | Upserted to `contextual_chunks_v1` with payload | Fails with clear reason if Qdrant unreachable |
| Neon Transition | Ingestion finishes | Source status becomes 'ready', chunkCount = 4 | Error captured as failed status |

</intent-contract>

## Code Map

- `backend/src/chunking/splitter.ts` -- semantic chunking with anchor metadata extraction.
- `backend/src/shared-kernel/types.ts` -- Chunk schema with metadata, Source schema with `chunkCount`.
- `backend/src/adapters/qdrant/index.ts` -- collection `contextual_chunks_v1` and payload mapping.
- `backend/src/adapters/neon/index.ts` -- persist `chunkCount` on `setSourceStatus`.
- `backend/src/contexts/ingestion/index.ts` -- assemble metadata and pass `chunkCount` to `ready`.
- `backend/src/chunking/__tests__/anchored-splitter.test.ts` -- unit tests for anchored chunking and Qdrant payload.

## Tasks & Acceptance

**Execution:**
- Update `Chunk` and `Source` types in `backend/src/shared-kernel/types.ts`.
- Enhance `backend/src/chunking/splitter.ts` to extract anchors (`pageNumber`, `timestampSeconds`, `excerpt`).
- Update `backend/src/adapters/qdrant/index.ts` collection to `contextual_chunks_v1` and payload schema.
- Update `backend/src/adapters/neon/index.ts` to store `chunk_count`.
- Update `backend/src/contexts/ingestion/index.ts` to pass `chunkCount` to `setSourceStatus`.
- Verify with unit tests in `backend/src/chunking/__tests__/anchored-splitter.test.ts`.
