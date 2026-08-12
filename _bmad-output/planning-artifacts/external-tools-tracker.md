# chaibookLM — External Tools Tracker (v0.1 → v1)

Created 2026-08-12. Updated 2026-08-12 (party review: John + Winston) against the actual implemented code, not just the planning decision. Updated again 2026-08-12: Jina → Tavily + Firecrawl, Filebase → Cloudinary (decision, ahead of code migration — see Notes). Tracks every third-party service/account chaibookLM depends on, its setup status, and who owns it. Companion to `tech-stack.md` (the *what/why* of each pick) — this doc is the *is it actually provisioned* checklist. Update the Status column as accounts get created and keys land in `.env.local` / Vercel project env.

## Status legend
`Not started` · `Account created` · `Configured (dev)` · `Configured (prod)` · `Blocked`

## Tracker

| # | Tool | Purpose | Account needed? | Env vars | Status | Owner | Notes / Risk |
|---|---|---|---|---|---|---|---|
| 1 | **Vercel** (Hobby) | Next.js hosting, serverless functions | Yes — free | n/a (deploy target) | Not started | Prajwal | Ingestion (`IngestionService.ingest()`) runs synchronously in the request path today — no queue in front of it (see item 9). Hobby's 10s/60s duration cap applies directly to every ingest call, not just a future callback. |
| 2 | **Clerk** | Auth (sign-in/up, session) | Yes — free dev tier | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_SIGN_IN_URL`, `CLERK_SIGN_UP_URL`, `CLERK_AFTER_SIGN_IN_URL`, `CLERK_AFTER_SIGN_UP_URL` | **Configured (dev)** | Prajwal | All 6 keys set in `.env.local`. `ClerkAdapter` (`backend/src/adapters/clerk/index.ts`) implemented and wired via `validateSession()`/`extractUserIdFromRequest()`. Not yet confirmed in Vercel prod env. |
| 3 | **Neon** | Postgres — working metadata (notebooks, source records, limits, chat) | Yes — free tier | `DATABASE_URL` | **Configured (dev)** | Prajwal | Set in `.env.local`. `NeonRepository` (`backend/src/adapters/neon/index.ts`) fully implemented — notebooks, sources, chat messages, rate-limit counters, migrations. Not yet confirmed in Vercel prod env. |
| 4 | **Qdrant** | Vector DB — system of record for chunks (vectors + metadata) | Yes — free tier (1GB cluster) or self-hosted | `QDRANT_URL`, `QDRANT_API_KEY` | **Configured (dev)** | Prajwal | Set in `.env.local`. `QdrantAdapter` implemented (`backend/src/adapters/qdrant/index.ts`). Still the highest-risk account to get wrong — no re-index recovery path — but now a "which tier/region is this dev cluster" question, not a "does an account exist" question. Confirm prod tier/region before real user data lands. |
| 5 | **Cloudinary** | File storage — raw HTML + assets (replaces Filebase) | Yes — free tier | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (names TBC against actual SDK usage) | **Not started — blocking, needs adapter rewrite** | Prajwal | Decision made 2026-08-12 to replace Filebase with Cloudinary. Code today still has `FilebaseAdapter` on the critical path (`IngestionService.captureSnapshot()` → `StorageService.put()`); this is now a two-step gap: (a) build a `CloudinaryAdapter` behind the existing `StorageService` port, (b) provision the account and env vars. Until both land, ingestion stays broken — this is still the top actionable gap, ahead of Qdrant. |
| 6 | **LLM provider** (OpenAI-compatible endpoint) | Chat completions for the agent runtime | Yes | `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` | **Configured (dev)** | Prajwal | Decision made and set in `.env.local`; `LlmAdapter` implemented (`backend/src/adapters/llm/index.ts`). Prod cost/rate ceiling not yet load-tested. |
| 7 | **Embeddings provider** (OpenAI-compatible endpoint) | Chunk embeddings for Qdrant | Yes | `EMBEDDING_BASE_URL`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL` | **Configured (dev)** | Prajwal | Decision made and set in `.env.local`; `EmbeddingsAdapter` implemented (`backend/src/adapters/embeddings/index.ts`). |
| 8 | **Tavily** | Web search (FR-7 "find related web pages on refusal") — replaces Jina | Yes — free tier | `TAVILY_API_KEY` (names TBC) | **Not started — contained gap, needs adapter rewrite** | Prajwal | Decision made 2026-08-12 to replace Jina with Tavily. Code today still has `JinaAdapter` behind the `search` port, used only by `FetchOnRefusalService`/`WebSearchTool` — scoped to the refusal-fallback feature, not core ingestion or chat. Needs a `TavilyAdapter` built against the same `search` port, then the account provisioned. Core loop works without it either way; the honest-refusal-with-fetch UX doesn't. |
| 8a | **Firecrawl** | URL → clean markdown scraping — replaces native `fetch` + Readability + linkedom + Turndown | Yes — free tier | `FIRECRAWL_API_KEY` (names TBC) | **Not started — needs adapter rewrite** | Prajwal | Decision made 2026-08-12. This replaces the ingestion pipeline's current fetch/extract step (see `tech-stack.md`), which today is local libraries with no external account. Adds a new provisioning dependency where there wasn't one before — scope this alongside the Cloudinary/Tavily migration work, not as a drop-in env-var fill. |
| 9 | **Upstash QStash** | Ingestion job queue | Yes — free tier (1k msgs/day) | `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | **Not started — deferred, not pending** | Prajwal | No `QStashAdapter` exists in the codebase; ingestion is synchronous today. This is a v1 design decision still to be made (async queue vs. staying synchronous under a higher Vercel plan), not an account waiting to be created. Don't provision until the async-ingestion decision below is settled. |
| 10 | **shikigami SDK** (`@glitch-guy0/shikigami`) | RAG agent runtime (retrieval + answer path) | No account — npm package | n/a | Configured (dev) | Prajwal | Tightly coupled by approved decision, not behind a port — any SDK modification needs a change-request doc + approval |
| 11 | **Driver.js** | First-run product tour (FR-10) | No account — npm package | n/a | Configured (dev) | Prajwal | No tracking needed beyond install |

## Current state (as of 2026-08-12)

Epics 1–5 are implemented in code (`backend/src/contexts/*`, `backend/src/adapters/*`, `app/*`), including the full design-system hardening pass in epic 5. Open engineering debt from that build lives in `docs/deferred-work.md` (accessibility contrast failures in dark mode, single-instance rate limiter, missing route-level tests, etc.) — that's a code-quality backlog, separate from this doc's provisioning concerns.

**Provider swap decided 2026-08-12, not yet built:** Filebase → Cloudinary, Jina → Tavily, plus a new Firecrawl dependency replacing the local fetch/extract stack. The code in the repo today still runs on Filebase and Jina — `tech-stack.md`'s picks changed ahead of the adapters. Until `CloudinaryAdapter`, `TavilyAdapter`, and a Firecrawl-backed fetch/extract step are built behind the existing `StorageService`/`search`/ingestion ports, provisioning accounts for them is premature.

Of the accounts needing provisioning: Clerk, Neon, Qdrant, LLM, and Embeddings are done in dev. Cloudinary, Tavily, and Firecrawl are all open **and blocked on adapter code that doesn't exist yet** — this is a step further behind than a simple "fill in the env var" gap.

No account has been confirmed in a Vercel prod environment yet — everything above is dev-only.

## Path to v1

1. **Build the three new adapters first, provisioning second:** `CloudinaryAdapter` (behind `StorageService`, replacing `FilebaseAdapter`), `TavilyAdapter` (behind `search`, replacing `JinaAdapter`), and a Firecrawl-backed fetch/extract step (replacing native `fetch` + Readability + linkedom + Turndown in the ingestion pipeline). The composite-adapter pattern already in place for storage/vector DB means this shouldn't touch domain code — confirm that holds before assuming it's a clean swap.
2. **Provision Cloudinary and confirm end-to-end source ingest** works locally once its adapter lands — this remains the gap between "code complete" and "actually usable," now with an extra step (adapter) ahead of it.
3. **Provision Tavily and verify `FetchOnRefusalService`'s** approval-gated web-fetch path once its adapter lands.
4. **Provision Firecrawl** once the ingestion pipeline is rewired to call it instead of the local extraction libraries.
5. **Decide sync-vs-queued ingestion before touching Vercel plan tier.** Don't provision QStash speculatively — first decide whether v1 ships with synchronous ingestion under a paid Vercel plan (simpler, keeps `IngestionService` as-is) or moves to a QStash-backed queue (more resilient, adds an adapter + callback route that doesn't exist yet). This decision gates whether item 1 (Vercel) needs a plan upgrade or item 9 (QStash) needs building at all.
6. **Provision prod:** once dev is fully green, mirror all "Configured (dev)" rows into the Vercel project's prod env and flip status. Pin Qdrant's prod region/tier explicitly before any real user data flows through it — still the account with no rebuild path on loss.
7. **Burn down `docs/deferred-work.md` in parallel**, prioritizing the two WCAG contrast failures (ink-muted-dark, ink-dark-on-brand-dark) and the single-instance rate limiter — both are user-facing or correctness issues that should close before calling v1 "trust floor" complete, per Epic 5's own framing.
8. **Load-test the LLM/embedding provider cost line** under item 6/7 once Cloudinary/Firecrawl unblock real ingestion volume — the only paid, usage-scaling cost surface besides Qdrant storage.

## How to use this doc

1. When an account is created, flip its Status and note the date inline (e.g. `Account created (2026-08-14)`).
2. When keys are dropped into `.env.local`, flip to `Configured (dev)`.
3. When the same keys are set in the Vercel project (or prod equivalent), flip to `Configured (prod)`.
4. If a provider is blocked (waitlist, billing, region), set Status to `Blocked` and note why in the Notes column — surface it in sprint status.
