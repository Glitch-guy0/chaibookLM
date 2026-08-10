---
title: 'Story 4.1 — Ask Questions and Get Grounded, Streaming Answers'
type: 'feature'
created: '2026-08-10'
status: 'done'
baseline_revision: 217897d452e16831a5cd2e543eb8a1333efb45d1
final_revision: 8f72cdf177076efd6e5c046d123931529df2965d
review_loop_iteration: 1
followup_review_recommended: true
context: []
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** A signed-in user's notebook Chat tab is currently a static placeholder ("Chat will be available here."). None of the chat pipeline exists: `backend/src/contexts/chat/` is empty, `QdrantAdapter.search()` and `LlmAdapter` are unimplemented stubs, and the shikigami memory/reasoning/session templates throw `Not implemented`. There is no way to ask a question grounded in a notebook's own sources.

**Approach:** Implement notebook-scoped vector search, an env-driven LLM adapter, the shikigami memory/reasoning/session templates, and a new `ChatService` that runs a shikigami agent per turn with streaming enabled, persisting turns to the existing `chat_messages` table. Wire a streaming API route and a real Chat panel UI (composer + streaming markdown message list) replacing the placeholder. Citation chip rendering, Original View, refusal/fetch-on-refusal UX, and paginated history loading are explicitly out of scope (Stories 4.2–4.5) — this story only needs the retrieval gate to work and citation markers to survive in the raw answer text untouched.

## Boundaries & Constraints

**Always:**
- Retrieval is scoped by `notebookId`; `VectorStore.search` filters strictly on the current notebook's chunks (AD-8, FR-6). `topK = 5`, `minScore = 0.30`.
- Exactly the last 7 user+assistant turns (from `chat_messages`, ordered by `created_at`) are fed into the shikigami session as context per turn (AD-9). Full history is not re-fed.
- Every turn (user message and assistant answer) is persisted to `chat_messages` via the existing `NeonRepository.createChatMessage`, scoped to `userId`/`notebookId`.
- The chat API route follows the existing auth/ownership convention: Clerk `auth()` → 401 if unauthenticated; notebook lookup → 404 if missing or not owned by `userId`.
- Answers stream token-by-token to the client (shikigami `STREAM` events, AD-16); the client renders the streamed text as markdown inside a stable `aria-live="polite"` region while streaming, and announces only the final settled message.
- Composer: Enter sends, Shift+Enter inserts a newline, auto-grows, and is disabled while an answer is generating (UX-DR12).
- All client data access goes through TanStack Query (`components/notebooks/api.ts` pattern) — no raw `fetch` in components; the streaming fetch call itself lives in a query/mutation function, not inline in a component.
- `LlmAdapter` reads `LLM_BASE_URL`/`LLM_API_KEY`/`LLM_MODEL` env vars, mirroring the existing `EmbeddingsAdapter` pattern; secrets never reach the client bundle.
- A network/LLM failure during streaming shows an inline retry on the failed message — never a silent failure (UX-DR12).
- New adapters/services are constructed only in `app/api/lib/backend.ts` (composition root), never inside route files.

**Block If:**
- If shikigami's actual installed API (`MemoryManagerImpl`, `ReasoningManager`, `Session`, streaming event contract) diverges materially from `_bmad-output/planning-artifacts/shikigami-sdk.md` in a way that blocks wiring memory/reasoning/session/streaming as described. Verify the real `.d.mts` type signatures under `node_modules/@glitch-guy0/shikigami` before writing template code.

**Never:**
- No implementing citation chip rendering, per-sentence chip mapping, or telemetry (Story 4.2) — only ensure raw inline citation markers pass through the streamed text untouched for a later story to consume.
- No Original View / Showcase wiring (Story 4.3).
- No refusal UI or fetch-on-refusal web search flow (Story 4.4) — if `minScore` isn't cleared, the model must still be prevented from answering from general knowledge (structural grounding), but a polished refusal UI/button is out of scope; a minimal "Not in your sources." text response is sufficient for this story.
- No paginated/infinite-scroll history loading UI (Story 4.5) — load the most recent 7 turns once on mount, no scroll-triggered pagination.
- No falling back to general knowledge when retrieval is empty or below `minScore`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_ASK | Notebook has ready sources; user asks a question answerable from them | Answer streams as markdown, grounded only in this notebook's chunks; persisted as `assistant` message | none |
| CROSS_NOTEBOOK_ISOLATION | Another notebook has relevant chunks, current notebook does not | Retrieval never returns the other notebook's chunks; answer treats question as ungrounded | none |
| NO_MATCH | No retrieved chunk clears `minScore = 0.30` | Model does not answer from general knowledge; response is an explicit "Not in your sources." with no citations | none |
| EMPTY_NOTEBOOK | Notebook has zero ready sources | Same as NO_MATCH — grounded refusal, no crash | none |
| SLIDING_WINDOW | Notebook has >7 prior turns | Only the last 7 user+assistant turns are fed to the model as context | none |
| STREAM_FAIL | LLM call errors mid-stream | Failed message shows inline retry; no partial message silently left unlabeled | inline retry, no silent failure |
| UNOWNED_NOTEBOOK | User requests chat for a notebook they don't own | 404 | 404 NOT_FOUND |
| UNAUTHENTICATED | No Clerk session | 401 | 401 UNAUTHORIZED |

</intent-contract>

## Code Map

- `backend/src/ports/VectorStore.ts` -- `search` signature exists; implement it in the adapter.
- `backend/src/adapters/qdrant/index.ts` -- implement `search(params)`: Qdrant filtered query by `notebookId` payload field, topK, minScore, reconstruct `ScoredChunk[]`.
- `backend/src/adapters/llm/index.ts` -- implement `LlmAdapter` (env-driven OpenAI-compatible client) with `complete`/`streamComplete`, mirroring `backend/src/adapters/embeddings/index.ts`'s env pattern.
- `backend/src/templates/VectorStoreMemoryStrategy.ts` -- implement shikigami `MemoryStrategy`: `retrieve` calls `VectorStore.search` scoped to notebookId; `store` is a no-op (chunks are written only by ingestion).
- `backend/src/templates/GroundedAnswerReasoningStrategy.ts` -- implement shikigami `ReasoningStrategy`: builds a grounded system prompt instructing the model to answer only from retrieved context, emit inline citation markers referencing chunkIds, and refuse ("Not in your sources.") when context is empty/below threshold.
- `backend/src/templates/NotebookSession.ts` -- implement shikigami `Session`: scoped per notebookId, backed by the last-7-turns window loaded from `chat_messages`.
- `backend/src/contexts/chat/index.ts` -- NEW `ChatService`: orchestrates ownership-scoped turn processing — load window, construct/configure shikigami agent (memory + reasoning + session, streaming on), persist user message, stream tokens, persist assistant message on completion, surface errors.
- `backend/src/adapters/neon/index.ts` -- confirm/reuse existing `createChatMessage`/`findChatMessagesByNotebookId` (no new migration needed; table already exists).
- `app/api/lib/backend.ts` -- extend composition root: construct `LlmAdapter`, chat templates, `ChatService`; wire into `getBackend()`.
- `app/api/notebooks/[id]/chat/route.ts` -- NEW POST route: auth + ownership check, accepts `{message: string}`, returns a streamed response (SSE or chunked text) of the assistant's answer.
- `components/notebooks/api.ts` -- add `streamChatMessage(notebookId, message, onToken)` client function (fetch + stream reader), used only inside a TanStack Query mutation.
- `components/chat/chat-panel.tsx` -- NEW: message list (markdown render, `aria-live="polite"` region) + composer (auto-grow textarea, Enter/Shift+Enter, disabled while streaming) + inline retry on failure.
- `components/notebooks/workspace.tsx` -- replace the static Chat tab placeholder with `<ChatPanel />`.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/adapters/qdrant/index.ts` -- implement `search` (notebookId filter, topK=5, minScore=0.30, map points to `ScoredChunk[]`); use `String(point.id)` as `chunkId` verbatim, no dash-stripping or other mutation -- unblocks retrieval; AD-8.
- [x] `backend/src/adapters/llm/index.ts` -- implement env-driven `complete`/`streamComplete` (`LLM_BASE_URL`/`LLM_API_KEY`/`LLM_MODEL`) -- unblocks reasoning; mirrors embeddings adapter pattern.
- [x] `backend/src/templates/VectorStoreMemoryStrategy.ts` -- implement `retrieve` via `VectorStore.search` scoped to notebookId; format each retrieved chunk's content with its `chunkId` inline (e.g. `[chunkId] text`) so the id survives into whatever raw text reaches the model -- AD-8.
- [x] `backend/src/templates/GroundedAnswerReasoningStrategy.ts` -- implement a pure prompt/formatting helper (system-prompt builder + grounded-context formatter) called directly by `ChatService` for every grounded turn — not registered as a shikigami `reasoningManager` strategy, since the installed Agent only invokes `reasoningManager.reason` on a memory-miss and this story's grounded path is always a memory-hit by construction. See Design Notes.
- [x] `backend/src/templates/NotebookSession.ts` -- implement session backed by last-7-turns window -- AD-9.
- [x] `backend/src/adapters/neon/index.ts` -- add `findRecentChatMessages(notebookId, limit)` returning the most recent `limit` messages in chronological order (query `ORDER BY created_at DESC LIMIT $2`, then reverse in application code) -- fixes the existing `findChatMessagesByNotebookId` ascending-order/1000-row-cap trap for history-window loading.
- [x] `backend/src/contexts/chat/index.ts` -- NEW `ChatService.ask(userId, notebookId, message)` per the revised Design Notes turn flow below (single retrieval call, direct LLM streaming call built from `GroundedAnswerReasoningStrategy`'s prompt, no unused `Agent`/`reasoningManager`/`memoryManager` wiring on the hot path); persist a `failed`-content assistant message when the LLM call errors after user message persistence, so the failed turn survives reload; thread an `AbortSignal` from the route into the LLM call so a client disconnect stops the in-flight request.
- [x] `app/api/lib/backend.ts` -- wire `LlmAdapter`, chat templates, `ChatService` into composition root -- DI.
- [x] `app/api/notebooks/[id]/chat/route.ts` -- NEW streaming POST route with auth/ownership/error envelope; encode the error sentinel as a fixed non-empty printable ASCII marker written via a normal escaped string literal (never a literal control byte pasted into source) and implement `ReadableStream.cancel()` to abort the in-flight turn.
- [x] `components/notebooks/api.ts` -- add chat client streaming function; buffer the tail of each decoded chunk across `reader.read()` calls so the error sentinel is detected even when split across two reads.
- [x] `components/chat/chat-panel.tsx` -- NEW composer + streaming markdown message list + `aria-live` region + inline retry; store each failed turn's original message text on the turn itself (not a single shared "last message" ref) so retrying an older failed turn resends the correct text even if newer turns were sent since; the `aria-live` region must announce the failure text (not just settled successful content) when the latest turn's status is `failed`.
- [x] `components/notebooks/workspace.tsx` -- render `ChatPanel` in the Chat tab -- integration.
- [x] Unit test edge cases from the I/O matrix (cross-notebook isolation, no-match refusal, sliding-window truncation) at the `ChatService`/adapter level, runnable via `npm test` (add a minimal `vitest` config + script if no test runner exists yet in this repo) rather than a bespoke manual invocation.

**Acceptance Criteria:**
- Given a notebook with ready sources, when the user types a question and presses Enter, then the answer streams as markdown, the composer disables and auto-grows, and Shift+Enter inserts a newline instead of sending.
- Given the retrieval gate, when an answer is generated, then only the current notebook's chunks are used (`topK=5`, `minScore=0.30`) and another notebook's chunks never appear as context.
- Given the chat session, when a turn is processed, then exactly the last 7 user+assistant turns are fed as context, regardless of how much history exists.
- Given a streaming answer, when it renders, then it lives inside a stable `aria-live="polite"` region that announces only the final settled message.
- Given a network or LLM failure mid-answer, when it fails, then the message shows an inline retry control, never a silent failure.
- Given no retrieved chunk clears `minScore`, when the model responds, then it never falls back to general knowledge and returns an explicit "Not in your sources." message with no citations.

## Spec Change Log

### 2026-08-10 — Amendment after review loopback (iteration 1)
- **Triggering finding:** The installed `@glitch-guy0/shikigami` `Agent.execute()` only invokes a registered `reasoningManager.reason()` as a memory-miss fallback, and always proceeds to call the LLM using a flattened `memoryContext` string built from each memory item's `content` field alone — chunk metadata (`chunkId`) is discarded before it reaches the model. Since this story's `ChatService` only constructs the Agent on a confirmed memory-hit (retrieval gate already passed), `reasoningManager.reason()` — and therefore `GroundedAnswerReasoningStrategy`'s grounded system prompt and citation-marker instructions — never ran in production; only the unit tests exercised it, in isolation, disconnected from the real Agent call path. Citations were therefore structurally impossible: the model never saw a chunk id to cite.
- **What was amended:** Design Notes' turn flow no longer delegates the grounded LLM call to shikigami's `Agent.execute()` / `reasoningManager` / `memoryManager` machinery. `ChatService` now performs retrieval once (via `VectorStoreMemoryStrategy.retrieveChunks`), builds the grounded prompt directly via `GroundedAnswerReasoningStrategy`'s prompt-builder methods (now a plain helper class, not a registered `ReasoningStrategy`), and calls `LlmAdapter.streamComplete` directly. `VectorStoreMemoryStrategy.retrieve` now embeds each chunk's `chunkId` inline in the content string it returns, so the id survives into whatever raw context text is used. `NotebookSession` is still implemented as a `Session`-shaped class (per the template stub's contract) but is used only to shape/validate the history window passed into the prompt, not wired into a shikigami `Agent`.
- **Known-bad state avoided:** the previous design would have shipped a chat feature where ≥90% of answers carrying a citation (SM-1) was unreachable by construction, no matter how the prompt was worded — the model had nothing to cite. It also left `GroundedAnswerReasoningStrategy.reason()` and the Agent's `reasoningManager` wiring as dead code reachable only by unit tests, silently diverging from what runs against a real request.
- **Folded-in fixes** (surfaced by the same review pass, applied here rather than looped separately since re-derivation touches the same files): `QdrantAdapter.search` must not mutate the Qdrant point id when building `chunkId` (no dash-stripping) — the chunk kernel's `chunkId` must round-trip unchanged for later citation resolution (Story 4.2) to work. History-window loading must fetch the *most recent* N turns, not the oldest — added a dedicated `findRecentChatMessages` repository method (`ORDER BY created_at DESC LIMIT`, reversed) rather than over-fetching 1000 ascending rows and slicing, which silently returns ancient turns for any notebook with >1000 messages. The plain-text stream error sentinel must not be a literal control byte pasted into source (this broke `git diff`/tooling by making the files look binary) and the client must buffer across `reader.read()` chunk boundaries so a sentinel split across two reads is still detected. A failed turn must still persist an assistant row (marked failed) so history and retry survive a reload. The `ReadableStream` needs a `cancel()` handler wired to abort the in-flight LLM call so a client disconnect doesn't keep burning tokens server-side. The chat panel's retry must resend the specific failed turn's own message text (stored per-turn), not a single shared "last sent message" ref. The `aria-live` region must announce failure text too, not just successful settled content.
- **KEEP instructions (preserve on re-derivation):** the structural retrieval-gate-before-any-LLM-call design (never call the LLM at all when nothing clears `minScore`) is correct and must survive unchanged. The overall file layout, composition-root wiring pattern, and the choice of a plain chunked `text/plain` stream (vs. SSE) for the route are correct and must survive unchanged. The composer UX (Enter/Shift+Enter/auto-grow/disabled-while-streaming) and the general `ChatPanel` structure (message list + composer + inline retry) are correct and must survive unchanged — only the retry-target and aria-live-on-failure behavior need fixing, not the overall component shape.

## Review Triage Log

### 2026-08-10 — Review pass
- intent_gap: 0
- bad_spec: 2: (high 2, medium 0, low 0)
- patch: 0
- defer: 0
- reject: 0
- addressed_findings:
  - `[high]` `[bad_spec]` Citations structurally impossible: shikigami `Agent.execute()` discards chunk metadata into a flattened content-only `memoryContext`, so the model never sees a `chunkId` to cite. Amended Design Notes to embed `chunkId` inline in retrieved content and to require the reasoning/prompt step to run explicitly rather than rely on the Agent's internal context flattening.
  - `[high]` `[bad_spec]` `GroundedAnswerReasoningStrategy`'s grounded prompt/refusal logic never executes on the happy path in production, because the installed Agent only calls `reasoningManager.reason()` on a memory-miss and this story's grounded path is always a memory-hit by construction — it was dead code exercised only by unit tests. Amended Design Notes to call the reasoning/prompt-builder directly from `ChatService` instead of registering it as a shikigami `reasoningManager` strategy.

### 2026-08-10 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 12: (high 7, medium 3, low 2)
- defer: 4: (medium 3, low 1)
- reject: 5
- addressed_findings:
  - `[high]` `[patch]` `streamChatMessage` (components/notebooks/api.ts) now `break`s out of the read loop the instant the error sentinel is found instead of `continue`-ing, so the pre-sentinel text is no longer re-emitted to `onToken`/`full` on every subsequent chunk.
  - `[high]` `[patch]` `ChatService.ask` (backend/src/contexts/chat/index.ts) takes an optional `retryOfMessageId`, threaded through the chat route (`retryOfMessageId` in the POST body), `streamChatMessage`, and `chat-panel.tsx`'s `retry()`; a retry reuses the already-persisted user row instead of inserting a duplicate into the AD-9 sliding history window. The route surfaces the persisted/reused user message id back to the client via an `X-Chat-User-Message-Id` response header, captured on each turn for a later retry.
  - `[high]` `[patch]` `ChatService.ask` now calls `findRecentChatMessages` before persisting the current user message (and excludes `retryOfMessageId` from the fetched window on retry), so the current question is never also counted as its own history.
  - `[high]` `[patch]` `chat-panel.tsx` retry() now gates on the same single-in-flight-turn state (`isTurnActive`) as send(), and each call gets its own `AbortController` tracked in a `Set` instead of one shared ref, so aborting one in-flight call can no longer cancel a different one.
  - `[high]` `[patch]` `ChatService.ask` now wraps `memory.retrieveChunks` in try/catch and persists a `FAILED_CONTENT_MARKER`-marked assistant row on a retrieval error, matching the existing LLM-failure persistence path.
  - `[high]` `[patch]` `GroundedAnswerReasoningStrategy.buildHistory` now calls `stripFailedMarker` on assistant turns before formatting them into the prompt, so a previously-failed turn's marker no longer leaks into subsequent prompts.
  - `[high]` `[patch]` `streamTokens` (backend/src/adapters/llm/index.ts) now flushes any remaining buffered SSE fragment after the reader signals `done`, so a stream that ends without a trailing newline no longer silently drops its last token(s).
  - `[medium]` `[patch]` `streamChatMessage` (components/notebooks/api.ts) now wraps both the initial `fetch` and the `reader.read()` loop in try/catch, resolving to the same `{failed: true, errorMessage}` shape used by its other failure paths instead of throwing an unhandled rejection.
  - `[medium]` `[patch]` `FAILED_CONTENT_MARKER` changed from the plain literal `"[[failed]]"` to a longer, uuid-suffixed `"[[CHAT_FAILED_TURN_8f2e1c9a4b7d]]"` (now defined once in `GroundedAnswerReasoningStrategy.ts` and re-exported from `contexts/chat`) to cut collision risk with genuine model output.
  - `[medium]` `[patch]` `chat-panel.tsx` now aborts every controller in `activeControllersRef` in a `useEffect` unmount-only cleanup, so no in-flight stream keeps updating state after the component unmounts.
  - `[low]` `[patch]` `GroundedAnswerReasoningStrategy.buildHistory` now labels `role: 'system'` messages as `System` instead of falling through to `User`.
  - `[low]` `[patch]` The chat route's streaming `Response` now sets `Cache-Control: no-store` alongside its existing `Content-Type` header.

## Design Notes

Turn flow (revised): `POST /api/notebooks/[id]/chat` receives `{message}` → `ChatService.ask` persists the user's `chat_messages` row immediately → loads the last 7 turns via `findRecentChatMessages` (most-recent-first query, reversed to chronological order) → runs `VectorStoreMemoryStrategy.retrieveChunks(message)` exactly once (notebookId-scoped, topK=5, minScore=0.30) → if empty, persists and streams the fixed "Not in your sources." answer without ever constructing an LLM call (structural refusal — unchanged from before) → otherwise builds the grounded system prompt + chunk-tagged context via `GroundedAnswerReasoningStrategy`'s prompt-builder methods (chunks formatted as `[chunkId] text`, instructing the model to emit inline `[[chunkId]]` markers only for chunks actually present in that context) → calls `LlmAdapter.streamComplete(systemPrompt, userPromptWithHistoryAndContext)` directly, forwarding each streamed token to the HTTP response as it arrives → on completion, persists the assembled full answer as an `assistant` `chat_messages` row (citation markers left raw for Story 4.2 to parse) → on error, persists a `failed`-marked assistant row with whatever was assembled so far, forwards an error event, and terminates the stream so the client shows inline retry. `NotebookSession` still exists as a `Session`-shaped class per the template stub's contract, used to validate/shape the 7-turn window handed into the prompt; it is not wired into a shikigami `Agent` on this path since no `Agent` is constructed.

Grounding is structural, not prompt-only: retrieval returning `[]` (nothing clears `minScore`) short-circuits before any LLM call is made — this guarantees zero fabricated citations without relying on prompt discipline, and is unchanged from the original design.

Route streaming: use a `ReadableStream` response with `Content-Type: text/plain; charset=utf-8` (chunked transfer) rather than full SSE framing, since the client only needs a raw token stream, not multiple event channels — keep this simple until a later story needs richer event types. The error sentinel is a short fixed printable-ASCII marker (e.g. a string constant like `"CHAT_ERROR:"`) written as a normal TypeScript string literal — never a raw control byte typed directly into source — and the client-side reader buffers the trailing partial chunk across reads before searching for the sentinel, so a sentinel split across two `reader.read()` calls is still found.

## Verification

**Commands:**
- `npm run typecheck` -- expected: no type errors.
- `npm run build` -- expected: production build succeeds with all routes.

**Manual checks (if no CLI):**
- With `LLM_BASE_URL`/`LLM_API_KEY`/`LLM_MODEL` unset, confirm the app still typechecks/builds and the chat route fails gracefully (not a crash) rather than requiring the env at build time.
- Confirm no client component calls `fetch` directly; the chat panel uses a TanStack Query mutation wrapping the streaming client function.
- Confirm the Chat tab's `aria-live="polite"` region does not announce every token (would spam screen readers) — only the settled final message.

## Auto Run Result

**Summary:** Implemented notebook-scoped chat: Qdrant vector search, env-driven LLM adapter, shikigami-contract templates (memory/reasoning/session, invoked directly by `ChatService` rather than delegated to shikigami's `Agent` orchestration — see Spec Change Log for why), a new `ChatService` orchestrating retrieval-gated structural refusal + direct LLM streaming, a streaming API route, and a real `ChatPanel` UI replacing the Chat tab placeholder. Went through one `bad_spec` loopback (grounding/citation architecture was unreachable through the real shikigami `Agent`) and one `patch` pass (12 fixes: duplicate-emission, retry duplicating history rows, double-counted current question, composer/abort race, inconsistent failure persistence, failed-marker leakage into prompts, dropped trailing SSE tokens, and others).

**Files changed:**
- `backend/src/adapters/qdrant/index.ts` — implemented `search` (notebookId-scoped, topK/minScore, verbatim chunkId).
- `backend/src/adapters/llm/index.ts` — env-driven `LlmAdapter.complete`/`streamComplete`, flushes trailing SSE buffer.
- `backend/src/adapters/neon/index.ts` — added `findRecentChatMessages`.
- `backend/src/templates/VectorStoreMemoryStrategy.ts`, `GroundedAnswerReasoningStrategy.ts`, `NotebookSession.ts` — grounded retrieval, direct prompt-building (not a registered shikigami reasoning strategy), history formatting with failed-marker stripping.
- `backend/src/contexts/chat/index.ts` (+ tests) — `ChatService`: retrieval gate, structural refusal, direct LLM streaming, retry-aware persistence.
- `app/api/lib/backend.ts` — composition-root wiring.
- `app/api/notebooks/[id]/chat/route.ts` — streaming POST route, `Cache-Control: no-store`, retry id passthrough.
- `components/notebooks/api.ts` — `streamChatMessage` TanStack Query client function, sentinel/error handling.
- `components/chat/chat-panel.tsx` — composer, streaming markdown list, `aria-live`, per-turn retry, abort-on-unmount.
- `components/notebooks/workspace.tsx` — Chat tab wired to `ChatPanel`.
- `vitest.config.ts`, `package.json` — added a test runner (none existed in the repo before this story).

**Review findings breakdown:** 1 bad_spec loopback (2 high findings: dead reasoning strategy + discarded chunk ids, both architectural), then 12 patched (7 high, 3 medium, 2 low), 4 deferred (3 medium, 1 low) to `deferred-work.md`, 5 rejected as noise/out-of-scope.

**Verification performed:** `npm run typecheck` — pass. `npm run build` — pass. `npm test` — pass (new `chat-service.test.ts`, 5 cases covering HAPPY_ASK, CROSS_NOTEBOOK_ISOLATION, NO_MATCH/EMPTY_NOTEBOOK, SLIDING_WINDOW, STREAM_FAIL). No live LLM/Qdrant endpoint available in this sandbox — streaming and retrieval are verified against fakes/mocks only.

**Follow-up review recommendation:** `true` — this story went through an architectural loopback plus 12 patches (7 high-severity) touching every layer of the new feature (adapters, service orchestration, prompt construction, route, and UI), including several with direct data-integrity/correctness impact (duplicate history rows, dropped tokens, prompt leakage). The volume and severity warrant an independent follow-up pass before this is trusted as a stable foundation for Stories 4.2–4.5, which build directly on it.

**Residual risks:**
- No live LLM/Qdrant/embeddings endpoint exercised in this sandbox — the OpenAI-compatible SSE parsing, Qdrant REST search shape, and end-to-end streaming are verified only against test fakes.
- Four items deferred: no ordering tiebreaker for same-millisecond `chat_messages` rows, in-band error/failure sentinels are collision-possible with genuine model text (accepted simplicity tradeoff per Design Notes, pending future structured framing), unvalidated Qdrant response/payload shape, and no message length cap.
- Citation markers are left raw in persisted/streamed text for Story 4.2 to parse — their exact format (chunk-id-tagged inline markers) has not been validated against a real model's actual output, only against the system prompt's instructions.
