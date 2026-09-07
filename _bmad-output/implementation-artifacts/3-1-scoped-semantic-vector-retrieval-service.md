---
title: 'Story 3.1: Scoped Semantic Vector Retrieval Service'
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

**Problem:** Semantic vector search must be strictly isolated to the active notebook and user, preventing any cross-notebook or cross-user data leakage, and flagging queries with insufficient context (< 0.30 cosine similarity) to prevent grounded hallucination.
**Approach:**
- Extend `VectorStore.search` and `QdrantAdapter` to enforce compound filtering: `notebookId == currentNotebookId AND userId == currentUserId`.
- In `VectorStoreMemoryStrategy`, generate query embeddings, request top-5 chunks, and evaluate max similarity score against the `0.30` threshold.
- If no chunks are returned or max similarity < 0.30, flag retrieval as insufficient context (return empty array).

## Boundaries & Constraints

**Always:**
- Strictly enforce `notebookId` and `userId` filters in Qdrant searches.
- Search Qdrant collection `contextual_chunks_v1`.
- Top-5 chunks retrieved with cosine similarity scores.
- Return empty array (insufficient context) if max similarity score < 0.30.

**Never:**
- Never leak chunks across notebook or user boundaries.
- Never feed chunks below the 0.30 threshold into grounded generation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Sufficient Context | Query matching indexed chunks with score ≥ 0.30 | Top-5 chunks returned with cosine similarity scores | None |
| Low Relevance | Chunks found but max score < 0.30 | Returns `[]` (flags insufficient context) | Trigger refusal pathway |
| Zero Chunks | No chunks found for notebookId + userId | Returns `[]` | Trigger refusal pathway |
| Multi-tenant Search | Query in notebook A | Chunks from notebook B or other users strictly omitted | Enforced at Qdrant query filter |

</intent-contract>

## Code Map

- `backend/src/ports/VectorStore.ts` -- Enhanced `VectorStore.search` interface with `userId`.
- `backend/src/adapters/qdrant/index.ts` -- Qdrant search filter enforcing `notebookId` and `userId`.
- `backend/src/templates/VectorStoreMemoryStrategy.ts` -- Notebook and user scoped retrieval with `0.30` score gating.
- `backend/src/templates/__tests__/scoped-retrieval.test.ts` -- Unit test suite for scoped vector retrieval.

## Tasks & Acceptance

**Execution:**
- [x] Update `VectorStore.search` contract with `userId?: string`.
- [x] Update `QdrantAdapter.search` filter to combine `notebookId` and `userId`.
- [x] Update `VectorStoreMemoryStrategy` to verify `minScore: 0.30` gating.
- [x] Verify with unit tests in `backend/src/templates/__tests__/scoped-retrieval.test.ts`.

## Auto Run Result

- Status: done
- Strict notebook and user isolation implemented in QdrantAdapter and VectorStoreMemoryStrategy.
- 0.30 threshold gating verified.
- Verified via `backend/src/templates/__tests__/scoped-retrieval.test.ts`.
