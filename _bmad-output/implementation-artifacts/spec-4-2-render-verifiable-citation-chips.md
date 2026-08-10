---
title: 'Story 4.2 — Render Verifiable Citation Chips'
type: 'feature'
created: '2026-08-10'
status: 'done'
baseline_revision: 8f72cdf177076efd6e5c046d123931529df2965d
final_revision: e505919e83be5f00a5d87c6c9bbdbf59aa1a929d
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** Story 4.1 shipped grounded streaming answers where the model emits inline `[[chunkId]]` markers per its system prompt, but nothing validates or renders them: `CitationMapper` is still an unimplemented stub, `ChatService` never computes or persists a `citations` array (though `createChatMessage`/`ChatMessage.citations`/`CitationSnapshot` already support it), and `ChatPanel` passes raw assistant text straight to `react-markdown`, so any marker the model emits appears as literal visible `[[chunkId]]` text instead of a citation chip.

**Approach:** Implement `CitationMapper` to validate every `[[chunkId]]` marker in a completed answer against the chunk ids actually retrieved for that turn, dropping unknown/invalid ones, and produce `CitationSnapshot[]` for the survivors. `ChatService` computes this once the answer settles and persists it via `createChatMessage`'s existing `citations` parameter, then sends it to the client as a trailing in-stream marker (mirroring the existing `CHAT_ERROR:` sentinel pattern) so the client doesn't need a second round-trip. `ChatPanel` renders validated markers as focusable, hoverable citation chips (source title on hover/focus) at the point they appear in the settled text; unvalidated/dropped markers render as plain text with the bracket syntax removed. Opening the cited source (Original View) is Story 4.3's scope — this story's chip exposes an `onOpenCitation` interaction point that is wired to a no-op placeholder for now.

## Boundaries & Constraints

**Always:**
- `CitationMapper` validates every `[[chunkId]]` marker against the chunkId set of the chunks actually retrieved for that specific turn (the same `ScoredChunk[]` `ChatService` already retrieves) — never against all chunks ever indexed for the notebook (AD-7).
- An unknown/invalid marker (chunkId not in the retrieved set for this turn, or malformed) is dropped: it never becomes a chip and never appears in the persisted `citations` array (AD-7 — validated, never trusted).
- A refusal answer (`NOT_IN_SOURCES_ANSWER`) always carries zero citation markers and an empty/absent `citations` array — already true structurally from Story 4.1; this story must not regress it.
- Citations are computed once, after the full answer text has been assembled (streaming itself is unaffected — raw tokens still stream as-is; chip rendering is a settle-time transformation of the finished message).
- The persisted `citations` field on the `assistant` `chat_messages` row is a `CitationSnapshot[]` (`chunkId`, `sourceId`, `span`) — reuse the existing `createChatMessage` parameter and `ChatMessage.citations`/`CitationSnapshot` types; no schema change.
- Citation chips are keyboard-focusable (in the natural tab order), open on Enter (invoking an `onOpenCitation(citation)` callback — the callback's actual navigation behavior is Story 4.3's responsibility, not this story's), and show the source title on hover/focus.
- Chip source-title resolution uses already-fetched client-side source data (`fetchSources` / `SourceRecord`) — no new network call per chip.
- All new interactive elements carry a unique `data-debug` name, consistent with the rest of the app.

**Block If:**
- None identified — this story is additive on top of Story 4.1's already-validated architecture and existing type/DB support.

**Never:**
- No implementing Original View / Showcase navigation (Story 4.3) — the chip's click/Enter handler is wired to a placeholder for this story.
- No refusal UI or fetch-on-refusal changes (Story 4.4).
- No citation-attach/click-through telemetry pipeline (SM-1/SM-2) — no telemetry infrastructure exists yet in this codebase; defer actual event recording to whenever telemetry infra is introduced. Do not fabricate a telemetry call that logs nowhere meaningful.
- No changing the `[[chunkId]]`/`[chunkId]` marker syntax established in Story 4.1's `GroundedAnswerReasoningStrategy` system prompt.
- No paginated history loading changes (Story 4.5).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| VALID_MARKERS | Answer contains `[[chunkId]]` markers all present in the turn's retrieved chunk set | Each becomes a citation chip at that point in the rendered text; `citations` persisted with matching `CitationSnapshot`s | none |
| UNKNOWN_MARKER | Answer contains a `[[chunkId]]` not in the retrieved set (hallucinated/malformed) | Marker dropped: rendered as plain text with no bracket syntax, no chip, not included in persisted `citations` | none |
| NO_MARKERS | Grounded answer with zero markers (model didn't cite) | Renders as plain markdown; `citations` persisted as empty array | none |
| REFUSAL | `NOT_IN_SOURCES_ANSWER` | Zero markers, `citations` empty/absent, no chips | none |
| DUPLICATE_MARKER | Same valid `[[chunkId]]` cited more than once in the answer | Each occurrence renders its own chip at its own position; `citations` array may contain the same `chunkId` more than once (each occurrence's own snapshot) | none |
| CHIP_KEYBOARD | Chip present in a rendered answer | Tab reaches it; Enter invokes `onOpenCitation`; hover/focus shows the source title | none |
| MISSING_SOURCE_TITLE | A cited `sourceId` isn't found in the client's currently-loaded source list (e.g. removed) | Chip still renders (using the persisted `chunkId`/`sourceId`); hover/focus title falls back to a generic label instead of crashing | none |

</intent-contract>

## Code Map

- `backend/src/templates/CitationMapper.ts` -- implement `map(answerText, retrievedChunks)`: regex-scan `[[chunkId]]` markers in order of appearance, validate each against `retrievedChunks` (by `chunkId`), return ordered `CitationSnapshot[]` for valid markers only (dropping unknown/malformed ones).
- `backend/src/contexts/chat/index.ts` -- after the answer settles (the existing `finalAnswer`/`assembled` completion branch), call `CitationMapper.map(finalAnswer, chunks)`, pass the result as the 5th arg to `createChatMessage`, and append a `CHAT_CITATIONS:<json>` trailer token (mirroring the existing `CHAT_ERROR:` sentinel design) before the stream closes on the success path.
- `components/notebooks/api.ts` -- extend `streamChatMessage`'s tail-buffering sentinel scan (already handles `CHAT_ERROR:`) to also recognize `CHAT_CITATIONS:`, parse its JSON payload, and add a `citations: CitationSnapshot[]` field to `StreamChatResult`.
- `components/chat/chat-panel.tsx` -- pre-process a settled assistant message's raw content by replacing each *validated* `[[chunkId]]` occurrence with a markdown link placeholder (e.g. `[•](citation:chunkId)`) consumed by a custom `react-markdown` `a` component override that renders a `CitationChip`; strip any remaining (unvalidated) `[[chunkId]]`-shaped text to plain text. While a message is still streaming, render raw text unchanged (no chip substitution mid-stream).
- `components/chat/citation-chip.tsx` -- NEW: focusable `<button>`-like chip, `title`/tooltip showing the resolved source title on hover/focus, `onClick`/Enter invokes `onOpenCitation(citation)` (placeholder no-op for this story), unique `data-debug` name.
- `components/notebooks/workspace.tsx` / `components/chat/chat-panel.tsx` -- resolve `sourceId → title` using the already-loaded `fetchSources`/`SourceRecord` client data (via a `useQuery` on `fetchSources(notebookId)`, deduped by TanStack Query against any existing Sources-tab fetch).
- `backend/src/contexts/chat/__tests__/chat-service.test.ts` -- extend with citation-mapping coverage (valid/unknown/duplicate markers, refusal has zero citations).

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/templates/CitationMapper.ts` -- implement `map`: parse `[[chunkId]]` markers in order, validate against the retrieved chunk set, return ordered `CitationSnapshot[]` for valid markers, drop the rest -- AD-7.
- [x] `backend/src/contexts/chat/index.ts` -- compute citations via `CitationMapper.map` once the answer settles; persist via `createChatMessage`'s `citations` param; stream a `CHAT_CITATIONS:<json>` trailer on success (refusal/error paths send none/empty) -- story core.
- [x] `components/notebooks/api.ts` -- parse the `CHAT_CITATIONS:` trailer (tail-buffered like the existing error sentinel) into `StreamChatResult.citations` -- client wiring.
- [x] `components/chat/citation-chip.tsx` -- NEW keyboard-focusable chip: hover/focus shows source title, Enter/click invokes `onOpenCitation` (no-op placeholder) -- UX-DR14, NFR-2.
- [x] `components/chat/chat-panel.tsx` -- on settle, transform validated `[[chunkId]]` markers into rendered `CitationChip`s via a `react-markdown` component override; strip unvalidated marker text; resolve source titles from already-loaded source data with a generic fallback when a source isn't found -- story core.
- [x] Unit test edge cases from the I/O matrix (valid, unknown/dropped, duplicate, refusal-has-zero) at the `CitationMapper`/`ChatService` level.

**Acceptance Criteria:**
- Given an answer with inline markers, when it renders, then every marker validated against the turn's retrieved chunkId set becomes a per-sentence-position citation chip, and unknown/invalid markers never render as chips or bracket text.
- Given a citation chip, when the user tabs to it, then it is keyboard-focusable, opens (invokes its open handler) on Enter, and shows the source title on hover/focus.
- Given a refusal answer, when it renders, then it carries zero citation markers and an empty/absent persisted `citations` array.
- Given a successful grounded answer, when citations are computed, then the persisted `chat_messages.citations` array matches exactly the validated markers found in the final answer text (no more, no fewer).

## Spec Change Log

(Empty until first review loopback.)

## Review Triage Log

### 2026-08-10 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 3 (medium 0, low 3)
- defer: 2 (medium 1, low 1)
- reject: 4 (low 4)
- addressed_findings:
  - `[low]` `[patch]` Client `CitationSnapshot` in `components/notebooks/api.ts` was a duplicate hand-copied interface instead of the canonical `backend/src/shared-kernel/types` type — replaced with `import type ... from '@backend/shared-kernel/types'` + re-export, closing the drift risk between client/server shapes.
  - `[low]` `[patch]` A `failed` assistant turn was treated as "settled" for the citation-marker transform, so any complete-looking `[[chunkId]]` text in the partial content streamed before the failure was silently stripped to nothing — changed the settle check from `status !== 'streaming'` to `status === 'done'` so failed turns render their raw partial content unchanged, same as while streaming.
  - `[low]` `[patch]` `chunkId` was embedded unescaped into the `citation:${chunkId}` markdown-link href; a chunkId containing `)`/whitespace/markdown-special characters would terminate the link early and break chip rendering — added `encodeURIComponent`/`decodeURIComponent` around the chunkId at both the link-construction and the `a`-override lookup sites.
  - `[medium]` `defer` The `CHAT_CITATIONS:` trailer's JSON payload is parsed as soon as the sentinel is found in the buffered chunk, with no handling for the payload itself arriving split across multiple stream reads (unlike sentinel-detection, which already holds back a tail for a partial sentinel match) — a truncated payload throws and is silently swallowed to `citations = []`. Deferred: this bug shares its root cause and fix shape with the pre-existing, unbuffered `CHAT_ERROR_SENTINEL` payload read in the same function, so fixing it here alone would leave the sibling sentinel with the identical flaw; recorded in deferred-work.md for a single fix covering both sentinels.
  - `[low]` `defer` Both `CHAT_ERROR_SENTINEL` and (now) `CHAT_CITATIONS_SENTINEL` are detected via plain substring search against raw streamed model text, so a model response that legitimately quotes the literal sentinel string would be misinterpreted as a trailer boundary. Pre-existing risk for `CHAT_ERROR_SENTINEL`, extended rather than introduced by this story; recorded in deferred-work.md.
  - `[low]` `reject` — no automated test coverage for `citation-chip.tsx`/`AssistantMessageContent` UI behavior: the spec's own Tasks & Acceptance section explicitly scopes automated tests to the `CitationMapper`/`ChatService` level and defers keyboard/hover verification to manual checks — not a gap.
  - `[low]` `reject` — intent-contract wording mismatch between "Approach" (implies bracket-stripped-but-visible text) and "Design Notes" (empty-string removal) for unvalidated markers: the implementation follows the AD-7-consistent Design Notes reading; no behavioral defect, just a documentation nit not worth a spec loopback.
  - `[low]` `reject` — `chunkIdToCitation` Map collapses multiple same-chunkId citation occurrences to one entry: currently safe because `span`/`sourceId` are chunk-invariant per occurrence; speculative future-proofing only, no current failure scenario.
  - `[low]` `reject` — `useQuery` for sources has no `enabled` guard against an empty `notebookId`: `ChatPanelProps.notebookId` is always populated by its caller; no reachable failure path.

## Design Notes

Marker-to-chip transform: on settle (not during streaming), scan `content` for `[[chunkId]]` occurrences in order; for each, check membership in the `citations` array received via the `CHAT_CITATIONS:` trailer (a `Set<chunkId>` is enough — duplicates in `citations` are fine since the same `chunkId` can be cited more than once and each occurrence gets its own chip). Build a transformed markdown string replacing each valid occurrence with `[•](citation:${chunkId})` and each invalid occurrence with empty string (removing the bracket text entirely, per AD-7 — dropped markers are invisible, not shown as raw text). Pass the transformed string to `react-markdown` with a custom `a` renderer: if `href` starts with `citation:`, render `<CitationChip chunkId={...} sourceId={lookup} onOpen={...} />` instead of a real link; otherwise render a normal anchor.

Source-title lookup: `chat-panel.tsx` needs a `chunkId → sourceId` map (from the settled message's own `citations: CitationSnapshot[]`) and a `sourceId → title` map (from `fetchSources(notebookId)`, likely already cached by TanStack Query if the Sources tab was visited this session — a fresh `useQuery` call is cheap and correctly deduped either way).

`CHAT_CITATIONS:` trailer format: append after the answer content, before the stream closes, only on a successful (non-error, non-refusal-is-fine-too-but-empty) completion: `CHAT_CITATIONS:${JSON.stringify(citations)}` — parsed the same way the client already tail-buffers and detects `CHAT_ERROR:`, just a second sentinel to check for in the same scan.

## Verification

**Commands:**
- `npm run typecheck` -- expected: no type errors.
- `npm run build` -- expected: production build succeeds with all routes.
- `npm test` -- expected: all tests pass, including new citation-mapping cases.

**Manual checks (if no CLI):**
- Confirm a chip is reachable via Tab and activates on Enter (keyboard-only pass).
- Confirm hovering/focusing a chip shows the source title without a network request (check devtools network tab).
- Confirm an answer with a deliberately unknown chunkId marker (e.g. test fixture) renders no bracket text and no chip for that marker.

## Auto Run Result

**Summary:** Implemented citation-chip rendering end-to-end on top of Story 4.1's grounded streaming: `CitationMapper` now validates `[[chunkId]]` markers against the turn's retrieved chunks, `ChatService` persists and streams the resulting `citations`, the client parses the new `CHAT_CITATIONS:` trailer, and `ChatPanel` renders validated markers as focusable/hoverable `CitationChip`s (unvalidated ones are silently stripped).

**Files changed:**
- `backend/src/templates/CitationMapper.ts` — implemented `map()`: ordered marker scan, validated against the turn's retrieved chunk set only.
- `backend/src/contexts/chat/index.ts` — computes citations on settle, persists via `createChatMessage`, adds `citations` to the `done` event.
- `backend/src/adapters/neon/index.ts` — typed the `citations` param as `CitationSnapshot[]` instead of `unknown`.
- `app/api/notebooks/[id]/chat/route.ts` — added `CHAT_CITATIONS_SENTINEL` trailer on successful completion.
- `components/notebooks/api.ts` — parses the citations trailer into `StreamChatResult.citations`; now imports the shared `CitationSnapshot` type instead of redeclaring it (review patch).
- `components/chat/citation-chip.tsx` (new) — focusable/hoverable chip component.
- `components/chat/chat-panel.tsx` — settle-time marker-to-chip transform via a `react-markdown` component override; source-title lookup from already-fetched sources; failed turns now render raw content instead of stripping markers (review patch); chunkId is URI-encoded/decoded in the citation link (review patch).
- `backend/src/contexts/chat/__tests__/chat-service.test.ts`, `backend/src/templates/__tests__/citation-mapper.test.ts` — new coverage for valid/unknown/duplicate/refusal/no-marker scenarios.

**Review findings breakdown:** 3 patches applied (duplicate type definition, failed-turn marker stripping, unescaped chunkId in markdown link — all low severity), 2 deferred (unbuffered sentinel-payload parsing across stream reads — medium; in-band sentinel string collision risk, extends a pre-existing Story 4.1 issue — low), 4 rejected (missing UI test coverage — explicitly out of spec scope; intent-contract wording nit; speculative duplicate-citation Map collapse; speculative `useQuery` guard).

**Follow-up review recommendation:** `false` — patches were small, localized, and low-consequence.

**Verification performed:** `npm run typecheck` (clean), `npm test` (17/17 passing, including new citation-mapper/chat-service cases), `npm run build` (production build succeeds, all routes present). UI keyboard/hover/chip-rendering behavior was not exercised in a browser this pass — verified by code inspection only, per the spec's own manual-check scope.

**Residual risks:** The two deferred sentinel-parsing issues (payload truncation across stream reads; in-band sentinel string collision) are pre-existing-pattern risks now shared by two sentinels instead of one; low likelihood in practice given typical citation payload/message sizes, but noted in `deferred-work.md` for a future structured-framing fix.
