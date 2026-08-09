---
title: 'Epic 2 — Organize Your Research Notebooks'
type: 'feature'
created: '2026-08-09'
status: 'done'
baseline_revision: a7ca35ca1a7ebe374fdea9027e3f058d9c03c2e4
final_revision: 77d3f0b7f1d857b01b47d174b1ea2ceab24bba75
review_loop_iteration: 0
followup_review_recommended: true
context: []
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** A signed-in user currently lands on a dashboard with no way to create, open, rename, delete, or bulk-delete notebooks, and the existing `NotebookService`/`NeonRepository`/`LimitsService` backend is not wired into any API route or UI. Without Epic 2 the 10-notebook cap, 1-week TTL, and workspace tabs are unreachable.

**Approach:** Wire the existing backend contexts into real API routes (`/api/notebooks`, `/api/notebooks/[id]`) plus a lazy TTL prune, then build the dashboard grid (create/rename/delete/bulk-delete with confirmation and cap warning) and a notebook workspace page with a real tablist (Sources | Chat | Showcase) and empty states. All client data flows through TanStack Query.

## Boundaries & Constraints

**Always:**
- Client components never call `fetch` directly; all data access is via TanStack Query mutations/queries to the new API routes.
- Every mutation and query route must verify Clerk auth and scope by `userId`; never return another user's records.
- All backend logic goes through the existing owning contexts (`NotebookService`, `LimitsService`); adapters are only constructed at a composition root, never in domain/API code.
- Cap check-and-increment stays a single transaction (reuse existing `LimitsService`); delete/TTL reconcile the notebook counter exactly once (never double-bump).
- Every interactive element has a unique `data-debug` name; destructive actions open a focus-trapped confirmation dialog; notebook cards and workspace honor neo-brutalist tokens (2px borders, offset shadows, `font-display`/`font-sans`/`font-mono`) and are fully responsive to 320px.
- Empty or whitespace-only names rejected inline for both create and rename; rename preserves the previous name on reject.

**Block If:**
- If chunk-level removal from Qdrant (AD-4/AD-14 cascade) cannot be left as an explicit stub hook for Epic 3 (Qdrant adapter is a stub, ingestion context is stubbed). Notebook deletion must still cascade sources + chat in Neon and reconcile counters.
- If real auth/DB env (Clerk keys, `DATABASE_URL`) is required to run the app and is unavailable. Implementation must still typecheck and build.

**Never:**
- No cron for TTL (lazy prune on dashboard load only, AD-11).
- No raw `fetch` in client components; no constructing `NeonRepository`/`NotebookService` inside route files repeatedly (composition root / singleton).
- No notebook rail or side panel in the workspace — exactly three tabs.
- No writing chunks to Neon or re-implementing the ingestion context; Epic 3 owns that.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_CREATE | Valid title, under cap | 201 + created Notebook (TTL computed) | none |
| CAP_EXCEEDED | 10 notebooks already exist | 409 with message listing cap (10) + current count | inline/state cap warning on client |
| INVALID_NAME | Empty / whitespace title | reject, no DB write | inline validation, 400 if server-reached |
| HAPPY_RENAME | Valid title on owned notebook | 200 + updated Notebook | none |
| RENAME_NOT_FOUND | id not owned / missing | 404 | client shows stale card removed via refetch |
| HAPPY_DELETE | Owned notebook | 200 + `{deleted:true}`, counter reconciles once | none |
| BULK_DELETE | Multiple owned ids | 200 + `{deleted:n}`, counter reconciles to actual count | per-id ownership honored |
| TTL_PRUNE | User has expired notebook | deleted on dashboard load, `expiredRemoved` returned for notice | none |

</intent-contract>

## Code Map

- `backend/src/contexts/notebooks/index.ts` -- NotebookService; add `deleteMany(ids,userId)` and `removeExpiredForUser(userId)`.
- `backend/src/adapters/neon/index.ts` -- NeonRepository; `deleteNotebook`/`findNotebooksByUserId`/`reconcileCounter` exist; add `deleteNotebooksByIds(ids)` (or reuse loop).
- `backend/src/contexts/limits/index.ts` -- LimitsService; `getNotebookCounter`/`reconcileCounter` exist; reuse as-is.
- `app/api/helpers.ts` -- `errorResponse`, `getUserIdFromRequest`.
- `app/api/notebooks/route.ts` -- GET (list + TTL prune + expired notice) / POST (create, 409 on cap).
- `app/api/notebooks/[id]/route.ts` -- NEW: PATCH rename, DELETE single.
- `app/api/notebooks/bulk/route.ts` -- NEW: DELETE bulk.
- `app/api/lib/backend.ts` -- NEW composition root singleton (NeonRepository + LimitsService + NotebookService).
- `app/(dashboard)/page.tsx` -- becomes client NotebookDashboard wired to queries/mutations.
- `components/notebooks/` -- NEW: `notebook-card.tsx`, `notebook-grid.tsx`, `create-notebook-form.tsx`, `rename-notebook-dialog.tsx`, `delete-notebook-dialog.tsx`, `bulk-delete-bar.tsx`.
- `components/ui/tabs.tsx` -- NEW real tablist primitive (`role="tablist"`/`tab`, `aria-selected`, arrow keys).
- `app/(dashboard)/notebook/[id]/page.tsx` -- NEW workspace page: tabs + empty states + skeleton.
- `components/notebooks/workspace.tsx` -- NEW tabbed workspace with Sources/Chat/Showcase placeholders + empty states.

## Tasks & Acceptance

**Execution:**
- [x] `app/api/lib/backend.ts` -- create singleton composition root wiring NeonRepository + LimitsService + NotebookService from env; used by all notebook routes -- centralizes DI.
- [x] `backend/src/contexts/notebooks/index.ts` -- add `deleteMany(ids,userId)` verifying ownership per id, deleting, then `reconcileCounter` to actual count -- bulk-delete + exactly-once reconcile.
- [x] `backend/src/contexts/notebooks/index.ts` -- add `removeExpiredForUser(userId)` returning count of expired notebooks deleted, reconciling counter -- lazy TTL (AD-11).
- [x] `app/api/notebooks/route.ts` -- wire GET (scope by user, prune expired, return `expiredRemoved`) and POST (create; on null fetch counter and 409 with cap+count) -- real endpoints.
- [x] `app/api/notebooks/[id]/route.ts` -- PATCH rename (scoped), DELETE single (scoped, 404 if not owned) -- CRUD endpoints.
- [x] `app/api/notebooks/bulk/route.ts` -- DELETE accepts `{ids}`, scopes to user, returns deleted count -- bulk endpoint.
- [x] `components/ui/tabs.tsx` -- real tablist with arrow-key nav + `aria-selected` -- a11y requirement (UX-DR9, NFR-2).
- [x] `components/notebooks/notebook-card.tsx` -- card showing title, source count, "Expires in N days", rename/delete actions, bulk checkbox, active brand state with non-color indicator -- dashboard card (UX-DR10).
- [x] `components/notebooks/create-notebook-form.tsx` -- inline name input, inline empty reject, triggers create mutation -- story 2.1.
- [x] `components/notebooks/rename-notebook-dialog.tsx` -- focus-trapped dialog, inline reject preserving previous name -- story 2.3.
- [x] `components/notebooks/delete-notebook-dialog.tsx` -- focus-trapped confirmation; bulk-delete bar single confirmation -- story 2.4.
- [x] `components/notebooks/notebook-grid.tsx` + `app/(dashboard)/page.tsx` -- client dashboard: grid, cap warning, bulk toolbar, expired notice, empty state -- FR-1.
- [x] `app/(dashboard)/notebook/[id]/page.tsx` + `components/notebooks/workspace.tsx` -- workspace page with tabs, skeleton cold-load, empty states, "Back to notebooks" -- story 2.2.

**Acceptance Criteria:**
- Given a signed-in user on the dashboard, when they create a notebook, then it persists server-side, opens as an empty workspace, and the dashboard refetches; empty/whitespace names are rejected inline.
- Given a user at the 10-notebook cap, when they attempt an 11th create, then it is blocked and a pop-up warning shows cap (10) and current count.
- Given a notebook card, when the user renames it, then the new name persists and renders on the card; empty rename is rejected and the previous name preserved; duplicates allowed.
- Given a notebook card, when the user deletes it, then a confirmation dialog appears; confirming removes the notebook (cascading sources + chat in Neon), reconciles the counter once, and future lists exclude it.
- Given the dashboard, when the user bulk-selects notebooks, then a bulk-delete toolbar appears and deleting requires a single confirmation; counter reconciles to the actual count.
- Given a notebook expired 7+ days, when the dashboard loads, then it is auto-deleted via lazy prune and a notice announces what was removed.
- Given a notebook opened, then the workspace shows exactly Sources | Chat | Showcase tabs with real tablist semantics and arrow-key navigation, a "Back to notebooks" link, matching skeletons on cold load, and empty states ("This notebook has no sources yet." / "Ask anything about your sources."); all responsive to 320px.

## Spec Change Log

(Append-only. Empty until first review loopback.)

## Review Triage Log

### 2026-08-09 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 4
- defer: 8
- reject: 6
- addressed_findings:
  - `[high]` `[patch]` Schema migration never ran — `runMigrations()` was dead code and the new composition root did not invoke it, so a fresh `DATABASE_URL` would fail on first request. Made `getBackend()` an async promise-singleton that runs the idempotent migration once before wiring services; updated all route callers to `await getBackend()`.
  - `[medium]` `[patch]` Expired-notice could never display — the dashboard effect auto-set `dismissedExpired = expiredRemoved` on every positive load, hiding the notice before render. Introduced a `seenExpired` flag so the notice shows on first load and only hides on explicit dismiss.
  - `[medium]` `[patch]` Workspace error branch unreachable — `isLoading || !notebook` matched before `isError`, so a failed fetch rendered an endless skeleton. Reordered the ternary to check `isError` first.
  - `[medium]` `[patch]` Bulk delete unbounded — the request array was passed straight to a per-id N-query loop. Deduplicated and bounded `ids` to a max of 100, rejecting empty payloads with 400.

## Design Notes

Backend wiring pattern: a module-level singleton `getBackend()` in `app/api/lib/backend.ts` lazily constructs `NeonRepository(process.env.DATABASE_URL)` + `LimitsService(repo)` + `NotebookService(repo, limits)` once and reuses it across route invocations (Vercel serverless module cache). Routes only call `auth()` for `userId`, then delegate to the service; they never touch SQL or adapters directly.

Delete reconcile correctness: single delete uses `decrementCounter`; bulk delete and TTL prune use `reconcileCounter(userId,'notebooks', actualCount)` where `actualCount = (await findByUserId(userId)).length` after the deletes — guarantees exactly-once reconciliation and can never go negative.

TTL display: `daysLeft = Math.ceil((expiresAt - now)/86400000)`; when `daysLeft <= 0` the notebook is pruned on dashboard load, so cards only ever show positive "Expires in N days".

## Verification

**Commands:**
- `npm run typecheck` -- expected: no type errors.
- `npm run build` -- expected: production build succeeds with all routes.

**Manual checks (if no CLI):**
- Review that no client component calls `fetch`; all data goes through TanStack Query hooks.
- Confirm every interactive element carries a unique `data-debug` name and destructive dialogs trap focus.
