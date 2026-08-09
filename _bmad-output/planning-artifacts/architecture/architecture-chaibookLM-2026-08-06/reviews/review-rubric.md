# Rubric Review — ARCHITECTURE-SPINE.md (good-spine checklist)

- **Reviewer:** rubric walker (read-only research task)
- **Date:** 2026-08-09
- **Spine:** `_bmad-output/planning-artifacts/architecture/architecture-chaibookLM-2026-08-06/ARCHITECTURE-SPINE.md`
- **Sources checked:** `tech-stack.md`, `prds/prd-chaibookLM-2026-08-04/prd.md` + `addendum.md`, `shikigami-sdk.md`, `sprint-change-proposal-2026-08-06.md`, spine `.memlog.md`, prior reviews in this folder (`review-reconcile-prd.md`, `review-reconcile-stack.md`, `review-web-verify.md`).
- **Method:** mechanical pass via `bmad-architecture/scripts/lint_spine.py` (clean: 0 findings); mermaid diagrams rendered via `mmdc` (mermaid-cli 11.15.0); semantic pass per the 9-item checklist.

---

## Verdict

A strong data/retrieval spine — AD-1…AD-8 land the approved carve-outs with enforceable Rules and most `Prevents` statements hold — but it binds **10 of 14 FRs**, leaves the FR-7 approval gate and the multi-store delete cascade unbound, carries one **syntactically broken mermaid diagram**, and overstates its `binds`/Stack claims. **Conditionally good: the AD core is sound and directly reusable; the listed amendments must land before epics/stories are authored.**

---

## 1. Divergence points fixed — and missed

**Fixed (no misses for the domain core):** chunk data authority (AD-1), zero-backup recovery (AD-2), shikigami coupling gate (AD-3), single chunk writer with filtered deletes (AD-4), one embedding model both sides (AD-5), shared span-preserving chunk kernel (AD-6), validate-never-trust citation markers with structural refusal (AD-7), acceptance-run-testable retrieval params (AD-8), 7-turn history window (AD-9), single-owner atomic limits (AD-10), lazy TTL (AD-11), honest load degradation (AD-12). These are exactly the divergence points epics/stories would otherwise trip on.

**Missed divergence points:**

- **FR-7 approval gate unbound (high).** The refusal half is governed (AD-7/AD-8), but nothing prevents the shikigami `WebSearchTool` (a wired agent `Tool`) from firing mid-turn without explicit user approval, and nothing states approval-fetched sources must re-enter via `SourceIndexer` and count against limits before they join context. PRD §5's *no-unprompted-web-search* non-goal is likewise unbound — the Deferred row ("standalone search surface") is a different, narrower deferral. This is a scope-safety hole on the product's core trust property.
- **Multi-store delete cascade unbound (high).** Every delete path — FR-4 source removal, FR-1 notebook delete/bulk-delete, AD-11 TTL expiry, AD-2 recovery — must tear down across Qdrant (chunks), Filebase (raw files), Neon (rows + chat) and decrement limit counters. AD-4 binds only the chunk-side filtered delete; teardown **ordering and ownership** across the other stores (and what happens on partial failure) is bound nowhere. Stories will diverge on orphan cleanup (AD-4's own `Prevents` is only half-made-true).
- **FR-9 authorization isolation unbound (medium).** PRD's "an unauthenticated user cannot access another user's notebooks" is asserted, never bound. AD-8 scopes retrieval by `notebookId`, AD-10 scopes counts per user, but no invariant states every resource carries a `userId` and every read is authorized at the composition-root boundary.
- **Numeric limits not enumerated (medium).** 10 notebooks / 10 sources-per-notebook / 30 sources-per-user / 5MB / 1-week TTL survive only via AD-10's reference to "§6.1"; only the 5MB figure appears (as a duration-caveat input, spine:119). Two of the three per-source caps (30/user, 10/notebook) are absent entirely.
- **FR-2/FR-3 validation & failure semantics unbound (low).** Empty-text rejection, "failed" status with reason (and non-breaking of other sources), and where the 5MB size gate lives are governed nowhere.
- **SM-1/SM-2 telemetry has no structural home (low).** Bound in the AD-7 header and §6.1, but no instrumentation node in the seed and no Capability Map row; SM-3/SM-4 unreferenced.

## 2. Per-AD: does the Rule make the `Prevents` true?

Audited each AD (lines 40–110). **Every Rule is enforceable** — they are architectural invariants reviewable at code-review time — and all but three make their stated `Prevents` true:

- **AD-4 — partially.** The `Prevents` is "orphaned vectors **and divergent delete paths**". The chunk filtered-delete by `sourceId` is bound, but Filebase/Neon teardown and cross-store ordering are not (see §1). The rule is complete only for the chunk collection.
- **AD-2 — true in policy, no trigger.** "Delete affected users' resource files" requires identifying *which* users are affected, but the same AD declares **zero loss-alerting**. With no detection path the recovery procedure cannot be initiated — the Rule is unenforceable in practice. (Also lands under §7.)
- **AD-12 — true as a pattern, trigger undefined.** "When the service is under load" is never defined (queue depth? provider 429s? request-rate threshold?). Stories can pick incompatible triggers for the guard.
- Minor: AD-9 "7 turns" (pairs vs. messages) is ambiguous; AD-5's "changing the model is a deliberate re-index event" sits uneasily beside AD-2's "no re-index by replay" — distinct triggers (migration vs. loss), worth one reconciling line so a story doesn't treat AD-5's re-index as a repair path.

## 3. Deferred — can two units diverge?

**Passes, with two low caveats.** Each deferral keeps its invariant bound (AD-6 for chunking, AD-8 for retrieval params, AD-2 for backups, AD-11 for TTL, PRD for search surface). Residual notes: (a) the daily-TTL-sweep deferral's trigger ("unless stale-expired notebooks become a real problem") is unbounded with no named owner; (b) acceptance-run tuning of `minScore`/`topK` "without changing the AD's contract" has no stated approval process for when the run *does* change the numbers. Neither lets two units diverge today, but both are process, not invariant.

## 4. Named technology — verified current?

Reconciled with the prior `review-web-verify.md` (npm/registry, 2026-08-09):

- **TypeScript 5.x — outdated (medium).** npm latest is **7.0.2** (TS 7 native/Go-port; 6.x shipped earlier in 2026). The spine's own header claims "versions verified 2026-08-09" (spine:123); that claim is false for this row. If TS 5 is an intentional pin for shikigami/Next compatibility, the intent must be recorded.
- Confirmed current: Next.js 16.x (16.3.0), React 19.x (19.2.8), @tanstack/react-query 5.x (5.101.4 exact), Tailwind 4.3.x (4.3.3), Clerk, Qdrant, Neon, Filebase, QStash, react-markdown+remark-gfm (10.1.0/4.0.1), Driver.js, jina.
- **"current" rows (low).** Eight of fourteen rows say `current` with no version number under a "verified" header — the mechanical linter accepts them (non-empty), but the claim is weaker than stated.
- **@glitch-guy0/shikigami 0.1.0 (low).** Real package, exact pin correct, but zero registry adopters — single-author surface. Keep, but document pin-and-lock + a fallback plan (per prior review).
- **QStash payload vs 5MB sources (medium, design risk).** QStash bodies are capped ~1MB; the ingestion callback references "≤5MB sources" (spine:119). If a source's content is passed *in* the QStash body it will be rejected. The spine should state the job receives a reference (sourceId/key) and fetches content inside the callback.

## 5. Ratifies rather than contradicts reality?

- **Ratified cleanly:** AD-1/AD-2/AD-3 and the `backend/` top-level tree land the sprint-change-proposal's three decisions + monolith structure verbatim; rate-limit-rejection copy, Vercel Hobby duration caveat, and async-buffered streaming all match tech-stack/addendum. Strong.
- **jina-only vs cited sources (medium, doc drift).** The spine is jina-only (stack row, `JI[jina web search]` diagram, map row), which matches the *newer* `.memlog` decision — but its own cited sources of truth, `tech-stack.md:23` and `addendum.md:28`, still read "jina / duckduckgo". The spine does not contradict the decision; it contradicts two documents it cites as authoritative. Those two must be updated to jina-only.
- **Composite adapters dropped from the spine body (medium).** tech-stack + addendum decided `StorageService`/`VectorStore` are *composite* adapters (add-a-provider-without-touching-domain). The word "composite" never appears; the Design Paradigm and seed present them as plain ports+adapters. A decided structural property weakened.
- **Zero-backup vs change proposal (low).** `sprint-change-proposal-2026-08-06.md:80` proposed "Qdrant backup/monitoring as a standing operational requirement"; the memlog (the later authority) decided zero-backup for builder-only, and the spine follows the memlog. Consistent, but the proposal was never reconciled.

## 6. Capability → Architecture Map vs FR-1..FR-14

**Fails coverage (high).** The map (spine:193–207) covers FR-1…FR-9 (FR-2/3 share a row), FR-13, plus shikigami runtime and ingestion pipeline — **10 of 14**. **FR-10 (walkthrough), FR-11 (landing/reduced-motion), FR-12 (cookie consent + a11y prefs), FR-14 (dark mode)** have no map row, AD, convention, or seed node. The frontmatter `binds` (spine:11) claims all FR-1…FR-14. Binds and map materially overstate coverage; the presentation/consent/a11y surface is the silent hole. (Note FR-12 also blocks FR-14: the theme override persists via a *consented* cookie, and nothing orders consent-first behavior.)

## 7. Operational / environmental envelope

**Partially owned — one high, several silences.** Decided: dev+prod, env-var config, seed data, Vercel Hobby single deployable, QStash callback duration risk, zero-backup posture (AD-2). **But:**

- **Qdrant hosting fork is silent (high).** "cloud free tier / self-hosted" is carried from tech-stack with neither a decision nor an open-question flag, and the spine has **no Open Questions section at all** — the one fork that must be decided before ingestion stories lands (it changes latency, capacity, and the free-tier 1GB budget math against worst-case 150MB/user of chunk text).
- **Loss detection absent (high).** AD-2's recovery cannot trigger under its own zero-alerting rule (§2).
- **AD-12 load trigger undefined (medium).** (§2.)
- **Silent, unowned (low):** Neon/Filebase backup posture, staging/preview strategy (dev+prod only), observability provider beyond "structured logging", secrets manager beyond "env-driven". Acceptable for builder-only, but none is *decided* — they are just unmentioned.

## 8. Diagrams

Rendered all three via `mmdc` 11.15.0 (headless Chrome):

- **d1 (Design Paradigm flowchart, spine:27–36):** **valid**, renders.
- **d2 (Core entities erDiagram, spine:165–175):** **valid**, renders; all cardinality tokens (`||--o{`, `}o--||`, `||--||`) and quoted labels are syntactically correct.
- **d3 (Deployment & environments flowchart, spine:179–189):** **parse error (medium).** Line 6, `VCJ[ingestion callback<br/>(serverless fn)]` — **unquoted parentheses inside a node label** break the parser (`Expecting … got 'PS'`); the diagram renders as an error block in any mermaid renderer. Verified fix: quote the label → `VCJ["ingestion callback<br/>(serverless fn)"]`. Low completeness notes: d1 draws Neon separately from the adapter set that includes it; d3 never shows the callback (`VCJ`) writing back to Qdrant/Neon.

## 9. Frontmatter sanity

Fields present and coherent: `name`, `purpose: build-substrate`, `altitude: feature` (matches memlog), `paradigm` (accurately includes the shikigami carve-out), `scope`, `status: draft`, `created`/`updated`. **Issues:** `binds` overstates (claims FR-1…14; §6 shows 10/14 genuinely governed); `sources` paths are planning-artifacts-relative (fine if that is the convention) but omit `sprint-change-proposal-2026-08-06.md` — the direct authority for AD-1/2/3 — and `companions` is empty though the UX spec (`ux-designs/`) exists and is referenced by the ADs' SM-1/SM-2. Linter (placeholder/AD-id/AD-fields/version-pin checks) returns **0 findings**.

---

## Prioritized findings

**High**
1. FR-10/11/12/14 ungoverned while `binds` + Capability Map claim FR-1…14 (§1, §6).
2. FR-7 fetch-on-refusal approval gate + no-unprompted-search non-goal unbound (§1).
3. Multi-store delete cascade (source/notebook/bulk/TTL/recovery teardown) ownership & ordering unbound (§1, §2 AD-4).
4. Operational envelope: Qdrant hosting fork silent + no Open Questions section; AD-2 loss-detection path absent (§7, §2).

**Medium**
5. AD-12 "under load" trigger undefined (§2).
6. Numeric limits (10/10/30/5MB/1-week) not enumerated (§1).
7. FR-9 authorization/isolation invariant absent (§1).
8. Composite-adapter property for StorageService/VectorStore dropped from spine body (§5).
9. Spine jina-only vs its cited tech-stack.md/addendum.md still "jina / duckduckgo" (§5).
10. TypeScript 5.x stale (npm 7.0.2) under a "versions verified" header (§4).
11. QStash ~1MB body cap vs ≤5MB ingestion sources (§4).
12. Deployment mermaid diagram parse error — unquoted parens at spine:185 (§8).

**Low**
13. Eight "current" rows unversioned under "versions verified"; shikigami 0.1.0 zero-adopter risk; FR-2/FR-3 validation & failure semantics; SM telemetry home; AD-9 turn ambiguity + AD-5/AD-2 re-index reconciliation; deferral process owners; frontmatter sources/companions gaps (§2, §3, §4, §9).
