# Architecture & Diagram Index

This catalog is the single entry point for all architectural documentation, diagrams, and decisions in this project.

## 1. System Overview (C4 Hierarchy)

| Level | Diagram | Description | Status |
|---|---|---|---|
| Level 1: System Context | [System Context](file:///docs/c4/system-context.mmd) | Users, System Boundaries, and External Systems | Verified |
| Level 2: Containers | [Containers](file:///docs/c4/containers.mmd) | Deployable Units, Services, Databases, Queues | Verified |
| Level 3: Components | [Core Components](file:///docs/c4/components/core.mmd) | Internal architecture of core container | Verified |
| Level 4: Code | [Domain Models](file:///docs/c4/code/domain.mmd) | Key domain types and relationships | Verified |

---

## 2. Feature & Behavioral Flows

| Flow Name | Diagram | Type | Primary Service |
|---|---|---|---|
| Example Request Flow | [Sequence Flow](file:///docs/flows/sequence-example.mmd) | Sequence | API Server |
| Lifecycle State Flow | [State Flow](file:///docs/flows/state-example.mmd) | State Diagram | Order Worker |

---

## 3. Third-Party Integrations

| Provider | Integration Diagram | Adapter Location | Status |
|---|---|---|---|
| Example Provider | [Integration](file:///docs/integrations/example.mmd) | `src/adapters/example` | Active |

---

## 4. Architecture Decision Records (ADR)

| ADR ID | Decision Title | Status | Affected Diagram |
|---|---|---|---|
| [ADR-001](file:///docs/decisions/ADR-001-example.md) | Initial Architecture & C4 Adoption | Accepted | `docs/c4/containers.mmd` |

---

## 5. Source of Truth Matrix

| Concern | Authoritative Source |
|---|---|
| System relationships & boundaries | Approved Mermaid diagrams (`docs/c4/`) |
| Feature execution & flow | Sequence/State diagrams + Source Code (`docs/flows/`) |
| Exact implementation logic | Source Code |
| Dependencies & library versions | Package manifests (`package.json`, `Cargo.toml`, `pyproject.toml`) |
| Architectural rationale & trade-offs | Linked ADRs (`docs/decisions/`) |
