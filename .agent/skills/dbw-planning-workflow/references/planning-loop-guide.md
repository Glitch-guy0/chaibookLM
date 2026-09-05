# Planning Loop Guide — Diagram-First Interaction

This guide explains how the AI assistant and user interact during the diagram-first planning cycle.

## Core Interaction Loop

```text
User expresses design intent by editing or creating a Mermaid diagram
                             ↓
              Diagram placed in planning-artifacts/
                             ↓
                 Architect reads the diagram
                             ↓
            Architect inspects relevant source code
                             ↓
           Architect identifies semantic differences:
          - New components, containers, or external APIs
          - Changed synchronous/asynchronous flows
          - Altered domain entities or states
                             ↓
      Architect evaluates architectural trade-offs & cost factors
                             ↓
           Agent creates detailed Implementation Plan
                             ↓
        User reviews, refines diagram, or approves plan
                             ↓
               Coding agent implements changes
                             ↓
         Approved diagrams promoted from planning-artifacts/ -> docs/
```

## Rules for the Agent

1. **Do not convert diagrams to walls of text**: When the user provides a diagram, respond to the visual architecture directly.
2. **Never skip codebase verification**: Inspect the existing codebase to verify how the proposed diagram impacts actual files, classes, and configurations.
3. **Flag architectural friction early**:
   - If the diagram introduces circular dependencies, warn the user immediately.
   - If a new external integration lacks an adapter layer, suggest the adapter boundary.
   - If synchronous calls are proposed across distributed containers, discuss latency and failure modes.
4. **Iterative refinement**: If the user modifies the diagram in `planning-artifacts/`, re-evaluate the impact incrementally without discarding unchanged findings.
