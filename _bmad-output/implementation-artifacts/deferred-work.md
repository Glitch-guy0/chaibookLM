# Deferred Work

- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: NeonRepository delete/rename are not user-scoped (TOCTOU defense-in-depth); ownership enforced only at the route/service layer.
  evidence: `deleteNotebook`/`renameNotebook` issue `DELETE/UPDATE ... WHERE id = $1` with no `user_id` predicate; a re-pointed id between check and repo call could bypass scoping.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: `NotebookService.create` calls `createUser(userId, '')`, which clobbers the user's email via `ON CONFLICT ... DO UPDATE SET email = EXCLUDED.email`.
  evidence: Pre-existing in Epic 1; every notebook create overwrites a real user's email with an empty string.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: Limits counters can only reconcile downward and `decrementCounter`/`reconcileCounter` silently no-op when no counter row exists.
  evidence: `reconcileCounter` sets `count = $3` unconditionally with no row guard; a stale-low counter can let a user exceed the persisted cap.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: GET /api/notebooks is destructive (prunes expired rows) and prunes per-notebook with N+1 queries on every dashboard load.
  evidence: Lazy TTL prune per AD-11 is by design, but the per-id delete loop and re-fetch add N+1 cost on GET.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: Denormalized `notebooks.source_count` is never maintained on any delete path.
  evidence: `source_count` column exists but no delete updates it; sources are added in Epic 3, at which point it will be wrong.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: No title-length cap on create or rename.
  evidence: A client can store arbitrarily long titles; rendered with `break-words`, so cosmetic but unbounded.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: POST create does not prune expired notebooks before the cap check, so expired-but-unpruned rows can block creation with 409.
  evidence: Pruning runs only on GET; a create landing between a GET and expiry can see a false cap.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-organize-your-research-notebooks.md`
  summary: `getBackend` throws an unhandled 500 when `DATABASE_URL` is absent.
  evidence: Composition root throws on missing env rather than a graceful error; acceptable but not graceful.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-bring-and-index-your-sources.md`
  summary: The per-notebook source cap check is a non-atomic read-then-compare (`countSourcesByNotebook`), unlike the atomic per-user counter.
  evidence: `LimitsService.checkSourceCap` reads a live COUNT then compares, with an explicit comment noting no separate counter is used; two concurrent creates near the cap can both pass and exceed `maxSourcesPerNotebook`. Fixing requires adding a `sources_per_notebook` atomic counter akin to `sources_per_user`.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-bring-and-index-your-sources.md`
  summary: No recovery path for a source stuck in `processing` if the serverless function is killed mid-ingest.
  evidence: `void this.indexer.index(source.id).catch(() => {})` is fire-and-forget with no cron/worker sweep to retry or fail stuck sources; the UI shows an indefinite "Indexing" spinner with no recourse but delete-and-recreate.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-bring-and-index-your-sources.md`
  summary: `SourceService.create` swallows all `createUser`/`storage.put` errors identically to expected "already exists"/"unconfigured" cases, hiding genuine DB or storage failures.
  evidence: Both are wrapped in bare `.catch(() => {})`/`try { } catch { }` with no error-type discrimination; a real DB outage on `createUser` is indistinguishable from the idempotent no-op case.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-bring-and-index-your-sources.md`
  summary: No outbound timeouts on any adapter fetch call (Embeddings, Filebase, Qdrant, Jina reader).
  evidence: None of the four adapters use `AbortController`/timeout; a hung upstream blocks ingestion until the platform's own function timeout fires with no graceful "ingestion failed: timeout" message.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-bring-and-index-your-sources.md`
  summary: The 409 size-limit and count-limit rejections share the same `SOURCE_CAP_EXCEEDED` error code, so the client can't distinguish them to tailor messaging.
  evidence: `CreateSourceResult`'s `ok: false` branch has no `reasonCode` field; both size-exceeded and cap-exceeded paths return the identical shape from the route.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-ask-questions-and-get-grounded-streaming-answers.md`
  summary: `findRecentChatMessages` orders by `created_at DESC` with no tiebreaker, so same-millisecond rows (rapid consecutive turns) have unstable ordering.
  evidence: `chat_messages.id` is a random UUID (not sortable by insertion order) and there is no serial/sequence column; fixing requires a schema change to add a monotonic tiebreaker column.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-ask-questions-and-get-grounded-streaming-answers.md`
  summary: The plain-text stream's `CHAT_ERROR:` sentinel and the persisted `[[failed]]` content marker are in-band string matches with no framing, so genuine model output containing either literal substring would be misclassified as an error.
  evidence: Both `components/notebooks/api.ts` and `backend/src/contexts/chat/index.ts` scan raw text for these markers; the Design Notes explicitly chose plain-text streaming over structured framing (SSE/NDJSON) for simplicity until a later story needs richer event types — fixing this properly requires that framing change.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-ask-questions-and-get-grounded-streaming-answers.md`
  summary: `QdrantAdapter.search` trusts `data.result` and each point's payload fields (`span`, `text`, etc.) without runtime validation.
  evidence: A Qdrant schema drift or corrupted payload would surface as an `undefined` leaking into a prompt or a raw exception rather than a clear "retrieval failed" error; no validation/parsing layer exists between the REST response and `ScoredChunk[]`.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-ask-questions-and-get-grounded-streaming-answers.md`
  summary: No maximum length is enforced on the chat message body before it is persisted and forwarded to the LLM.
  evidence: `app/api/notebooks/[id]/chat/route.ts` only checks that `message` is a non-empty trimmed string; an arbitrarily long message increases LLM cost/latency unbounded, mirroring the same class of gap already deferred for source size limits.
