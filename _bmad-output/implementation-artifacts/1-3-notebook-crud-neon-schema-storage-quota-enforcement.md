---
title: 'Story 1.3: Notebook CRUD, Neon Schema & Storage Quota Enforcement'
type: 'feature'
created: '2026-09-07'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '_bmad-output/planning-artifacts/prds/prd-contextual-v1-2026-09-05/prd.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-Contextual-2026-09-06/ARCHITECTURE-SPINE.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Users need to organize research into discrete notebooks with persistent storage in Neon, while the system enforces a strict 10-notebook storage quota per user and provides full cascading delete.

**Approach:** Implement `NotebookService` and `/api/notebooks` REST endpoints backed by Neon DB, enforcing the 10-notebook limit with HTTP 422 (`NOTEBOOK_CAP_EXCEEDED`), disabling UI create triggers when at capacity, and supporting single and bulk deletion with counter reconciliation.

## Boundaries & Constraints

**Always:**
- Max 10 active notebooks per user. Rejection returns HTTP 422 with message `"Notebook limit reached (max 10 notebooks per user)"`.
- Dashboard renders notebooks in a responsive 3-column grid with creation date, source count, and meatball actions.
- Deletion removes notebook and cascades its sources and chat history in Neon.
- `+ New Notebook` button is disabled when `notebooks.length >= 10`.

**Never:**
- Never allow a user to create an 11th notebook.
- Never delete or modify another user's notebook.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Create Notebook (<10 existing) | POST `/api/notebooks` `{ title: "RAG Study" }` | HTTP 201 Created with serialized notebook | Title validation rejects empty with 400 |
| Create Notebook (>=10 existing) | POST `/api/notebooks` when count is 10 | HTTP 422 Unprocessable Entity with error message | `NOTEBOOK_CAP_EXCEEDED` error payload |
| Delete Notebook | DELETE `/api/notebooks/[id]` | HTTP 200 `{ deleted: true }` and counter decremented | 404 if missing or unauthorized |
| UI Cap Lock | User has 10 notebooks in dashboard | `+ New Notebook` disabled with tooltip guidance | Prevents extraneous API mutations |

</intent-contract>

## Code Map

- `backend/src/contexts/notebooks/index.ts` -- NotebookService handling CRUD and quota checks.
- `app/api/notebooks/route.ts` -- GET / POST handlers returning 422 on quota overflow.
- `app/api/notebooks/[id]/route.ts` -- GET / PATCH / DELETE handlers with owner checks.
- `components/notebooks/notebook-grid.tsx` -- 3-column grid, delete dialogs, and disabled cap button.
- `backend/src/contexts/notebooks/__tests__/notebook-service.test.ts` -- Unit tests for service and quota cap.

## Tasks & Acceptance

**Execution:**
- `app/api/notebooks/route.ts` -- align error code 422 and exact error message.
- `components/notebooks/notebook-grid.tsx` -- disable `+ New Notebook` button and card when count reaches 10.
- `backend/src/contexts/notebooks/__tests__/notebook-service.test.ts` -- verify CRUD operations and quota enforcement.

**Acceptance Criteria:**
- Given an authenticated user on `/dashboard`
- When the user clicks `+ New Notebook` and enters a title
- Then a new record is created in the Neon `notebooks` table with status `active` and returned via `POST /api/notebooks`
- And the notebook appears in the 3-column dashboard grid with title, creation date, source count (`0 sources`), and meatball menu (Rename, Delete)
- And if the user already has 10 active notebooks, the `+ New Notebook` button is disabled and `POST /api/notebooks` returns HTTP 422 with message `"Notebook limit reached (max 10 notebooks per user)"`
- And clicking `Delete` removes the notebook record and triggers a cascading purge of its metadata.

## Verification

**Commands:**
- `npm test -- backend/src/contexts/notebooks/__tests__/notebook-service.test.ts` -- expected: all tests pass.
- `npm run typecheck` -- expected: zero TypeScript errors.
