# Approval & Promotion Guide — From Planning to Documentation

This guide describes how to promote approved architecture diagrams from `planning-artifacts/` into authoritative `docs/`.

## Lifecycle Progression

```text
1. planning-artifacts/ (DRAFT)
       ↓  User iterates on visual design
2. planning-artifacts/ (REVIEW)
       ↓  Architect verifies impact and creates plan
3. planning-artifacts/ (APPROVED)
       ↓  User approves plan; coding agent implements
4. Code Implementation & Verification (IMPLEMENTED / VERIFIED)
       ↓  dbw-planning-workflow:promote-diagrams runs
5. docs/ (AUTHORITATIVE SYSTEM DOCUMENTATION)
```

## Promotion Rules

1. **Never promote unverified designs**: Diagrams must only be moved to `docs/` after the implementation is complete and verified against running code or automated tests.
2. **Preserve C4 and flow paths**:
   - `planning-artifacts/c4/system-context.mmd` → `docs/c4/system-context.mmd`
   - `planning-artifacts/c4/containers.mmd` → `docs/c4/containers.mmd`
   - `planning-artifacts/c4/components/<name>.mmd` → `docs/c4/components/<name>.mmd`
   - `planning-artifacts/flows/<flow>.mmd` → `docs/flows/<flow>.mmd`
   - `planning-artifacts/integrations/<vendor>.mmd` → `docs/integrations/<vendor>.mmd`
3. **Move companion ADRs**:
   - Move approved ADRs to `docs/decisions/ADR-xxx-<title>.md` and ensure status is marked `Accepted`.
4. **Update Diagram Index**:
   - Add new entries to `docs/indexes/diagram-index.md`.
   - Update verification timestamps and status badges.
5. **Clean up planning scratch**:
   - Clear or archive the completed planning draft in `planning-artifacts/`.
