---
title: 'Story 2.6: File Upload Ingestion Operational Telemetry'
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

**Problem:** Operators need visibility into file upload throughput, duration, error categories, and failure rates without adding blocking overhead to the ingestion path.
**Approach:**
- Create Neon tables `telemetry_file_uploads` and `telemetry_daily_aggregates`.
- Emit asynchronous, non-blocking telemetry writes on pipeline completion (success or failure) recording byte size, MIME type, duration ms, and error category (< 15ms overhead).
- Aggregate daily telemetry into `telemetry_daily_aggregates` at 12:00 AM IST during midnight maintenance.

## Boundaries & Constraints

**Always:**
- Telemetry writes must be asynchronous and non-blocking (< 15ms overhead).
- Record `byte_size`, `mime_type`, `duration_ms`, and `error_category` (null on success).
- Nightly aggregation at 12:00 AM IST (18:30 UTC).

**Never:**
- Telemetry failures must NEVER fail user source ingestion.
- Never block API response waiting for telemetry aggregation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Ingestion Success | 2MB PDF ingested in 350ms | Row inserted in `telemetry_file_uploads`: error_category = null | Telemetry write errors ignored |
| Ingestion Failure | Bad YouTube URL failed in 120ms | Row inserted in `telemetry_file_uploads`: error_category = "extraction_error" | Telemetry write errors ignored |
| Midnight Rollup | 12:00 AM IST maintenance | Aggregates daily counts into `telemetry_daily_aggregates` | Idempotent upsert by date |

</intent-contract>

## Code Map

- `backend/src/adapters/neon/index.ts` -- schema migration and methods `recordUploadTelemetry`, `aggregateDailyTelemetry`.
- `backend/src/contexts/ingestion/index.ts` -- emit telemetry on pipeline completion.
- `backend/src/contexts/limits/midnight-maintenance.ts` -- invoke daily aggregation.
- `backend/src/adapters/neon/__tests__/telemetry.test.ts` -- unit tests for telemetry logging and daily aggregation.

## Tasks & Acceptance

**Execution:**
- Add telemetry schema and repository methods in `backend/src/adapters/neon/index.ts`.
- Hook non-blocking telemetry logging in `backend/src/contexts/ingestion/index.ts`.
- Wire daily aggregation into `backend/src/contexts/limits/midnight-maintenance.ts`.
- Verify with unit tests in `backend/src/adapters/neon/__tests__/telemetry.test.ts`.
