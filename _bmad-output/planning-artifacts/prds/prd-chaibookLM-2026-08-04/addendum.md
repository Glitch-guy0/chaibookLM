# Addendum — chaibookLM v0.1 PRD

Companion to `prd.md`. Depth that belongs downstream (UX spec, architecture, design system), captured for reference and review.

## Design identity (from brief addendum, 2026-08-04)

**Neo-brutalism** — funky, modern, deliberately unique; not premium/quiet. Brand-level contrast to NotebookLM's clean Google minimalism; the lead differentiator on first impression. (Updated 2026-08-06: `design-style.md` dropped — the language is purely neo-brutalist.)

Practical anchors for execution [ASSUMPTION]: thick hard borders, bold offset shadows, saturated/confident color palette, chunky playful typography, visible structure over airy whitespace — applied with discipline ("lots of personality, zero noise"). Web-first with mobile optimization, so the aesthetic must survive small screens.

Needs a design pass before/parallel to build (per PRD §6.1 assumption); exact palette, type scale, shadow/border tokens are for the UX spec (`bmad-ux` / `bmad-agent-ux-designer`).

## Design anchors (decided 2026-08-05, updated 2026-08-06)

- **No persistent notebook rail.** Inside a notebook there are exactly **three sections — Sources | Chat | Showcase — switched via tabs on top** (desktop and mobile). All notebook actions (create/open/rename/delete/bulk-delete) live on the **notebook dashboard**; the user returns to the dashboard to switch notebooks.
- The Original View (showcase) is a section, not a side panel: clicking a citation switches to the Showcase tab; Esc returns to Chat with focus on the chip.
- Uploading a Source opens a pop-up/dialog; indexing state is shown as color on the Source's button/card (queued → processing → ready/failed).
- Limit violations surface as a pop-up warning (per PRD §6.1). Notebook cap is 10; notebooks auto-delete 1 week after creation.
- Buttons are **slightly slanted to the right** (≤ ~20°) with a matching **slanted offset shadow "illuminated from bottom-left"** — a neo-brutalist signature; shadow slants more than the button. Already consistent with the bold-offset-shadow language.
- **Dark mode required** (FR-14): follows `prefers-color-scheme` with a manual override persisted via consented cookies.
- First-run product walkthrough via a tour library (FR-10).
- Public landing page with smooth scroll + scroll-based animations (FR-11).

## Architecture anchors (decided 2026-08-05)

- **Models are OpenAI-compatible only** — LLM and embeddings both config-driven via env (`baseURL`, `apiKey`, `model`); any OpenAI-compatible host swaps in without code change.
- **Answer runtime is the shikigami agent SDK** (`@glitch-guy0/shikigami`) — retrieval is a custom `MemoryStrategy` wired into `MemoryManager`; ingestion is app code (queue job) writing to the same store.
- **Web search is a pluggable port** — Kairo `WebSearchTool` takes an injected `search` implementation; v0.1 ships jina / duckduckgo impls.
- **Code is DDD + modular monolith** — bounded-context modules in `backend/` (domain + application + infrastructure) as a **separate top-level tree**, not nested in the Next app; Next.js holds the controller/presentation layer only. Structure only — the runtime stays a single deployable.
- **Storage is a port with a composite adapter** — `StorageService` interface backed by Filebase (S3-compatible) via composite adapter, so more providers/databases can be added without touching domain code.
- **Vector DB is a port with a composite adapter** — `VectorStore` interface backed by Qdrant via composite adapter; more vector stores can be added later.
- **Chunk data authority** — Qdrant is the system of record for Chunks: vector + chunk metadata (origin, span/offset, position) stored together. Neon stores only user + resource **working metadata** (notebooks, source records/status, limits, chat); no chunk-level data in Neon.
- **Chunk recovery (approved)** — Qdrant loss is **not** rebuilt by replaying ingestion; the approved recovery is to delete the affected users' resource files from Filebase and surface an error to those users (honest-degradation tone per FR-13 — a clear message, no broken/erroring state).
- **Shikigami is tightly coupled** — the shikigami agent SDK is NOT behind a port (approved decision); app code depends on it directly. Any SDK modification (templates, new behavior) requires a detailed change-request document and explicit approval before implementation.
- **Client data fetching via TanStack Query** (default recommendations) — no raw `fetch` in components.
- **Image handling:** an interception layer strips images from Sources at indexing time only — the original Source content is never altered. Implemented as a removable interceptor so image recognition can be added later.
- **Seed data** for fresh/test environments (per PRD §6.1).
- **Resource limits:** 5 MB per Source, 30 Sources per user, 10 Sources per notebook, **10 notebooks per user**; notebooks **auto-delete 1 week after creation** (TTL); per-user counts and limits stored server-side, configurable for future tiers. **Rate-limit rejection** under load ("experiencing high load at this time — try again later") so spikes drop requests instead of burning credits.

## Dependency map (decided 2026-08-05)

| Concern | Pick | Note |
|---|---|---|
| Chat LLM | env-configured OpenAI-compatible endpoint (baseURL/apiKey/model) | Provider-agnostic; default host TBD per environment |
| Embeddings | env-configured OpenAI-compatible endpoint (baseURL/apiKey/model) | `text-embedding-3-small`-class default |
| Vector DB | Qdrant behind `VectorStore` composite adapter | **System of record for Chunks (metadata + vector together)**; cloud free tier or self-hosted; more stores later |
| Relational DB | Neon, one multi-tenant Postgres | **User + resource working metadata only**; limits; chat; no chunk-level data |
| RAG runtime | shikigami agent SDK | Custom `MemoryStrategy` → `VectorStore` port; **tightly coupled (approved), not behind a port** |
| Ingestion | App code in Upstash QStash job | Fetch → readability+linkedom → Turndown → split → embed → store; job writes, agent reads |
| File storage | Filebase (S3-compatible) behind `StorageService` composite adapter | Raw HTML + assets; more providers later |
| Web search (FR-7) | Pluggable `search` port; v0.1 = jina / duckduckgo | Kairo `WebSearchTool` |
| Client data | TanStack Query (default recommendations) | No raw fetch in components |
| Design/CSS | **Tailwind CSS** (design tokens map 1:1 to Tailwind theme config) | Dark mode via `dark` variant + CSS custom properties |
| Cookies/consent | Consent-first cookie handling (GDPR-style) | Per-category disclosure ("cookies related to X and Y"); a11y prefs persisted as cookies only after consent |
| Deploy | Vercel + Next.js, free (Hobby) | Modular monolith; controllers in Next, services in `backend/` |
| Markdown render | react-markdown + remark-gfm | Text sources + chat |
| First-run tour | Driver.js | FR-10 |

Cost posture: no framework (LangChain/LlamaIndex) — custom thin pipeline via shikigami ports; no vector-DB lock-in (composite adapter). Free tier throughout; paid line = LLM + embeddings usage only. Caveat: Hobby function-duration cap (~10-60s) bounds the QStash ingestion callback.

