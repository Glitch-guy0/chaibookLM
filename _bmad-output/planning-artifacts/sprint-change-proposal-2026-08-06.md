# Sprint Change Proposal — Chunk Data Authority, shikigami Coupling, backend/ Structure

**Date:** 2026-08-06
**Triggered by:** Architecture coaching review (chaibookLM v0.1 spine) — stakeholder overrides
**Status:** Proposed
**Change scope:** Major (architecture + planning-artifact correction)

---

## 1. Issue Summary

### 1.1 Problem statement

During the architecture spine session for chaibookLM v0.1, three load-bearing decisions were made that override the previously assumed architecture anchors:

1. **Chunk data authority.** The earlier lean treated Neon as the system of record for chunk metadata with Qdrant as a derived, rebuildable index. The approved decision: **Qdrant is the single system of record for Chunks** — vector and chunk metadata (origin source, span/offset, position) stored together. Neon stores only **user + resource working metadata** (notebooks, source records/status, resource limits, chat) and **no chunk-level data**.
2. **Chunk recovery policy.** Qdrant loss is **not** rebuilt by replaying ingestion. The approved recovery: delete the affected users' resource files from Filebase and surface an error to those users.
3. **shikigami coupling.** The shikigami agent SDK is **tightly coupled** into the application by approved decision — it is **not** behind a port. Any SDK modification (templates, new behavior) requires a detailed change-request document and explicit approval before implementation.

A fourth, structural decision: **`backend/` is a separate top-level tree** (not nested inside the Next.js app) while remaining a single-deployable modular monolith — so it can be extracted into its own service later without a structural refactor.

### 1.2 Context

Discovered during architecture coaching (Winston, 2026-08-06), before any epics or stories existed. No code written; this is a planning-artifact correction.

### 1.3 Evidence

Stakeholder (owner) explicit decision recorded in the architecture run memlog (`_bmad-output/planning-artifacts/architecture/architecture-chaibookLM-2026-08-06/.memlog.md`).

---

## 2. Impact Analysis

| Artifact | Conflict | Change needed |
|---|---|---|
| PRD `prd.md` | FR-5/FR-9 do not bind the persistence store (left to architecture) | **None** |
| PRD `addendum.md` | Architecture anchors + dependency map assumed Neon as metadata home, Qdrant as vector-only | **Updated** — chunk-authority, recovery, coupling anchors; monolith anchor; dependency-map rows |
| `tech-stack.md` | Vector/Relational DB rows, modular-monolith bullet, no data-authority statement | **Updated** — rows, structure bullet, shikigami-coupling + chunk-authority bullets |
| Architecture spine (in progress) | My "Neon = system of record, Qdrant = derived" lean | **Captured as ADs** in memlog → distilled into spine |
| UX design | FR-8 span/offset highlight reads metadata wherever it lives | **None** (edge case: Qdrant-loss error surface noted for architecture, not UX) |
| Epics/stories | None exist yet | N/A |
| Deployment/infra | Recovery policy affects Filebase/Qdrant operations procedures | **Documented** in spine operational envelope |

**Technical impact:** Single-writer rule for chunks moves to the ingestion context writing to Qdrant (metadata + vector atomically). Neon schema shrinks (no chunk tables). No rebuild path for Qdrant — backups/monitoring of Qdrant become an operational requirement.

---

## 3. Recommended Approach

**Option 1 — Direct Adjustment** (update planning docs to match the decided architecture).

- Effort: Low · Risk: Low · Timeline impact: none (pre-implementation).
- Justification: The decisions change *where* data lives and *how* loss is handled, not the product scope or the shikigami-based answer path. Adjusting the anchors now is cheap and prevents divergence when epics/stories are authored.
- Alternatives considered: Option 2 (rollback) — N/A, no code exists. Option 3 (MVP review) — not needed; MVP scope unchanged.

---

## 4. Detailed Change Proposals

### 4.1 `tech-stack.md` (applied)

- **Vector DB row** → "**System of record for Chunks** — vectors + chunk metadata (origin source, span/offset, position) stored together; separate service — cloud free tier or self-hosted; composite adapter allows more vector stores later".
- **Relational DB row** → "User + resource **working metadata only** (notebooks, source records/status, resource-limit counters, chat); **no chunk-level data**".
- **RAG runtime row** → added "**Tightly coupled by approved decision — NOT behind a port**".
- **Modular monolith bullet** → `backend/` is a **separate top-level tree**, extractable later without a structural refactor.
- **New bullets** → "Shikigami coupling" and "Chunk authority & recovery".

### 4.2 `addendum.md` (applied)

- Monolith anchor reworded for separate top-level `backend/` tree.
- New anchors: **Chunk data authority**, **Chunk recovery (approved)**, **Shikigami is tightly coupled**.
- Dependency-map rows for Vector DB / Relational DB / RAG runtime updated to match.

### 4.3 Architecture spine (in progress)

- AD — Chunk authority: Qdrant is the system of record (metadata + vector); Neon = user/resource working metadata only; only the ingestion context writes chunk rows.
- AD — Recovery policy: Qdrant loss → delete affected users' Filebase resources + surface error; no rebuild path.
- AD — shikigami tight coupling: not behind a port; SDK changes gated behind a detailed change-request + explicit approval.
- Structure note — `backend/` as a separate top-level tree.
- Operational envelope — Qdrant backup/monitoring as a standing operational requirement (loss is user-data-destroying by policy).

### 4.4 Docs with no change required

- `prd.md` (FR-5/FR-9 leave store choice to architecture).
- UX design (span highlight reads metadata wherever it lives).

---

## 5. Implementation Handoff

**Scope classification: Major** (fundamental architectural decision; planning-artifact updates + process gate).

| Recipient | Responsibility | Deliverables |
|---|---|---|
| **Product Manager** (John, `bmad-agent-pm`) | Review PRD implications of chunk recovery (user-facing error, data-loss policy) and confirm `addendum.md`/`prd.md` alignment; PRD remains store-agnostic where intended | Confirmed/amended PRD + addendum |
| **Business Analyst** (Mary, `bmad-agent-analyst`) | Verify the brief/positioning is unaffected by the data-authority change; note the Qdrant-loss recovery as a product-risk if warranted | Brief review note |
| **Architect** (Winston) | Distill the three ADs + structure note + operational envelope into the spine; document shikigami SDK change-request gate | `ARCHITECTURE-SPINE.md` |

**Success criteria:** `tech-stack.md` + `addendum.md` reflect the decisions; spine ADs carry Binds/Prevents/Rule; no planning artifact still assumes Neon-as-chunk-authority or Qdrant-rebuild-by-replay.

**Next steps:** 1) Route to Product Manager + Analyst. 2) Resume architecture coaching → distill spine. 3) Later: epics/stories (bmad-create-epics-and-stories) inherit the corrected anchors.
