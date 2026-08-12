# chaibookLM — Tech Stack

Condensed from `_bmad-output/planning-artifacts/tech-stack.md`. Decided 2026-08-05/06; the code is the source of truth for actual installed versions (`package.json`).

| Concern | Pick | Note |
|---|---|---|
| Frontend/Backend | Next.js (App Router) on Vercel Hobby (free) | Modular monolith: Next.js is controllers/routes only; domain/application/infra live in `backend/` |
| Client data fetching | TanStack Query | No raw `fetch` in components |
| Design/CSS | Tailwind CSS | Design tokens map 1:1 to Tailwind theme config; dark mode via `dark` variant over CSS custom properties |
| Cookies/consent | Consent-first, GDPR-style | Per-category disclosure; a11y/theme prefs persisted as cookies only after approval |
| Landing motion | Smooth scroll + scroll-based animations | Honors `prefers-reduced-motion` |
| Auth | Clerk | |
| Chat LLM | env-configured OpenAI-compatible endpoint | `baseURL`/`apiKey`/`model`; provider-swappable with no code change |
| Embeddings | env-configured OpenAI-compatible endpoint | Same pattern, independent env vars from chat LLM |
| Vector DB | Qdrant behind a `VectorStore` port (composite adapter) | System of record for chunks (vector + metadata together) |
| Relational DB | Neon (Postgres) | Working metadata only — no chunk-level data |
| RAG runtime | shikigami agent SDK (`@glitch-guy0/shikigami`) | Tightly coupled by approved decision — not behind a port |
| Ingestion | App code in an Upstash QStash job | fetch → readability + linkedom → Turndown → split → embed → store |
| Fetch/extract | native `fetch` + `@mozilla/readability` + linkedom + Turndown | Images stripped at index time; JS-only pages → honest "failed" |
| File storage | Filebase (S3-compatible) behind a `StorageService` port (composite adapter) | Raw HTML + assets |
| Web search | Pluggable `search` port — jina | Approval-gated fetch-on-refusal only |
| Markdown render | react-markdown + remark-gfm | |
| First-run tour | Driver.js | |

## Code architecture

- DDD bounded contexts (`notebooks`, `sources`, `chat`, `ingestion`, `limits`) in a separate top-level `backend/` tree, not nested in the Next app — extractable later without a structural refactor.
- Composite adapters for storage and vector DB — new providers never touch domain code.
- shikigami is the one approved tight-coupling exception; everything else follows ports-and-adapters.
- LLM + embeddings are both fully env-driven, OpenAI-compatible only.

## Explicit non-picks

No LangChain/LlamaIndex, no headless browser (JS-only pages fail honestly), no self-hosted AI, no raw client `fetch`, no persistent notebook rail.

## Cost posture

Free tier throughout: Vercel Hobby, Neon free, Qdrant free tier (1GB), Filebase free tier, QStash 1k msgs/day, Clerk dev — paid line is LLM + embeddings usage only. Cost controls: 1-week notebook TTL, 10-notebook/user cap, rate-limit rejection under load. Vercel Hobby's serverless duration cap (~10s default, ~60s max) bounds the QStash ingestion callback — monitor as real sources index.
