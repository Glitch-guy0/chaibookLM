# Planning & Architecture Gate Checklist

Use this checklist during the planning loop before approving and implementing changes.

## 1. Visual & Semantic Clarity
- [ ] Diagram is in standalone Mermaid (`.mmd`) format under `planning-artifacts/`.
- [ ] Diagram answers **one primary question** without clutter.
- [ ] Every relationship arrow has a clear protocol/action label.
- [ ] External boundaries and third-party integrations are explicitly identified.

## 2. Codebase & Boundary Impact
- [ ] Affected C4 levels (Context, Container, Component, Code) have been mapped to specific files.
- [ ] No architectural boundaries or layering rules are violated.
- [ ] Async vs sync communication implications have been evaluated.
- [ ] Database schema or data migration requirements are documented.

## 3. Decisions, Trade-Offs & Costs
- [ ] Significant architectural choices have an accompanying draft ADR.
- [ ] Infrastructure cost impacts (compute, storage, SaaS pricing) are identified.
- [ ] Operational complexity (monitoring, failure modes, on-call) is documented.
- [ ] Revisit triggers for key decisions are defined.

## 4. Approval & Implementation
- [ ] Implementation plan created with step-by-step tasks and verification plan.
- [ ] User review and approval obtained.
- [ ] Coding agent implements changes.
- [ ] Verification tests pass.
- [ ] Artifacts promoted from `planning-artifacts/` to `docs/` and indexed.
