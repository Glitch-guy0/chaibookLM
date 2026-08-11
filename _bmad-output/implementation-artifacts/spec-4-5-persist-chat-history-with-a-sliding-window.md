---
title: 'Story 4.5 — Persist Chat History with a Sliding Window'
type: 'feature'
created: '2026-08-11'
status: 'done'
baseline_revision: 002000a3a267b9359613387e84b92762bf624e94
final_revision: 95ea7e633d5b7c5c7df88a3649649c74fd2a9f18
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** `ChatService.ask()` already persists every user/assistant turn to Neon's `chat_messages` table (with `HISTORY_WINDOW = 7` already governing how much history is fed back to the model), but the client (`ChatPanel`) never reads any of it back — `turns` state is `useState<Turn[]>([])` with no fetch on mount and no route to fetch it, so a user who leaves and returns to a notebook sees an empty chat, even though the full history and its resolved citation snapshots are sitting in Postgres.

**Approach:** Add a paginated `GET /api/notebooks/[id]/chat` route backed by a new cursor-based `NeonRepository.findChatMessagesBefore` method (most-recent-7 on no cursor, next-older-7 given a `before` cursor). Wire `ChatPanel` to load the most recent page on mount, replacing its empty initial state, and to load the next-older page when the user scrolls the message list to its top, prepending results while preserving scroll position. Persisted assistant messages already carry their `CitationSnapshot[]` in the `citations` JSONB column, so rendering old citation chips requires no new persistence — only mapping the loaded rows into the same `Turn` shape the live streaming path already produces.

## Boundaries & Constraints

**Always:**
- Pagination is strictly 7-at-a-time (matching `HISTORY_WINDOW`), never infinite scroll — each scroll-to-top triggers exactly one bounded fetch of up to 7 older messages, not a continuous stream.
- The initial load on notebook open shows the most recent 7 turns (a "turn" being a user+assistant message pair is the product framing, but the underlying table stores one row per message — the route paginates by message row, and 7 messages is "7 turns" in the ordinary case of one user + one assistant row per exchange; refusal-only or error-only exchanges still count each stored row toward the limit, which is acceptable since `HISTORY_WINDOW` already governs message rows, not exchange pairs, server-side).
- Old citation chips render directly from the persisted `citations` JSONB snapshot (`chunkId`/`sourceId`/span) already on each assistant `ChatMessage` row — never re-derived from live Qdrant chunk data, since that data may no longer match by the time history is reloaded.
- `ChatService.ask()`'s existing `HISTORY_WINDOW = 7` context-feeding behavior is unchanged — this story is purely about the client's read/pagination path, not the model-context path, which already satisfies AD-9's "exactly last 7 turns fed" requirement.
- Ownership is enforced on the new route the same way as the existing chat POST route (auth + notebook.userId match).
- All new interactive elements (the scroll container, any loading indicator) carry a unique `data-debug` name, consistent with the rest of the app.

**Block If:**
- None identified — additive on top of Story 4.1-4.4's existing `ChatService`/`chat_messages` persistence and `ChatPanel` rendering.

**Never:**
- No change to how `ChatService.ask()` builds model context (`HISTORY_WINDOW`, `findRecentChatMessages`) — that path already exists and already satisfies the AD-9 requirement.
- No new citation persistence or `CitationSnapshot` schema changes — the shape and storage already exist from Story 4.2.
- No refusal-turn or fetch-on-refusal state (`Story 4.4`'s `fetchOnRefusal` field) reconstruction for historical turns — a reloaded refusal turn renders its "Not in your sources." content and citations (none, by definition) but does not attempt to re-offer a stale "Find related web pages" action tied to a page-load session that no longer exists.
- No changes to `CitationMapper`, `ShowcasePanel`, or the citation marker syntax.
- No websocket/real-time sync between multiple open tabs — a page reload is the only way older history becomes visible after this story.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| INITIAL_LOAD | Notebook opened, `>0` persisted messages exist | The 7 most-recent messages render in `ChatPanel`, oldest-first, replacing the empty initial state | none |
| INITIAL_LOAD_EMPTY | Notebook opened, zero persisted messages | Empty chat panel, same as today's pre-story behavior | none |
| SCROLL_UP_MORE | User scrolls the message list to the top; more than 7 older messages exist beyond what's loaded | The next-older 7 messages prepend above the current list; scroll position holds steady on the message the user was viewing (no visual jump) | none |
| SCROLL_UP_EXHAUSTED | User scrolls to top; fewer than 7 (or zero) older messages remain beyond what's loaded | The remaining older messages (if any) load once, then further scroll-to-top is a no-op — no repeated fetches, no infinite-scroll spinner loop | none |
| OLD_CITATION_RENDER | A loaded historical assistant message has a non-empty `citations` JSONB snapshot | Citation chips render from the stored snapshot exactly as a live-streamed answer's chips would | none |
| FETCH_HISTORY_FAILS | The initial-load or scroll-triggered fetch call throws/network-errors | The panel shows its current (possibly empty) state with a small inline retry affordance for that page; the composer remains usable (this failure never disables sending new messages) | Error swallowed into a retryable UI state, not a raw exception surfaced to the user |
| CONCURRENT_SCROLL_LOAD | User scrolls to top again while an older-page fetch is already in flight | The second trigger is a no-op until the in-flight fetch settles (single fetch at a time per panel) | none |

</intent-contract>

## Code Map

- `backend/src/adapters/neon/index.ts` -- add `NeonRepository.findChatMessagesBefore(notebookId, limit, beforeMessageId?)`: `SELECT * FROM chat_messages WHERE notebook_id = $1 [AND (created_at, id) < (SELECT created_at, id FROM chat_messages WHERE id = $beforeMessageId)] ORDER BY created_at DESC, id DESC LIMIT $limit`, then `.reverse()` before returning (mirrors `findRecentChatMessages`'s DESC-then-reverse convention at lines 368-377, but adds the optional cursor). Also returns a `hasMore: boolean` (whether exactly `limit` rows were returned) alongside the page so the client can stop querying once exhausted -- return `{ messages: ChatMessage[], hasMore: boolean }`.
- `backend/src/contexts/chat/index.ts` -- add a thin `ChatService.history(notebookId, userId, before?)` method delegating to `repo.findChatMessagesBefore`, returning the same `{ messages, hasMore }` shape (ownership/auth stays in the route, mirroring `ask()`'s existing pattern of not re-checking auth itself).
- `app/api/notebooks/[id]/chat/route.ts` -- add a `GET` handler alongside the existing `POST`: auth + notebook ownership (mirrors `POST`'s existing check at the top of the file), reads an optional `?before=<messageId>` query param, calls `ChatService.history`, returns `{ messages: ChatMessageDTO[], hasMore: boolean }` as JSON (messages ordered oldest-first, ready to prepend/render directly).
- `components/notebooks/api.ts` -- add `fetchChatHistory(notebookId, before?: string): Promise<{ messages: ChatMessageDTO[], hasMore: boolean }>` calling the new `GET` route; add the `ChatMessageDTO` type (`id`, `role`, `content`, `citations?`, `createdAt`) mirroring `ChatMessage`.
- `components/chat/chat-panel.tsx` -- on mount, call `fetchChatHistory(notebookId)` (no cursor) and map the returned messages into `Turn[]` (pairing consecutive user/assistant rows the same way live turns are shaped, or rendering each row as its own turn entry if pairing proves awkward -- match whichever shape `Turn` already expects with minimal translation), replacing the initial empty `turns` state; track `hasMoreHistory` and `oldestLoadedMessageId` in state; add an `onScroll` handler on the `ChatMessageList` container that, when `scrollTop` nears `0` and `hasMoreHistory` and no fetch is already in flight, calls `fetchChatHistory(notebookId, oldestLoadedMessageId)`, prepends the mapped turns, and restores scroll offset by the height delta of the prepended content.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/adapters/neon/index.ts` -- add `findChatMessagesBefore(notebookId, limit, beforeMessageId?)` returning `{ messages, hasMore }`, cursor-paginated by `(created_at, id)` DESC-then-reversed.
- [x] `backend/src/contexts/chat/index.ts` -- add `ChatService.history(notebookId, userId, before?)` delegating to the new repo method.
- [x] `app/api/notebooks/[id]/chat/route.ts` -- add `GET` handler with auth/ownership + `?before=` query param, returning oldest-first `{ messages, hasMore }`.
- [x] `components/notebooks/api.ts` -- add `fetchChatHistory(notebookId, before?)` client call and `ChatMessageDTO` type.
- [x] `components/chat/chat-panel.tsx` -- load-on-mount replacing empty `turns` init; scroll-to-top handler loading the next older page with scroll-position preservation; retryable inline error state on fetch failure; single-in-flight-fetch guard.
- [x] Unit test edge cases from the I/O matrix at the `NeonRepository.findChatMessagesBefore`/`ChatService.history` level (initial page limited to 7, cursor pagination returns strictly older rows, `hasMore` false when fewer than `limit` rows remain, empty-history returns an empty page with `hasMore: false`).

**Acceptance Criteria:**
- Given a notebook with more than 7 persisted chat messages, when the user opens the notebook, then the chat list loads the most recent 7 and renders them oldest-first, matching what the user would have seen live.
- Given a chat panel showing a loaded page, when the user scrolls to the top and older messages remain, then the next 7 older messages load and prepend without an unbounded/infinite-scroll fetch loop and without a visible scroll jump.
- Given a historical assistant message that has a citation snapshot, when it renders, then its citation chips display using the persisted `chunkId`/`sourceId`/span data, not a fresh Qdrant lookup.
- Given the user leaves a notebook and returns later, when the notebook reopens, then the full conversation is reachable again via scrolling (paginated, not re-fed wholesale), matching pre-story appearance for content already covered by Stories 4.1-4.3.

## Design Notes

Pagination by message row (not user/assistant "exchange pair") is a deliberate simplification: `chat_messages` stores one row per message, and `HISTORY_WINDOW = 7` in `ChatService.ask()` already operates on rows, not pairs, for the model-context path. Re-deriving pair-boundaries client-side to guarantee "7 turns = 7 pairs = 14 rows" would introduce a second counting convention inconsistent with the server's existing one; this story keeps a single definition of "7" (rows) across both the context-feeding path (unchanged, already shipped) and the new history-pagination path (new).

Cursor pagination via `(created_at, id) < (subquery)` rather than plain `OFFSET` avoids the classic offset-pagination bug where a message inserted between page loads shifts every subsequent page's boundary -- chat is append-only during an active session, but a `before`-cursor is still more robust than offset math for this shape of data and costs no extra complexity given `created_at`+`id` are already indexed via `idx_chat_messages_notebook_id`.

## Verification

**Commands:**
- `npm run typecheck` -- expected: no type errors.
- `npm run build` -- expected: production build succeeds with all routes, including the new `GET /api/notebooks/[id]/chat` handler.
- `npm test` -- expected: all tests pass, including new `findChatMessagesBefore`/`ChatService.history` pagination cases.

**Manual checks (if no CLI):**
- Have a conversation with more than 7 messages in a notebook, reload the page, confirm the most recent 7 render correctly (including any citation chips).
- Scroll to the top of the chat list; confirm older messages load once, prepend without a scroll jump, and further scrolling doesn't trigger repeated fetches once history is exhausted.

## Review Triage Log

### 2026-08-11 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 4: (medium N2, low N2)
- defer: 1: (medium N1)
- reject: 8: (low N8)
- addressed_findings:
  - `[medium]` `[patch]` `loadOlderHistory` advanced its pagination cursor from the client-side-filtered `rows` (system-role messages removed) rather than the raw fetched page. When an older page consisted entirely of system-role rows, `rows.length` was `0` and the cursor never advanced, so every subsequent scroll-to-top re-issued an identical request forever, violating the spec's "no repeated fetches once exhausted" requirement. Fixed: advance `oldestLoadedId` from the raw `res.messages[0].id` whenever any messages were returned, independent of the client-side role filter.
  - `[medium]` `[patch]` `loadInitialHistory` replaced `turns` wholesale (`setTurns(rows.map(dtoToTurn))`) when its fetch resolved. If a user sent a message before the initial history fetch settled, the optimistic turn from that send would be silently wiped out the moment history loaded. Fixed: prepend historical rows ahead of whatever is already in `turns` instead of replacing, matching the same prepend pattern already used by `loadOlderHistory`.
  - `[low]` `[patch]` The spec's own task list called for unit test coverage at both the `NeonRepository.findChatMessagesBefore` level (delivered) and the `ChatService.history` level (missing). Fixed: added a `HISTORY` test in `chat-service.test.ts` asserting `history()` delegates to `repo.findChatMessagesBefore` with `HISTORY_WINDOW` and the given cursor and returns its result verbatim.
  - `[low]` `[patch]` No test verified the cursor subquery in `findChatMessagesBefore` is itself scoped by `notebook_id` (only the outer query's scoping was implicitly exercised). Fixed: added a test asserting the cursor-lookup SQL includes `AND notebook_id = $1`, so a cursor id from a different notebook resolves to no rows rather than silently leaking that notebook's ordering.
- Deferred to `deferred-work.md`: no `AbortController`/reset-on-`notebookId`-change handling in `ChatPanel`'s history-loading effects -- a pre-existing gap (`turns` was never reset on `notebookId` prop changes even before this story) that this story's mount-once load semantics makes load-bearing for the first time; reachability depends on unverified Next.js App Router remount behavior for `/notebook/[id]` navigation, so flagged for confirmation rather than fixed blind.
- Rejected as inapplicable, unreachable, or consistent with existing convention: an invalid/foreign `beforeMessageId` degrading safely to an empty page rather than erroring (the client only ever sends cursors it received from its own prior fetch, so this path is not reachable through normal usage, and the outer query's `notebook_id` scoping already prevents any cross-tenant row leakage regardless); message-level (as opposed to notebook-level) ownership checks on the cursor id (this app has no shared-notebook/multi-user-per-notebook concept -- notebooks are single-owner, already enforced by the route); the `GET` handler leaking raw error text on a 500 (identical to the existing `POST` handler's `err instanceof Error ? err.message : ...` convention in the same file, not a new risk); `dtoToTurn` setting `sourceMessage` to the assistant's own content for historical assistant rows (the retry and fetch-on-refusal affordances that read `sourceMessage` are both gated on `turn.status === 'failed'` / `turn.refusal`, neither of which a historical turn ever has, so this is unreachable); an empty-string `before` query param being treated as a real cursor (the route uses `??`, not `||`, and the repo's own `if (beforeMessageId)` truthiness check already treats `''` as "no cursor" -- confirmed correct on inspection); scroll-restoration math being wrong if the container unmounts mid-flight (guarded by the existing `if (!container) return` check); a visually-short page when system-role rows are filtered out client-side (acceptable per the spec, which bounds history to "up to 7" rows fetched, not a guaranteed 7 rendered); magic-number duplication between `HISTORY_WINDOW` and a hardcoded "7" in an `api.ts` comment (cosmetic, no behavioral risk).

## Auto Run Result

Status: done

**Summary:** Implemented Story 4.5 end-to-end: a cursor-paginated `NeonRepository.findChatMessagesBefore` (most-recent-7 with no cursor, next-older-7 given a `before` message id, scoped by `notebook_id` at both the outer query and the cursor-resolution subquery), a thin `ChatService.history` delegation, a new `GET /api/notebooks/[id]/chat` route, and `ChatPanel` wiring for load-on-mount plus scroll-to-top pagination with scroll-position preservation, replacing the previously always-empty `turns` initial state. Historical citation chips render directly from each assistant row's persisted `citations` JSONB snapshot, with no new persistence needed. Two real bugs surfaced by adversarial review were fixed during this pass: a stuck-pagination-cursor bug when an older page consisted entirely of filtered-out system-role rows, and a wholesale-`setTurns`-replace race that could wipe out an in-flight optimistic send if it landed before the initial history fetch resolved.

**Files changed:**
- `backend/src/adapters/neon/index.ts` -- new `findChatMessagesBefore` cursor-paginated repo method.
- `backend/src/contexts/chat/index.ts` -- new `ChatService.history` delegation.
- `app/api/notebooks/[id]/chat/route.ts` -- new `GET` handler (auth/ownership + `?before=` cursor).
- `components/notebooks/api.ts` -- new `fetchChatHistory` client call and `ChatMessageDTO` type.
- `components/chat/chat-panel.tsx` -- load-on-mount, scroll-to-top older-page loading with scroll-position preservation, retryable inline history-fetch error state, single-in-flight-fetch guard; two review-driven fixes (cursor-advancement-on-filtered-page, prepend-not-replace on initial load).
- `backend/src/contexts/chat/__tests__/chat-service.test.ts` -- added `HISTORY` delegation test.
- `backend/src/adapters/neon/__tests__/neon-chat-history.test.ts` -- new, covers the full I/O matrix plus notebook-scoping of the cursor subquery.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- marked 4-4 done (was mid-flight when this story's investigation began).

**Review findings breakdown:** 4 patches applied (2 medium: stuck pagination cursor on all-system-message pages, initial-load replace-vs-prepend race; 2 low: missing `ChatService.history` test, missing cursor-notebook-scoping test), 1 deferred (unverified notebook-switch remount behavior/no abort-on-notebookId-change), 8 rejected (unreachable, inapplicable to this app's data model, or consistent with pre-existing convention).

**Verification:** `npm run typecheck` -- pass. `npm run build` -- pass, `GET /api/notebooks/[id]/chat` served by the same route file as the existing `POST`. `npm test` -- 6 test files, 49 tests, all pass.

**Residual risks:** Whether `ChatPanel` remounts (and thus correctly reloads history) when a user navigates between two notebooks without a full page reload was not verified against this app's actual Next.js App Router navigation behavior -- tracked in `deferred-work.md` for follow-up confirmation; if it does not remount, notebook switches would show stale or empty history until Story-4.5-follow-up work adds an explicit `notebookId`-change reset/abort.
