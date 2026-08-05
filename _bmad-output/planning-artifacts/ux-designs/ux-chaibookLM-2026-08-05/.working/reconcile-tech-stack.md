# Input Reconciliation — Tech Stack vs UX Spines

- **Input:** `_bmad-output/planning-artifacts/tech-stack.md`
- **Spines:** `ux-designs/ux-chaibookLM-2026-08-05/EXPERIENCE.md`, `DESIGN.md`
- Scope note: most of this file is engineering (DDD, modular monolith, composite adapters, env-driven models, cost posture). This reconciliation covers the **UX-constraining** lines — the ones that shape what a user can see or do — plus the named UX-facing picks.

## 1. UX-constraining decisions and where they landed

| Constraint / pick | Landed in spines |
|---|---|
| **Async ingestion states** (ingestion runs in QStash job; status queued → processing → ready/failed) | EXPERIENCE States "Ingestion" (dot + label, source not queryable until ready); Components "Source card"; DESIGN.md Components "Source card" + semantic state colors |
| **JS-only / no headless browser = expected failure** (SPA pages surface honest "failed", never break other sources) | EXPERIENCE States "Ingestion failed" (reason incl. JS-only render; "Failure is expected for some URLs"); Flow 1 failure branch |
| **5MB / 10 per notebook / 30 per user limits** (server-side, pop-up warning) | EXPERIENCE Components "Warning dialog" (5MB/source, 10/notebook, 30/user), State "Limit violation", Voice ("You've reached 30 sources"); IA "Account" (source-limit overview) |
| **Markdown rendering** (react-markdown + remark-gfm; text sources + chat) | EXPERIENCE Foundation + Components "Assistant message" / "User message" ("Rendered as markdown"); implicit for the text-source Original View (see §3) |
| **First-run tour via Driver.js** | EXPERIENCE Foundation + Components "First-run tour" (dismissible, replayable from Account); Flow 1 step 1 |
| **TanStack Query / no raw fetch in components** | EXPERIENCE Foundation ("Client data fetching via TanStack Query (no raw fetch in components)") — a dev contract, carried as a spine line |
| **Clerk auth** | EXPERIENCE Foundation + State "Signed out" |
| **Responsive web, mobile-optimized, 320px minimum** | EXPERIENCE Foundation + Responsive & Platform |
| **Images stripped at index time** (original never altered) | Not user-facing; correct to be absent — the UX consequence (webpage renders without images in showcase) is covered by the showcase frame + OQ-U1 fallback |

## 2. Capacity caps — no user-facing quota UI (justified, not dropped)

- **DROPPED: none.**
- **SUPPORTED-BY-ASSUMPTION — QStash 1k msgs/day and Qdrant 1GB free tier.** These are infra ceilings, not product decisions. Their user-visible impact would surface through the existing graceful-failure states (States "Ingestion failed", "Network / LLM error") and the PRD posture of *no credit gate in v0.1*. No dedicated "queue exhausted" surface is required, and none was invented. Flag for the engineering spine: when QStash 1k/day is hit, the ingestion callback should fail *gracefully* into the existing failed-state treatment rather than erroring the app.
- **SUPPORTED-BY-ASSUMPTION — Vercel Hobby function-duration cap (~10–60s) on the QStash callback.** Engineering-only; has no UI. It only reinforces that ingestion must stay async with visible status (already the spine design).
- **SUPPORTED-BY-ASSUMPTION — free-tier cost posture / LLM+embeddings paid line.** Not a UX decision; no surface in the spines (and none should exist — payments are out of v0.1).

## 3. Not carried elsewhere

- **SUPPORTED-BY-ASSUMPTION — text-source Original View renders markdown.** Carried via Foundation's react-markdown line + tech-stack "Text sources + chat", but not spelled out in the Components "Original View" row. Covered; could be made explicit in the design pass.
- **Engineering-only lines (correctly absent from the experience spine):** DDD/modular monolith, composite adapters (StorageService/VectorStore), env-driven OpenAI-compatible endpoints, shikigami agent SDK, readability/linkedom/Turndown pipeline, Neon/Qdrant/Filebase selection, no LangChain/LlamaIndex. None carries a user-visible decision.

## 4. Verdict

Every UX-constraining tech-stack line is present in the spines (ingestion states, JS-only failure, 5MB/10/30 limits, markdown, Driver.js, TanStack Query, Clerk, responsive). Capacity caps (QStash 1k/day, Qdrant 1GB, Vercel duration) are engineering constraints handled by the existing graceful-failure surface — flagged, not dropped.
