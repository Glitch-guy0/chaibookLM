---
title: 'Story 1.2: Clerk Authentication & Protected Session Routing'
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

**Problem:** Research workspaces and API endpoints must enforce user-level tenancy and session boundaries so unauthenticated users cannot access private notebooks.

**Approach:** Leverage Next.js App Router middleware with Clerk session authentication (`clerkMiddleware`), protecting `/dashboard(.*)`, `/notebook(.*)`, and `/api(.*)` routes while presenting the user avatar and sign-out controls in the header.

## Boundaries & Constraints

**Always:**
- Redirect unauthenticated requests to `/dashboard` or `/notebook/[id]` to `/sign-in`.
- Protect all non-public API endpoints, extracting and validating `userId`.
- Top navigation bar must present `<UserButton afterSignOutUrl="/sign-in" />` and theme toggle.

**Never:**
- Never leak data across user IDs.
- Never allow unauthenticated callers to execute notebook CRUD or chat queries.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Unauthenticated Page Access | GET `/dashboard` without session token | Redirect (307) to `/sign-in` | Handled by middleware / layout guard |
| Unauthenticated API Access | POST `/api/notebooks` without session | HTTP 401 Unauthorized (`UNAUTHORIZED`) | Structured JSON error response |
| Authenticated Dashboard | GET `/dashboard` with valid session | Renders dashboard with UserButton and notebooks | Valid user session established |
| Direct Notebook URL | GET `/notebook/[id]` | Redirects to `/dashboard/notebook/[id]` | Maintained within protected subtree |

</intent-contract>

## Code Map

- `app/middleware.ts` -- Route matcher protecting non-public paths.
- `app/dashboard/layout.tsx` -- Protected shell with session validation and Clerk UserButton.
- `app/notebook/[id]/page.tsx` -- Direct route handler delegating to dashboard workspace.
- `app/middleware.test.ts` -- Tests for route protection logic.

## Tasks & Acceptance

**Execution:**
- `app/middleware.ts` -- verify route matcher and auth.protect() integration.
- `app/dashboard/layout.tsx` -- ensure dynamic rendering and authentication guard.
- `app/notebook/[id]/page.tsx` -- provide route alias for `/notebook/[id]`.
- `app/middleware.test.ts` -- test protected vs public routing logic.

**Acceptance Criteria:**
- Given an unauthenticated user attempting to access `/dashboard` or `/notebook/[id]`
- When the request hits Next.js middleware
- Then the user is redirected to the Clerk sign-in page
- And once authenticated, the user is redirected to `/dashboard` with session JWT verified
- And the top navigation bar displays the user avatar and sign-out action
- And all subsequent API requests pass the verified `userId` to domain contexts.

## Verification

**Commands:**
- `npm test -- app/middleware.test.ts` -- expected: all route tests pass.
- `npm run typecheck` -- expected: zero TypeScript errors.
