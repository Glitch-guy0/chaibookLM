---
title: 'Story 3.5: Chat Prompt Usage Operational Telemetry'
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

**Problem:** Operators need operational visibility into chat prompt usage, completion tokens, latency, and credit expenditures without storing user prompt text or response text, introducing < 15ms overhead and rolling up into daily aggregate tables.
**Approach:**
- Create `telemetry_chat_prompts` table in Neon.
- Implement non-blocking `recordChatTelemetry` method on `NeonRepository` capturing `promptLength`, `completionTokens`, `latencyMs`, and `creditCost` without user text.
- Invoke `recordChatTelemetry` upon response stream termination.
- Roll up prompt telemetry nightly in `aggregateDailyTelemetry` into `telemetry_daily_aggregates`.

## Boundaries & Constraints

**Always:**
- Strictly log operational metrics: prompt character length, completion tokens, latency ms, credit cost.
- Asynchronous non-blocking writes adding < 15ms overhead.
- Roll up daily totals in `telemetry_daily_aggregates`.

**Never:**
- Never store raw prompt or response text in telemetry tables.
- Never block stream closing on telemetry DB writes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Stream Complete | Chat stream completes | Asynchronous write to `telemetry_chat_prompts` | Catches and suppresses DB write errors |
| No Raw Text | Query with sensitive content | Only character count logged (`prompt_length`), zero prompt text | Hard schema barrier |
| Nightly Rollup | `aggregateDailyTelemetry` runs | Sums queries, prompt characters, completion tokens, credits spent | Updates `telemetry_daily_aggregates` |

</intent-contract>

## Code Map

- `backend/src/adapters/neon/index.ts` -- DDL for `telemetry_chat_prompts`, `recordChatTelemetry` method, and daily aggregation rollup.
- `app/api/chat/route.ts` -- Triggers telemetry recording on stream close.
- `app/api/notebooks/[id]/chat/route.ts` -- Triggers telemetry recording on stream close.
- `backend/src/adapters/neon/__tests__/chat-telemetry.test.ts` -- Vitest unit tests for prompt telemetry.

## Tasks & Acceptance

**Execution:**
- [x] Add `telemetry_chat_prompts` table and aggregate columns to Neon schema.
- [x] Implement non-blocking `recordChatTelemetry` in `NeonRepository`.
- [x] Update `aggregateDailyTelemetry` to rollup chat metrics.
- [x] Wire non-blocking telemetry writes into chat streaming routes.
- [x] Verify with unit tests in `backend/src/adapters/neon/__tests__/chat-telemetry.test.ts`.

## Auto Run Result

- Status: done
- Chat prompt operational telemetry implemented and verified.
- Zero raw prompt or response text recorded, < 15ms overhead verified.
- Verified via `backend/src/adapters/neon/__tests__/chat-telemetry.test.ts`.
