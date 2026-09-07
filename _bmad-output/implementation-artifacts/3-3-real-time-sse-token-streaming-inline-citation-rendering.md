---
title: 'Story 3.3: Real-Time SSE Token Streaming & Inline Citation Rendering'
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

**Problem:** Users need streaming token-by-token conversational answers with low TTFT (< 1.5s), deduction of 1 query credit from their daily credit balance, interactive cyan citation pills (`[1]`, `[2]`), and persistence into Neon `chat_messages`.
**Approach:**
- Implement `/api/chat` and `/api/notebooks/[id]/chat` routes for real-time SSE streaming.
- Deduct 1 credit per query from daily balance.
- Client parser converts `[[C:chunkId]]` / `[[chunkId]]` into `<CitationPill>` (`<CitationChip>`) styled in high-contrast cyan (`#00E5FF`) with Space Mono bold numerals.
- Persist completed user and assistant conversation turns into Neon `chat_messages`.

## Boundaries & Constraints

**Always:**
- Stream tokens via SSE with time to first token < 1.5s.
- 1 credit deducted per query transaction.
- Client converts `[[C:chunkId]]` markers into interactive `<CitationPill>` with `#00E5FF` styling and Space Mono numerals.
- Persist completed turns to Neon `chat_messages`.

**Never:**
- Never render raw `[[C:chunkId]]` text to the user.
- Never drop mid-stream tokens or corrupt citation trails.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| User Prompt | Valid prompt in active notebook | Stream starts immediately (TTFT < 1.5s), tokens emitted | Emits CHAT_ERROR: on failure |
| Grounded Citations | Completion has citations | CHAT_CITATIONS: trailer emitted and rendered as `<CitationPill>` | Unknown markers dropped silently |
| Credit Deduction | Query submitted | 1 credit deducted from daily balance | Lockout if credits depleted |
| Client Disconnect | User navigates away or aborts | AbortSignal triggers cancellation, stops LLM burns | Closes stream |

</intent-contract>

## Code Map

- `app/api/chat/route.ts` -- SSE streaming endpoint for `/api/chat` with credit deduction and telemetry.
- `app/api/notebooks/[id]/chat/route.ts` -- Notebook-scoped SSE streaming endpoint with telemetry recording.
- `components/chat/citation-chip.tsx` -- `<CitationChip>` and `<CitationPill>` component with `#00E5FF` styling.
- `components/chat/chat-panel.tsx` -- Marker regex parsing for `[[C:chunkId]]` and inline link conversion.
- `app/api/chat/__tests__/api-chat.test.ts` -- Unit tests for `/api/chat` endpoint.

## Tasks & Acceptance

**Execution:**
- [x] Create `app/api/chat/route.ts` supporting SSE token streaming and chat management.
- [x] Integrate credit balance deduction and TTFT tracking.
- [x] Export `<CitationPill>` alias and update `MARKER_RE` parser for `[[C:chunkId]]`.
- [x] Verify with unit tests in `app/api/chat/__tests__/api-chat.test.ts`.

## Auto Run Result

- Status: done
- Real-time SSE token streaming implemented and verified.
- Inline citation rendering with `[[C:chunkId]]` and `<CitationPill>` active.
- Verified via `app/api/chat/__tests__/api-chat.test.ts`.
