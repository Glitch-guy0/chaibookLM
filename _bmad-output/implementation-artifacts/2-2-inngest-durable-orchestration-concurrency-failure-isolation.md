---
title: 'Story 2.2: Inngest Durable Orchestration, Concurrency & Failure Isolation'
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

**Problem:** Ingestion jobs are resource-heavy and must run on serverless background infrastructure with per-user concurrency controls (limit 2) and failure isolation so a transient failure does not bring down the workspace.
**Approach:** Create Inngest durable background function `fnSourceIngest` bound to `source.ingest.*` with `concurrency: { key: "event.data.userId", limit: 2 }`, exponential retry configuration (up to 3 retries), and an `onFailure` hook that updates Neon status to `failed` with descriptive `errorReason` and cleans up temporary files without disrupting sibling sources.

## Boundaries & Constraints

**Always:**
- Concurrency limit: 2 concurrent pipelines per user (`event.data.userId`).
- Retry count: 3 retries with exponential backoff for transient errors.
- `onFailure` updates Neon status to `failed` and records `errorReason`.
- Cleanup ephemeral temporary storage on failure.
- Failure in one pipeline must never corrupt or abort other pipelines or existing `ready` sources.

**Never:**
- Never block serverless request handler for background ingestion.
- Never lose error failure reason on pipeline abort.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Concurrent Ingestion | User queues 5 sources | Only 2 run concurrently; others wait in Inngest queue | Managed by Inngest concurrency queue |
| Transient Network Error | HTTP 429, 503, socket timeout | Retried up to 3 times with exponential backoff | Automatic retry |
| Permanent Extraction Failure | Corrupt payload or missing parser | onFailure hook executes: updates Neon to failed | Sets fail_reason, cleans up temp files |
| Sibling Source Isolation | Source A fails, Source B ready | Source A marked failed; Source B untouched in ready state | Full isolation per sourceId |

</intent-contract>

## Code Map

- `app/api/inngest/functions/source-ingest.ts` -- Inngest function `fnSourceIngest` with concurrency limit, retries, and `onFailure`.
- `app/api/inngest/route.ts` -- register `fnSourceIngest`.
- `backend/src/contexts/ingestion/failure-handler.ts` -- isolated failure cleanup and status update service.
- `app/api/inngest/__tests__/source-ingest.test.ts` -- unit tests for Inngest function config and failure isolation.

## Tasks & Acceptance

**Execution:**
- Implement `backend/src/contexts/ingestion/failure-handler.ts` to handle isolated failure cleanup.
- Implement `app/api/inngest/functions/source-ingest.ts` with required concurrency, retries, and failure handler.
- Register `fnSourceIngest` in `app/api/inngest/route.ts`.
- Verify with unit tests in `app/api/inngest/__tests__/source-ingest.test.ts`.
