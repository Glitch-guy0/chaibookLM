---
title: 'Story 3.2: LangChain Decoupled RAG Pipeline with Local/Cloud Configuration'
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

**Problem:** Grounded answer generation requires strict factual grounding linking assertions directly to chunk IDs, using XML contextual tagging, 7-turn sliding context windows, and environment-configurable local (Ollama/vLLM) or cloud LLM endpoints.
**Approach:**
- Wrap chunks into XML tags `<chunk id="chk_123" source="..." page="...">text</chunk>` in `GroundedAnswerReasoningStrategy`.
- Enforce strict grounding system prompt: assertions must cite using `[[C:chunkId]]` and unsupported claims are forbidden.
- Update `CitationMapper` to parse both `[[C:chunkId]]` and `[[chunkId]]`.
- Implement `DecoupledRagPipeline` with LangChain `RunnableSequence` supporting `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_API_KEY`.

## Boundaries & Constraints

**Always:**
- Format context chunks using XML `<chunk id="..." source="..." page="...">text</chunk>`.
- System prompt specifies `[[C:chunkId]]` inline citation syntax and forbids unsupported claims.
- Sliding context window of last 7 conversation turns.
- Initialize LLM client from environment variables `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_API_KEY`.

**Never:**
- Never cite invented or unretrieved chunk IDs.
- Never leak internal failure markers from prior turns into history.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Grounded Chunk Context | 2 retrieved chunks | Wrapped into `<chunk id="..." source="..." page="...">` | Empty page attribute if pageNumber absent |
| Inline Citations | Answer contains `[[C:chk_101]]` | Mapped to CitationSnapshot with source metadata | Unretrieved chunk IDs stripped |
| Sliding History Window | 10 prior messages | Only most recent 7 turns included | Older turns truncated |
| Local/Cloud LLM | Ollama or OpenAI URL configured | Connects to endpoint via env vars | Throws clear error if URL missing |

</intent-contract>

## Code Map

- `backend/src/templates/GroundedAnswerReasoningStrategy.ts` -- XML context builder, strict grounding prompt, and 7-turn sliding history.
- `backend/src/templates/CitationMapper.ts` -- Parser supporting `[[C:chunkId]]` and `[[chunkId]]`.
- `backend/src/templates/rag-pipeline.ts` -- Decoupled LangChain `RunnableSequence` pipeline with local/cloud LLM config.
- `backend/src/templates/__tests__/rag-pipeline.test.ts` -- Vitest unit tests for pipeline formatting and citations.

## Tasks & Acceptance

**Execution:**
- [x] Update `GroundedAnswerReasoningStrategy` context to XML `<chunk>` tags.
- [x] Add strict grounding and `[[C:chunkId]]` rules to system prompt.
- [x] Update `CitationMapper` regex to match `[[C:chunkId]]` and `[[chunkId]]`.
- [x] Build `DecoupledRagPipeline` using LangChain `RunnableSequence`.
- [x] Verify with unit tests in `backend/src/templates/__tests__/rag-pipeline.test.ts`.

## Auto Run Result

- Status: done
- Decoupled RAG pipeline with LangChain sequence implemented and verified.
- XML chunk wrapping and `[[C:chunkId]]` citation mapping tested.
- Verified via `backend/src/templates/__tests__/rag-pipeline.test.ts`.
