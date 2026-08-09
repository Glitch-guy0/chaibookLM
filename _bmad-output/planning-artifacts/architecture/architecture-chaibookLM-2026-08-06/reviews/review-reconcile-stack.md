# Reconciliation Review — Spine vs. Tech Stack + shikigami SDK

- **Spine:** `architecture-chaibookLM-2026-08-06/ARCHITECTURE-SPINE.md`
- **Sources checked:** `planning-artifacts/tech-stack.md`, `planning-artifacts/shikigami-sdk.md` (plus, where needed to resolve ambiguity: `prds/.../addendum.md` dependency map, `brief.md`, `ux-designs/.../EXPERIENCE.md`, and the spine's `.memlog.md`)
- **Role:** READ-ONLY reconciliation reviewer. No files modified.
- **Date:** 2026-08-09

---

## Verdict

The spine lands the four approved carve-outs cleanly (AD-1, AD-2, AD-3, `backend/` tree), carries the Vercel Hobby caveat and the rate-limit-rejection copy verbatim, and correctly reflects jina-only search (duckduckgo dropped). It **does not**, however, bind the numeric cost limits (1-week TTL, 10-notebook cap, 30/user, 10/notebook — only 5MB survives), **drops the composite-adapter property**, drops most explicit non-picks, and never engages the shikigami guardrail/reasoning-manager surfaces that the SDK source of truth highlights. The Stack table is current except TypeScript. Verdict: **conditionally aligned — no structural conflicts, several decided items weakened or dropped.**

---

## 1. Approved carve-outs — covered correctly

| Carve-out (source) | Spine reflection | Status |
| --- | --- | --- |
| shikigami tightly coupled, **not** behind a port | Design Paradigm carve-out + AD-3 (`[ADOPTED]`), approval-gated SDK changes | ✅ Covered |
| Qdrant = chunk system of record | AD-1: vector + metadata together on the Qdrant document; Neon working-metadata-only | ✅ Covered |
| Zero-backup recovery (no re-index on loss) | AD-2: delete Filebase files + surface honest error; zero-backup posture explicit | ✅ Covered |
| `backend/` separate top-level tree | Design Paradigm + Structural Seed (`backend/src/contexts/...`) + "extractable later" rationale | ✅ Covered |

## 2. Stack table version check

Versions re-verified against npm registry (2026-08-09):

| Spine row | Spine version | npm latest | Match |
| --- | --- | --- | --- |
| Next.js | 16.x | 16.3.0 | ✅ |
| React | 19.x | 19.2.8 | ✅ |
| **TypeScript** | **5.x** | **7.0.2** | ⚠️ **not current** |
| @glitch-guy0/shikigami | 0.1.0 | 0.1.0 | ✅ (exact) |
| @tanstack/react-query | 5.x (5.101.4) | 5.101.4 | ✅ (exact) |
| Tailwind CSS | 4.3.x | 4.3.3 | ✅ |
| react-markdown / remark-gfm | current | 10.1.0 / 4.0.1 | ✅ |
| Driver.js | current | 1.8.0 | ✅ |
| Clerk | current | 7.7.1 | ✅ |
| Qdrant client | current | 1.19.0 | ✅ |

The tech-stack table pins **no** versions, so there is no version conflict between the two sources — the spine is additive. The only problem is the spine's own header claim "versions verified 2026-08-09" alongside `TypeScript 5.x` while the registry latest is 7.x. If the project intentionally pins TS 5 for shikigami/Next compatibility, that intent isn't recorded; as written, the "verified-current" claim is wrong for TS.

## 3. Composite adapters — decision weakened/dropped

- **Source:** tech-stack Code architecture ("storage and vector DB are ports with composite adapter implementations: route/aggregate across multiple backing providers"); addendum rows 30–31 (`StorageService`, `VectorStore` composite adapters).
- **Spine:** the word **"composite" never appears**. Design Paradigm says "Adapters … are injected at the composition root"; Structural Seed lists ports `VectorStore, StorageService, search, Embeddings` and plain `adapters/ qdrant, neon, filebase...`. The routing/aggregation property — the reason the tech-stack and addendum called them *composite* (add-a-provider-without-touching-domain-code) — is not bound anywhere.
- **Verdict:** **omission/weakening.** AD-1/AD-5 bind the Qdrant/embedding behaviors, but the composite nature of `StorageService` and `VectorStore` is a distinct decided property that the spine drops. Recommend a line in the Design Paradigm or a naming-convention note.

## 4. Explicit non-picks — mostly dropped

| Non-pick (tech-stack) | Spine | Status |
| --- | --- | --- |
| No LangChain / LlamaIndex — custom thin pipeline via shikigami ports | Not mentioned anywhere | ❌ dropped (implicit in AD-3 only) |
| No headless browser — JS-only pages → "failed" | Not mentioned (also missing the "JS-only → failed" behavior from the fetch/extract row) | ❌ dropped |
| No raw `fetch` in the client — TanStack Query owns fetching | Consistency Conventions: "no raw `fetch` in client components (TanStack Query owns fetching/caching)" | ✅ covered |
| No persistent notebook rail — Sources | Chat | Showcase tabs | Not mentioned | ❌ dropped |
| No self-hosted AI — commercial APIs (PRD) | Env-driven OpenAI-compatible LLM/embeddings; "OpenAI-compatible only" in Deferred | ⚠️ implicit |

The spine has no Non-picks section at all; only one of the five survives verbatim. The headless-browser drop is the most consequential because it also erases the "JS-only → failed" behavior that governs a real user-facing path.

## 5. Cost posture / cost controls

| Control (source) | Spine | Status |
| --- | --- | --- |
| 10-notebook cap | AD-10 says "per-user/per-notebook counts" + "cap check-and-increment" but **never the number 10**; Capability Map says "caps" | ⚠️ weakened (figure dropped) |
| 1-week TTL | AD-11 (lazy TTL, no cron) but **no "1 week" figure** | ⚠️ weakened (figure dropped) |
| Rate-limit rejection — "experiencing high load at this time — try again later" | AD-12, copy verbatim | ✅ covered |
| 5MB per source | Deployment constraint: "≤5MB sources" | ✅ covered (as a duration-caveat input, not as a limit rule) |
| 30 sources per user | **Not in spine** | ❌ dropped |
| 10 sources per notebook | **Not in spine** | ❌ dropped |
| Vercel Hobby function-duration cap (10s default / ~60s max) | Consistency Conventions, Deployment constraint: "monitored risk, not a design out" | ✅ covered, good phrasing |

The numeric limits live in the addendum (`5 MB/Source, 30 Sources/user, 10 Sources/notebook, 10 notebooks/user, 1-week TTL`) and partially in tech-stack (1-week, 10-cap). AD-10/AD-11 bind the *mechanism* (single-writer counter, single-transaction, lazy TTL) but not the *decided numbers*, and two of the three per-source/per-notebook caps (30/user, 10/notebook) are absent entirely. Recommend the spine bind the concrete numbers (either inline in AD-10/AD-11 or a dedicated limits AD) so stories can't drift from the decided caps.

## 6. shikigami SDK capabilities vs. spine

| SDK capability (shikigami-sdk.md) | Spine | Status |
| --- | --- | --- |
| Retrieval-order rule: memory-retrieve first → tools → explicit unknown; `store()` after each task + final | AD-7 captures the *visible* half (no retrieval above `minScore` → no chunkIds → refusal with zero markers — the "explicit-unknown" behavior). The ordering rule itself and the store-after-task behavior are not stated | ⚠️ partial |
| MemoryStrategy / MemoryManager (`shikigami/retrieval`, `MemoryManagerImpl`) | `VectorStoreMemoryStrategy` + "custom MemoryStrategy" present; `MemoryManager`/strategy-array wiring never mentioned | ⚠️ partial |
| Session port (prior turns carried forward, `pendingTask` resume, non-fatal failures → ERROR event) | `NotebookSession` template + AD-9 (7-turn window) capture the app-level intent; the SDK port semantics aren't reflected | ⚠️ partial |
| **ReasoningManager** | `GroundedAnswerReasoningStrategy` named, but **ReasoningManager never mentioned** — the wrapper every strategy must be wired into is absent from the spine | ❌ omitted |
| Tools creation contract (`createTool`, parser/interceptor pipeline, `ToolOutputValidator`, `maxToolCallsPerTask` default 3) | `WebSearchTool` named; contract and pipeline never referenced | ⚠️ partial (arguably seed-level) |
| Streaming/events: opt-in, **async-buffered**, no real-time guarantee | Deferred: "shikigami events are async-buffered in v1 (no real-time guarantee); streaming UX deferred" | ✅ covered |
| Kairo templates (batteries included) | Spine builds an all-custom template set and never mentions `@shikigami/kairo`. The `.memlog.md` records the actual decision — *"Kairo templates are placeholders, not used"* — but the spine body omits it and its rationale (e.g., `SimpleStore` is in-memory-only, `SimpleReasoningStrategy` is not grounded) | ❌ omitted from spine body |
| Swap-by-replacement (FR-14) | Not stated; AD-3's "custom strategies/templates are app code, no approval" enables it implicitly | ⚠️ implicit |
| **Guardrails run on every `execute()`**; sub-agent prompts bypass once sub-agents exist | **Guardrails never mentioned anywhere in the spine.** AD-12 is an app-layer *load* guard, not the SDK guardrail gate. The sub-agent bypass limitation is likewise unbound | ❌ omitted |

The guardrail omission is the most notable SDK miss: given AD-3 tightly couples shikigami and gates SDK behavior changes behind approval, the "every prompt submitted through this agent is guardrailed" property and its sub-agent bypass are exactly the kind of runtime invariants the spine should bind or explicitly defer. AD-12's app-layer guard and the SDK guardrail gate are distinct mechanisms and should not be conflated.

## 7. Web search: jina vs. duckduckgo

- Spine is **jina-only** (Stack row "jina (search impl)"; deployment diagram `JI[jina web search]`; Capability Map "`WebSearchTool` (jina)"). This matches the current decision the reviewer was told to check against (duckduckgo dropped). ✅ spine correct.
- However, the spine's own cited sources are **stale on this point**: tech-stack row still says "v0.1 impls: jina / duckduckgo" and addendum line 28 says the same. The spine silently diverges from both. Not a spine error — a documentation-drift flag: tech-stack.md and addendum.md should be updated to jina-only so the "source of truth" doesn't contradict the spine.

## 8. Other notes

- **Deployment/envs:** spine deployment diagram (Neon working metadata, Qdrant chunk system of record, Filebase, QStash→callback, env LLM/embeddings, jina) matches tech-stack rows. ✅
- **Free-tier cost posture** ("paid line is LLM + embeddings usage only") is implied by the stack/env choices but never stated in the spine; tech-stack states it outright. ⚠️ minor.
- **Qdrant self-hosted option** ("cloud free tier / self-hosted") carried over from tech-stack. ✅

---

## Summary of conflicts / omissions

**No hard contradictions** (nothing the spine asserts that the sources deny). Items that are weakened or dropped:

1. **Composite adapters** for storage + vector DB — decided in tech-stack code-architecture (and addendum), absent from the spine body.
2. **Numeric cost limits** — 1-week TTL and 10-notebook cap reduced to mechanism-only; 30 sources/user and 10 sources/notebook dropped entirely (5MB survives only as a duration-caveat input).
3. **Explicit non-picks** — only "no raw fetch client-side" survives; LangChain/LlamaIndex, headless browser (and its "JS-only → failed" behavior), and persistent-notebook-rail are dropped.
4. **shikigami guardrails** — the "guardrails on every execute()" property and the sub-agent bypass limitation are unbound; not to be confused with AD-12.
5. **ReasoningManager** and **@shikigami/kairo placeholder decision** — omitted from the spine body (the kairo decision exists only in `.memlog.md`).
6. **TypeScript version** — spine's "verified current" claim is wrong; registry latest is 7.0.2, spine says 5.x.
7. **Doc drift (not spine's fault)** — tech-stack.md and addendum.md still list duckduckgo alongside jina; the spine's jina-only is the newer, correct decision.

**Correctly landed and worth keeping:** AD-1 through AD-3 carve-outs, `backend/` tree, zero-backup recovery, rate-limit-rejection copy, Vercel Hobby duration caveat, async-buffered streaming deferral, and jina-only search.
