# Diagram Selection Guide — One Diagram = One Question

Every diagram maintained in the Diagram-Based Workflow must have **one clear purpose**. Never create a single mega-diagram that attempts to answer multiple architectural questions at once.

## Selection Matrix

| Question Being Answered | Recommended Diagram Type | Canonical Location |
|---|---|---|
| Who touches the system and what external services are connected? | C4 System Context (`C4Context`) | `docs/c4/system-context.mmd` |
| What applications, DBs, queues, and services run in production? | C4 Containers (`C4Container`) | `docs/c4/containers.mmd` |
| How is a specific service/container organized internally? | C4 Component (`C4Component`) | `docs/c4/components/<container>.mmd` |
| How do key domain classes or interfaces relate? | Class Diagram (`classDiagram`) | `docs/c4/code/<subject>.mmd` |
| What happens step-by-step during a feature or request flow? | Sequence Diagram (`sequenceDiagram`) | `docs/flows/sequence-<flow>.mmd` |
| How does a workflow branch, retry, or make decisions? | Flowchart (`flowchart TD` / `LR`) | `docs/flows/flowchart-<flow>.mmd` |
| What lifecycle states can an entity traverse? | State Diagram (`stateDiagram-v2`) | `docs/flows/state-<object>.mmd` |
| How does the application interact with a specific 3rd-party vendor? | Integration Flow (`sequenceDiagram` / `flowchart`) | `docs/integrations/<vendor>.mmd` |
| Where is the code located in the workspace? | Structure Diagram (`graph TD` / `mindmap`) | `docs/c4/code/repo-structure.mmd` |

## Golden Rules for Diagram Design

1. **Keep it focused**: If a diagram has more than 15-20 nodes, consider splitting it by container, subsystem, or workflow.
2. **Explicit labels**: Every connection line must state the protocol, data exchanged, or trigger action (e.g., `HTTPS / POST /orders`, `Pub/Sub event: OrderCreated`).
3. **No prose in diagrams**: Use boxes and notes for identity and purpose; place lengthy rationales in linked ADRs or supporting markdown docs.
4. **Standalone Mermaid files**: Always maintain the master diagram as a standalone `.mmd` file in the appropriate directory.
