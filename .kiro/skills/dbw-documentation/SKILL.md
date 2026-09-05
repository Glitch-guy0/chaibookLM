---
name: "dbw-documentation"
description: Understand and document current system architecture using Mermaid diagrams, C4 models (System Context, Containers, Components, Code), behavioral flows, and linked ADRs. Use when user requests to 'document system', 'map architecture', 'create C4 diagram', 'document feature flow', or 'verify diagram sync'.
---

# Diagram-Based Workflow — Documentation

## Overview

`dbw-documentation` implements **Work Sequence A: System Understanding & Documentation**. It enables understanding, documenting, and maintaining software architecture through **Mermaid-based diagrams**, using concise text only where text communicates what a diagram cannot.

The core principle:
> **The diagram is the primary medium between the user and the coding agent.**
> `Diagram → WHAT / WHERE / CONNECTIONS / FLOW`
> `Text    → WHY / RULES / CONSTRAINTS / TRADE-OFFS / COST`
> `Code    → ACTUAL IMPLEMENTATION`

It coordinates two internal capabilities:
- **`architect`**: Inspects codebase, maps runtime/container/component topology, evaluates boundaries, verifies sync with code.
- **`technical-writer`**: Formulates concise supporting notes, links ADRs to diagram elements, maintains indexes, and ensures source-of-truth consistency.

## Capabilities

### 1. Document System (`document-system`) — `[DS]`
Generates or updates architecture documentation answering the three core questions:
1. **How does the system work?** (System Context, Containers, Sequence, Flowchart, State)
2. **How is the code structured & integrated?** (Components, Code, Integrations, Adapters)
3. **What decisions were made and why?** (Linked ADRs, trade-offs, cost drivers)

### 2. Verify Diagram Sync (`verify-sync`) — `[VS]`
Compares existing Mermaid diagrams in `docs/` against actual source code implementation to detect drift, orphaned components, or missing integration boundaries.

## On Activation

1. Load configuration from `{project-root}/_bmad/config.yaml` (`[modules.dbw]` section) to determine:
   - `docs_folder` (default: `{project-root}/docs`)
   - `adr_folder` (default: `{project-root}/docs/decisions`)
   - `diagram_index` (default: `{project-root}/docs/indexes/diagram-index.md`)
2. Parse user arguments or intent:
   - If user provides a specific scope/service/feature: scope documentation to that area.
   - If user requests sync verification: route to `verify-sync`.
   - If unspecified: inspect existing `docs/indexes/diagram-index.md` or scan codebase for initial mapping.

## Documentation Process (Work Sequence A)

Follow this 9-step sequence:

```text
1. Inspect existing docs/ and diagram-index.md
        ↓
2. Identify target scope (system-level vs specific container/feature)
        ↓
3. Inspect source code for actual implementation reality
        ↓
4. Inspect third-party integrations and external infrastructure dependencies
        ↓
5. Select the right diagram type (One Diagram = One Question)
        ↓
6. Generate or update canonical Mermaid (.mmd) diagram in docs/
        ↓
7. Verify the diagram against actual code
        ↓
8. Record/link Architecture Decision Records (ADRs) with cost drivers
        ↓
9. Update diagram-index.md with status and references
```

## Structural Standard: C4 Model for `docs/`

All approved structural architecture documentation in `docs/` MUST follow the C4 hierarchy:

```text
docs/
├── c4/
│   ├── system-context.mmd       # Level 1: System Context (Actors, System, External Systems)
│   ├── containers.mmd           # Level 2: Containers (Deployable units, services, DBs, queues)
│   ├── components/              # Level 3: Components (Scoped per container)
│   │   └── <container>.mmd
│   └── code/                    # Level 4: Code (Selective class/module diagrams for key areas)
│       └── <subject>.mmd
│
├── flows/                       # Behavioral diagrams (what happens)
│   ├── sequence-<flow>.mmd      # Chronological interactions
│   ├── flowchart-<flow>.mmd     # Decision branching & process logic
│   └── state-<object>.mmd       # Domain lifecycle states
│
├── integrations/                # Third-party integrations
│   └── <integration>.mmd        # Boundaries, adapters, auth, fallback
│
├── decisions/                   # Architectural Decision Records
│   └── ADR-<number>-<title>.md  # Linked to diagram nodes
│
└── indexes/
    └── diagram-index.md         # Master catalog & source-of-truth matrix
```

## Diagram Selection Matrix

| Question to Answer | Recommended Diagram | Location |
|---|---|---|
| What exists and who interacts with it? | System Context (C4 L1) | `docs/c4/system-context.mmd` |
| How is the system divided into runtime units? | Containers (C4 L2) | `docs/c4/containers.mmd` |
| How is an individual service/container built? | Component (C4 L3) | `docs/c4/components/<container>.mmd` |
| How are key classes/modules structured? | Code / Class (C4 L4) | `docs/c4/code/<subject>.mmd` |
| How does a feature execute over time? | Sequence Diagram | `docs/flows/sequence-<flow>.mmd` |
| How does a complex process branch? | Flowchart | `docs/flows/flowchart-<flow>.mmd` |
| What lifecycle states does an entity traverse? | State Diagram | `docs/flows/state-<object>.mmd` |
| How do we interact with a 3rd-party vendor? | Integration Diagram | `docs/integrations/<integration>.mmd` |

## Decision & Cost Recording

For significant architectural choices, create an ADR in `docs/decisions/` linked to the diagram:
- **Problem**: What necessitated this choice?
- **Decision**: What was selected?
- **Why**: What benefits justify this?
- **Alternatives Considered**: Why were other options rejected?
- **Cost Drivers & Trade-offs**: Infrastructure cost, vendor lock-in, operational overhead, maintenance burden.
- **Revisit Trigger**: What future condition warrants reconsideration?

## References & Templates

For detailed procedures, consult:
- `./references/c4-model-guide.md` — Detailed rules for C4 diagram authoring.
- `./references/diagram-selection-guide.md` — "One Diagram = One Question" criteria.
- `./references/adr-guide.md` — Decision records, trade-offs, and cost drivers.
- `./references/sync-verification-guide.md` — Verification against code implementation.
- `./assets/` — Starter `.mmd` templates and index markdown templates.
