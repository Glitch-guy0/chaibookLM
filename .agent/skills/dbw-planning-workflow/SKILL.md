---
name: "dbw-planning-workflow"
description: Design features and plan architectural changes visually in planning-artifacts/ with Architect impact analysis, trade-off evaluation, and promotion to docs/. Use when user requests to 'plan architecture', 'design feature diagram', 'plan change', or 'promote approved diagrams'.
---

# Diagram-Based Workflow — Planning

## Overview

`dbw-planning-workflow` implements **Work Sequence B: Diagram-First Architectural Planning**. When designing a feature or changing a system, the user expresses intent primarily by editing or creating a diagram.

The core principle:
> **The user thinks and communicates through diagrams. The architect translates diagrams into architecture and implementation plans. The technical writer maintains concise documentation around those diagrams. The coding agent implements the approved design.**

The workflow maintains a strict lifecycle gate:
```text
planning-artifacts/ (WIP, drafts, iterative design)
        ↓  [Review & User Approval Gate]
docs/               (Authoritative system documentation)
```

## Capabilities

### 1. Plan Architectural Change (`plan-change`) — `[PW]`
Takes a draft diagram or feature description, interprets the visual design intent with the `architect` role, maps changes to existing codebase, performs impact/cost analysis, and creates an implementation plan.

### 2. Promote Approved Diagrams (`promote-diagrams`) — `[PD]`
Promotes verified planning artifacts from `planning-artifacts/` to their canonical location in `docs/` (C4 hierarchy, flows, integrations) and updates `docs/indexes/diagram-index.md`.

## On Activation

1. Load configuration from `{project-root}/_bmad/config.yaml` (`[modules.dbw]` section):
   - `planning_artifacts_folder` (default: `{project-root}/planning-artifacts`)
   - `docs_folder` (default: `{project-root}/docs`)
   - `adr_folder` (default: `{project-root}/docs/decisions`)
   - `diagram_index` (default: `{project-root}/docs/indexes/diagram-index.md`)
2. Parse user input:
   - If a planning diagram path is passed (e.g. `planning-artifacts/c4/containers.mmd`), perform impact analysis on that diagram diff.
   - If a feature concept is passed, scaffold initial draft diagrams in `planning-artifacts/`.
   - If promotion is requested, route to `promote-diagrams`.

## Planning Loop (Work Sequence B)

Follow this structured 10-step sequence:

```text
1. Inspect existing docs/ and identify relevant baseline diagrams
        ↓
2. User creates or modifies diagram in planning-artifacts/
        ↓
3. Architect interprets semantic design intent from diagram diff
        ↓
4. Architect maps proposed design to current codebase & boundary rules
        ↓
5. Identify affected modules, services, databases, and integrations
        ↓
6. Identify key decisions, cost drivers (infrastructure/vendor/ops), & trade-offs
        ↓
7. Produce structured Implementation Plan with verification strategy
        ↓
8. User reviews / modifies diagram or approves plan [APPROVAL GATE]
        ↓
9. Coding agent executes implementation in codebase
        ↓
10. Promote approved diagrams & ADRs into docs/ and update diagram-index.md
```

## Architect & Technical Writer Responsibilities

- **`architect`**:
  * Reads current diagrams and source code before proposing modifications.
  * Identifies affected C4 levels (System Context, Containers, Components, Code).
  * Evaluates boundary rules and detects if proposed design violates existing separation of concerns.
  * Flags new dependencies, third-party integrations, or infrastructure cost drivers.
  * Drafts the technical implementation plan.

- **`technical-writer`**:
  * Drafts companion ADRs in `docs/decisions/` capturing rationale, alternatives, and cost drivers.
  * Ensures concise supporting notes (no repeating boxes and arrows in prose).
  * Updates the master `docs/indexes/diagram-index.md`.

## Diagram Lifecycle States

Every diagram in the planning pipeline carries an explicit status:
- **`DRAFT`**: Work in progress in `planning-artifacts/`. Not authoritative.
- **`REVIEW`**: Ready for user / team architectural review.
- **`APPROVED`**: Design approved for implementation.
- **`IMPLEMENTED`**: Code changes completed by coding agent.
- **`VERIFIED`**: Tested and promoted into `docs/`.

## References & Templates

Consult the companion guides for detailed execution:
- `./references/planning-loop-guide.md` — Complete diagram-first planning protocol.
- `./references/impact-analysis-guide.md` — Mapping diagram diffs to code and boundaries.
- `./references/cost-tradeoff-guide.md` — Cost driver evaluation and trade-off formulas.
- `./references/approval-promotion-guide.md` — Rules for promoting planning artifacts to `docs/`.
- `./assets/planning-checklist-template.md` — Gatekeeper verification checklist.
