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
