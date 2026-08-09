# Epic 2: Organize Your Research Notebooks — Task List

**Date:** 2026-08-09
**Status:** Complete ✅

## Story 2.1: Create a notebook ✅

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Wire NotebookService into POST /api/notebooks with title validation | `app/api/notebooks/route.ts` | ✅ |
| 2 | Return 409 with cap + count when the 10-notebook cap is hit | `app/api/notebooks/route.ts` | ✅ |
| 3 | Inline create form with empty/whitespace reject | `components/notebooks/create-notebook-form.tsx` | ✅ |
| 4 | Cap warning pop-up dialog | `components/notebooks/notebook-grid.tsx` | ✅ |

## Story 2.2: Open a notebook workspace ✅

| # | Task | Files | Status |
|---|------|-------|--------|
| 5 | Workspace page with Sources \| Chat \| Showcase tabs | `app/(dashboard)/notebook/[id]/page.tsx`, `components/notebooks/workspace.tsx` | ✅ |
| 6 | Real tablist primitive (aria-selected, arrow keys) | `components/ui/tabs.tsx` | ✅ |
| 7 | "Back to notebooks" link + cold-load skeleton + empty states | `components/notebooks/workspace.tsx` | ✅ |

## Story 2.3: Rename a notebook ✅

| # | Task | Files | Status |
|---|------|-------|--------|
| 8 | PATCH /api/notebooks/[id] with scoped 404/400 | `app/api/notebooks/[id]/route.ts` | ✅ |
| 9 | Focus-trapped rename dialog preserving previous name on reject | `components/notebooks/rename-notebook-dialog.tsx` | ✅ |

## Story 2.4: Delete and bulk-delete notebooks ✅

| # | Task | Files | Status |
|---|------|-------|--------|
| 10 | DELETE /api/notebooks/[id] (scoped 404) | `app/api/notebooks/[id]/route.ts` | ✅ |
| 11 | DELETE /api/notebooks/bulk with dedup + 100-id bound | `app/api/notebooks/bulk/route.ts` | ✅ |
| 12 | deleteMany in NotebookService (per-id ownership, exactly-once reconcile) | `backend/src/contexts/notebooks/index.ts` | ✅ |
| 13 | Focus-trapped delete/bulk-delete confirmation dialogs | `components/notebooks/delete-notebook-dialog.tsx` | ✅ |
| 14 | Bulk-select toolbar + single confirmation | `components/notebooks/bulk-delete-bar.tsx`, `notebook-grid.tsx` | ✅ |

## Story 2.5: Auto-expire notebooks after one week ✅

| # | Task | Files | Status |
|---|------|-------|--------|
| 15 | removeExpiredForUser (lazy TTL prune, reconcile once) | `backend/src/contexts/notebooks/index.ts` | ✅ |
| 16 | GET prunes expired + returns expiredRemoved | `app/api/notebooks/route.ts` | ✅ |
| 17 | "Expires in N days" card meta | `components/notebooks/notebook-card.tsx` | ✅ |
| 18 | Expired-removal notice (first-load, dismissible) | `components/notebooks/notebook-grid.tsx` | ✅ |

## Cross-Cutting ✅

| # | Task | Files | Status |
|---|------|-------|--------|
| 19 | Composition-root singleton running schema migration | `app/api/lib/backend.ts` | ✅ |
| 20 | Focus-trapped shared Dialog primitive | `components/ui/dialog.tsx` | ✅ |
| 21 | Notebook card + dashboard grid wiring | `components/notebooks/notebook-card.tsx`, `notebook-grid.tsx` | ✅ |

## Build Verification ✅

- `npm run typecheck` — ✅ Passes (0 errors)
- `npm run build` — ✅ Passes (all routes compiled)
- Review: 4 patch findings addressed (migration wiring, expired-notice display, workspace error branch, bounded bulk-delete ids); 8 deferred; 6 rejected.

## Next Steps

- **Epic 3**: Bring & Index Your Sources — ingestion pipeline, text/web sources
- **Action needed**: Set up `.env.local` with real Clerk keys, Neon connection string, and Qdrant URL; migration now runs automatically on first API request.
