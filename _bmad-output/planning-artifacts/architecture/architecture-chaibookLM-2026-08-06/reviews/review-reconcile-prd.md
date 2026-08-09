# Reconciliation Review — ARCHITECTURE-SPINE.md vs PRD chaibookLM v0.1

- **Reviewer:** reconciliation reviewer (read-only research task)
- **Date:** 2026-08-09
- **Spine:** `_bmad-output/planning-artifacts/architecture/architecture-chaibookLM-2026-08-06/ARCHITECTURE-SPINE.md`
- **Source of truth:** `_bmad-output/planning-artifacts/prds/prd-chaibookLM-2026-08-04/prd.md` (+ `addendum.md`)
- **Method:** for each FR (FR-1…FR-14), non-goal (§5), success metric (SM-1…SM-4), and MVP-scope item (§6.1), determine whether the spine governs it — via an AD, a Consistency Convention, the Structural Seed, or the Capability→Architecture Map. "Governed" = the spine states an invariant, rule, or binding location that constrains implementation of the requirement.

## 1. Verdict (one line)

The spine binds the data/retrieval core (FR-1, FR-4, FR-5, FR-6, FR-8, FR-13) solidly, but **four entire FRs (FR-10, FR-11, FR-12, FR-14) and the entire presentation/a11y/consent surface never land in any AD, convention, or map row**, and several quiet behaviors (FR-2/FR-3 failure & validation states, FR-7 approval-gating, FR-9 authorization isolation, SM-4, no-unprompted-search) are dropped — while the frontmatter `binds` and Capability→Architecture Map overstate coverage.

## 2. Per-FR governance table

| FR | PRD requirement | Governed by spine? | Where (or gap) |
|---|---|---|---|
| FR-1 | Notebooks CRUD, bulk-delete, 10-notebook cap, 1-week TTL auto-delete | ✅ Governed | AD-10 (limits, cap enforcement, binds §6.1), AD-11 (lazy TTL, FR-1 wording); map row; `limits` context in seed. Note: concrete values (10 / 1 week) are not enumerated in the spine — carried only by AD-10's binding to §6.1 and by the configurable `limits` context. Acceptable but implicit. |
| FR-2 | Add text source; **empty/whitespace rejection with inline message**; markdown in Original View | ⚠️ Partial | Map row + AD-4/AD-6 govern chunk lifecycle. Markdown rendering is present via Stack (react-markdown + remark-gfm). **Empty-text validation is governed nowhere** — no AD/convention names the validation boundary or its inline-error shape. |
| FR-3 | Add web source; **unfetchable URL → "failed" status with clear reason, no breakage**; no-extractable-content → failed | ⚠️ Partial | Map row + AD-4/AD-6. Source status is storable (Neon "source records/status", AD-1), but the fetch→extract **failure semantics** (failed status, reason, non-breaking of other sources) are not bound by any AD/convention. SM-4 (ingestion success ≥80%) ungoverned. |
| FR-4 | List, inspect, remove (incl. bulk, clear-failed) | ✅ Governed | AD-4 (single writer, filtered delete on `sourceId`); map row; `sources` context. Confirmation UX is presentation-level. |
| FR-5 | Chunk + index with origin metadata, span/offset, per-notebook retrieval | ✅ Fully | AD-1, AD-5, AD-6; map row; `ingestion` context. |
| FR-6 | Grounded answers, per-sentence citations, no cross-notebook citations, markdown chat | ✅ Fully | AD-7 (marker contract), AD-8 (notebookId scoping), AD-9 (history window); map row; SM-1 bound by AD-7. |
| FR-7 | Honest refusal (structural) **+ fetch-on-refusal executed only after explicit user approval** | ⚠️ Partial | Refusal half is fully governed: AD-7 (no `chunkId` above `minScore` → zero markers) and AD-8 (`minScore`/`topK` defined, acceptance-run testable). **The approval gate is governed nowhere** — `WebSearchTool` exists (map row, Stack jina, templates) but no invariant states the tool may only be invoked after explicit user approval, or that fetched results must be re-ingested into the notebook before they join context. |
| FR-8 | Citation → Original View (live URL in Showcase; full text + span highlight) | ✅ Fully | AD-6 (span-preserving kernel "powering the FR-8 highlight"), AD-7 (CitationMapper → chips + highlight); map row; SM-2 bound by AD-7. |
| FR-9 | Clerk auth; **unauthenticated user cannot access another user's notebooks**; data survives logout; 30-source/user cap with pop-up | ⚠️ Partial | AD-1, AD-9, AD-10, map row; 30-cap bound via AD-10's binding to §6.1. **No authorization/scoping invariant** — nothing binds that every read (Qdrant `notebookId` scope, Neon queries) is also userId-scoped or that unauthenticated access is denied. Isolation is asserted by the PRD but never by an AD. |
| FR-10 | First-run product walkthrough (Driver.js), dismissible, replayable | ❌ NOT GOVERNED | Driver.js appears **only** in the Stack table (line 139). No AD, no convention, no Structural Seed node (no tour/walkthrough component), no Capability Map row. The frontmatter `binds` claims FR-10. |
| FR-11 | Public landing page; 320px+; smooth scroll + scroll animations **honor Reduced Motion** | ❌ NOT GOVERNED | Absent from the spine entirely. No AD, no map row, no seed node for the landing route. Reduced-motion-gated animation behavior (a testable PRD consequence) is ungoverned. |
| FR-12 | Cookie consent (per-category disclosure, no non-essential cookie pre-approval, accept/decline/revisit); a11y preference persistence via consented cookies | ❌ NOT GOVERNED | Absent from the spine entirely. Nothing binds consent-first behavior or the cookie→a11y-preference dependency. This also **blocks FR-14**, whose override persistence depends on consented cookies. |
| FR-13 | Rate-limit rejection: honest message, retry affordance, **scoped to AI/ingestion; already-indexed sources + browsing remain usable** | ✅ Fully | AD-12 (app-layer guard, honest message, "already-indexed sources and browsing remain usable" verbatim); error shape `{message, code}` convention with FR-13 copy; map row. Strongest coverage in the spine. |
| FR-14 | Dark mode on every surface, AA contrast, `prefers-color-scheme` default, override persisted via consented cookie | ❌ NOT GOVERNED | Absent from the spine entirely. No AD, no map row, no design-system convention (Tailwind is listed in Stack only). The dark-variant token approach lives only in the addendum dependency map, which the spine does not carry. |

**Coverage count: 9/14 genuinely governed (FR-1, FR-4, FR-5, FR-6, FR-8, FR-13 fully; FR-2, FR-3, FR-7, FR-9 partial), 4 entirely dropped (FR-10, FR-11, FR-12, FR-14).**

## 3. QUIET requirements — deep dive (things the AD structure dropped)

### 3.1 FR-10 first-run walkthrough (Driver.js) — **dropped**
Driver.js is in the Stack table but the walkthrough is not governed: no state source for "has seen tour" (dismissible + replayable implies persisted state — should live with user working metadata in Neon), no trigger location, no component in the seed. Recommend an AD or at least a Structural Seed node + a convention row.

### 3.2 FR-11 landing page + reduced-motion — **dropped**
The landing page is a real deliverable (§6.1, FR-11) with testable consequences (reduced-motion gating). The spine has no node for it. `app/` in the seed is generic. Reduced Motion is not a convention even though FR-12/FR-14 also reference it.

### 3.3 FR-12 cookie consent + accessibility preferences — **dropped**
This is a cross-cutting concern with a hard testable constraint ("no non-essential cookie before explicit approval") and a dependency the spine does not honor: FR-14's theme override is persisted via a *consented* cookie, so consent must precede it. Nothing in the spine orders or governs this. A convention row or AD is missing.

### 3.4 FR-2/FR-3 failure & validation behaviors — **partially dropped**
- Empty/whitespace text rejection (inline message): no validation invariant anywhere. AD-10 covers *limit* rejects, not content validation.
- Unfetchable URL / no-extractable-content → "failed" status with clear reason: the status field exists in Neon ("source records/status", AD-1) but the semantics — that a failed web fetch transitions status to `failed`, carries a reason, and never blocks or breaks other sources — are not bound. FR-4's "clear all failed at once" implies `failed` is a first-class, durable state; worth an invariant on the ingestion pipeline row.
- **5MB cap rejection with pop-up** (§6.1): AD-10 does "cap check-and-increment in a single Postgres transaction," but the 5MB size check happens at a different boundary (upload/queue entry, before ingestion) and is not named. Where the size gate lives is ungoverned.

### 3.5 FR-9 unauthenticated isolation + per-user cap — **partially dropped**
AD-8 scopes retrieval by `notebookId`; AD-10 scopes counts per user. But no invariant states that every resource carries a `userId` and every read is authorized against it. "An unauthenticated user cannot access another user's notebooks" is a security property the spine should state (at minimum: all Qdrant `notebookId` scoping and all Neon queries are implicitly `userId`-scoped; authorization enforced at the controller/composition-root boundary). 30-source cap is bound only by AD-10's reference to §6.1.

### 3.6 SM metrics — **weak**
- SM-1/SM-2 (citation attach + click-through telemetry): AD-7 *binds* them and §6.1 lists "Event instrumentation for SM-1/SM-2 telemetry," but the spine never says where telemetry lives — no instrumentation context/module in the seed, no convention for event names or emission points (attach → answer render; click-through → CitationMapper chip click). There is no Capability Map row for telemetry at all. Binding an SM in an AD header without a structural home is weak governance.
- SM-3 (validates FR-1): not referenced. Minor — SM-3 is behavioral, not architectural.
- SM-4 (validates FR-3, ≥80% web ingestion success): **not referenced anywhere**, consistent with FR-3's failure semantics being ungoverned.

### 3.7 FR-7 approval-gated fetch suggestion UX — **dropped from governance**
AD-7/AD-8 handle the refusal trigger, but the fetch path is ungoverned:
- The "not found in your sources" message + suggestion affordance (UX): presentation-level, but the **approval precondition** is not.
- No invariant that `WebSearchTool`/jina is invoked **only** after explicit user approval, and never unprompted.
- No statement that approval-fetched sources flow back through the *same* ingestion pipeline (QStash `SourceIndexer`) and therefore same limits (counts against 10/notebook, 30/user, 5MB) before appearing in later answers — the PRD explicitly requires they "join the notebook and appear in subsequent answers."

### 3.8 Non-goals — **scope-safe invariants not bound**
- No PDF/transcript/YouTube ingestion: only *implied* by the ingestion chain (fetch → readability → Turndown → HTML). Not stated as a constraint. Low risk but worth one line in conventions so a future story doesn't add a PDF parser silently.
- **No unprompted web search** (§5): **not bound anywhere.** The Deferred section covers *standalone search surface* (JTBD-3), which is a different thing — it does not prohibit the web-search tool from firing without user approval. The only place "approval" appears is implicitly. Given the carve-out that shikigami is tightly coupled and SDK changes need approval, an explicit "web search only on explicit user approval, never in the answer path" invariant closes a real scope-safety hole.
- No credit/rate limiting in v0.1 (§5) vs AD-12 rate-limit rejection under load: these are different mechanisms (credit gate vs load shedding) and the spine treats them correctly — no conflict.

### 3.9 Rate-limit rejection scoping (FR-13) — **correctly handled**
AD-12 explicitly states the guard sits "in front of AI/ingestion operations," that it "drops the request," and that "already-indexed sources and browsing remain usable." This matches the PRD's scoping requirement precisely. No gap. The only thinness is the "retry affordance" (UX) and where the guard sits relative to QStash queue entry.

## 4. Frontmatter `binds` vs reality

`binds: [FR-1 … FR-14]` claims all 14 FRs. Reality:
- Genuinely bound: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7 (refusal half), FR-8, FR-9, FR-13.
- Claimed but **not actually governed**: FR-10 (Stack only), FR-11 (absent), FR-12 (absent), FR-14 (absent).

The `sources` list (`prd.md`, `addendum.md`, `tech-stack.md`, `shikigami-sdk.md`) checks out — all four exist under `_bmad-output/planning-artifacts/`. The spine's Stack table also carries addendum picks (Driver.js, react-markdown, jina), so the addendum was read; its presentation/anchor layer simply wasn't distilled into ADs.

## 5. Capability → Architecture Map coverage

The map covers 12 rows: FR-1…FR-9, FR-13, shikigami runtime, ingestion pipeline. **Missing from the map entirely: FR-10, FR-11, FR-12, FR-14, and SM telemetry/event instrumentation.** So the map covers 10 of 14 FRs (FR-2/3 share one row). The stated aim "the Capability→Architecture Map covers every FR" is not met.

## 6. What the spine gets right (for the record)

- The retrieval/grounding core is excellent: Qdrant as chunk system-of-record (AD-1), zero-backup recovery decision (AD-2), single chunk writer with filtered deletes (AD-4), one embedding model both sides (AD-5), deterministic span-preserving shared chunk kernel (AD-6), validate-never-trust citation markers with structural refusal (AD-7), acceptance-run-testable retrieval params (AD-8), 7-turn history window (AD-9), atomic limit enforcement (AD-10), lazy TTL (AD-11), honest load degradation (AD-12).
- AD-12's FR-13 scoping is verbatim-correct.
- Deferred section honestly flags streaming, backups, chunk-tuning, and standalone search — good discipline.

## 7. Prioritized findings (what didn't land)

**P0 — Dropped FRs (presentation/consent/a11y surface absent from all governance):**
1. **FR-10** — walkthrough governed nowhere but a Stack line. PRD: dismissible + replayable (implies persisted "seen" state). Spine: no node, no state source, no map row.
2. **FR-11** — landing page + reduced-motion-gated smooth-scroll/animations governed nowhere. Not even a seed node.
3. **FR-12** — cookie consent (per-category disclosure, no pre-approval cookies) governed nowhere. Also blocks FR-14.
4. **FR-14** — dark mode everywhere + AA + consent-persisted override governed nowhere (Tailwind in Stack only).

**P1 — Quiet requirements dropped:**
5. **No-unprompted-web-search invariant** (§5) — not bound; only "standalone search surface" is deferred, which is a different constraint. Combined with FR-7's approval gate being ungoverned, the web-search tool has no safety invariant.
6. **FR-7 approval gate** — "fetch only after explicit user approval" + fetched sources must re-enter via the ingestion pipeline and counts before appearing in answers: ungoverned.
7. **FR-2 empty-text / FR-3 failed-status semantics + 5MB size-gate boundary** — validation and failure-state invariants missing; only limit-transaction counting is bound (AD-10).
8. **FR-9 authorization isolation** — no per-user scoping/authorization invariant; PRD's "unauthenticated user cannot access another user's notebooks" is asserted, not bound.
9. **SM telemetry** — SM-1/SM-2 named in AD-7 binds but have no structural home (no instrumentation module, no map row); SM-3 and SM-4 unreferenced. §6.1's "event instrumentation" deliverable is orphaned.

**P2 — Consistency/claims:**
10. **Frontmatter `binds` and the Capability Map overstate coverage** — FR-10/11/12/14 claimed but ungoverned; map missing 4 FRs + telemetry.
11. **Limit values unenumerated** — 10 notebooks / 10 per notebook / 30 per user / 5MB / 1-week TTL live only via AD-10's §6.1 binding; a one-line convention enumerating them would close it.

## 8. Suggested minimum amendments (for the builder, not applied here)

- Add a Capability Map row (or AD) for the **presentation/UX surface**: landing (FR-11), walkthrough (FR-10), consent + a11y prefs (FR-12), dark mode (FR-14), with reduced-motion as a named convention.
- Add an invariant: **web search fires only after explicit user approval** and flows back through `SourceIndexer`/limits.
- Add a convention enumerating limit values and the 5MB size-check boundary.
- Add a convention/seed node for **SM-1/SM-2 telemetry** and a convention that all reads are `userId`-scoped.
