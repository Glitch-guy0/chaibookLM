---
title: 'Story 3.4: Grounded Boundary Detection, Honest Refusal & Tavily Web Search Fallback'
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

**Problem:** When user queries cannot be answered by uploaded notebook sources (chunks have similarity < 0.30 or lack relevant facts), the assistant must honestly refuse rather than hallucinating, offering an approval-gated live web search fallback via Tavily (costing 1 credit) with distinct external web citation pills (`[Web: domain.com]`), while disabling search when credits are depleted.
**Approach:**
- Detect zero chunks or max similarity < 0.30, emitting refusal signal `CHAT_REFUSAL_SENTINEL`.
- Render inline `<RefusalCard>` with warning border: `"The uploaded sources do not specify the requested information."`
- Display action card: `"Search the live web via Tavily? (Consumes 1 credit)"` with slanted button `[Search Web & Answer]`.
- Check credit balance: if credits is 0, button is disabled with credit reset notice: `"0 credits remaining. Web search disabled until midnight reset."`.
- When approved, deduct 1 credit, execute Tavily web search (top 3 results), ingest/synthesize answer, and render distinct web citation pills `[Web: domain.com]`.

## Boundaries & Constraints

**Always:**
- Render `<RefusalCard>` with yellow warning border and exact refusal copy on retrieval misses.
- Provide slanted button `[Search Web & Answer]`.
- Disable search button when credit balance is 0 with credit reset notice.
- Render web citations as distinct pills formatted as `[Web: domain.com]`.

**Never:**
- Never hallucinate answers when source material is insufficient.
- Never execute external web searches without explicit user approval.
- Never allow web searches when daily credit balance is 0.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Insufficient Context | Query with no matching chunks ≥ 0.30 | Refusal turn with `<RefusalCard>` | Clear notice, no speculation |
| Available Credits | User clicks `[Search Web & Answer]` with credits > 0 | Runs Tavily search, adds sources, and re-answers | Shows error card if Tavily fails |
| Zero Credit Lockout | User has 0 credits remaining | Button disabled, shows reset notice | Click blocked |
| Web Citation Pill | Citation contains web URL | Renders as `[Web: domain.com]` | Falls back to `[Web]` on parse failure |

</intent-contract>

## Code Map

- `components/chat/refusal-card.tsx` -- `<RefusalCard>` component with warning border, action card, and 0-credit lockout.
- `components/chat/chat-panel.tsx` -- Refusal turn rendering and Tavily approval workflow integration.
- `components/chat/citation-chip.tsx` -- Distinct `[Web: domain.com]` pill rendering for external citations.
- `components/chat/__tests__/refusal-card.test.tsx` -- Unit tests for RefusalCard component.

## Tasks & Acceptance

**Execution:**
- [x] Create `<RefusalCard>` component with warning border and action card.
- [x] Integrate 0-credit lockout with credit reset notice.
- [x] Support `[Web: domain.com]` in `CitationChip`.
- [x] Integrate `<RefusalCard>` into `ChatPanel` on refusal turns.
- [x] Verify with unit tests in `components/chat/__tests__/refusal-card.test.tsx`.

## Auto Run Result

- Status: done
- Grounded boundary detection and `<RefusalCard>` implemented and verified.
- Tavily web search approval gate and 0-credit lockout active.
- Verified via `components/chat/__tests__/refusal-card.test.tsx`.
