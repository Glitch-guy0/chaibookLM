# Epic 1 Context: Sign In & Own Your Workspace

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A user signs in with Clerk and their notebooks, sources, and chats are securely scoped to them and persist across sessions and devices. Caps on notebooks, sources, and source size are enforced atomically server-side. This epic establishes the modular monolith skeleton (Next.js App Router + `backend/` tree), the design-token foundation (neo-brutalist), and the Clerk auth boundary — everything later epic builds on.

**FRs covered:** FR-9

## Stories

- Story 1.1: Bootstrap the workspace foundation
- Story 1.2: Sign in with your account
- Story 1.3: Scope and persist my workspace data per user
- Story 1.4: Establish workspace limits and counters

## Requirements & Constraints

- **Clerk auth wall.** Unauthenticated visitors see the Clerk sign-in wall and cannot reach the dashboard, notebooks, sources, chat, or showcase. Signed-out routes must redirect to sign-in; no workspace data is exposed.
- **Per-user data scoping.** All notebooks, sources, chunks, and chat history are scoped to the authenticated user at the API and data layer (not just UI). Queries across users are impossible by construction.
- **Server-side persistence.** Data survives a full session/logout cycle and is available across devices. Neon stores user + resource working metadata (notebooks, source records/status, limits, chat); Qdrant is the system of record for chunk-level data (vector + metadata stored together).
- **Cap enforcement.** v0.1 limits: 10 notebooks/user, 10 sources/notebook, 30 sources/user, 5MB/source. Caps are configurable server-side without code edits. A write that exceeds a cap is rejected with a pop-up warning showing the limit and current count. Cap check-and-increment is a single Postgres transaction.
- **Account surface.** The account menu displays a live limit overview (notebook and source counts vs. caps), sourced from the limits context.

## Technical Decisions

- **Modular monolith with DDD.** Next.js App Router is the composition root and controller layer. Domain + application + infrastructure live in a separate top-level `backend/` tree (contexts: `notebooks`, `sources`, `chat`, `ingestion`, `limits`; ports: `VectorStore`, `StorageService`, `Embeddings`, `search`; adapters: `qdrant`, `neon`, `filebase`, `clerk`, `llm`, `embeddings`, `jina`). Single deployable (Vercel Hobby).
- **Ports-and-adapters (hexagonal).** Adapters are injected at the composition root; domain code depends only on ports. Adapters are never constructed by domain code.
- **All config is env-driven.** LLM, embeddings, vector store, storage, auth — all via env vars (`baseURL`/`apiKey`/`model` pattern). Secrets never in client bundles. Dev + prod environments; seed data for fresh/test environments.
- **Clerk integration.** Frontend: Clerk React SDK for sign-in wall and session management. Backend: Clerk API validates session tokens on every protected route. No auth or API secrets in client bundles.
- **Neon (Postgres) for working metadata.** Per-user tables for notebooks, source records/status, limit counters, and chat history. No chunk-level data in Neon.
- **Limits context owns counters.** The `limits` bounded context is the single owner of all per-user/per-notebook counters in Neon. Every write boundary (create notebook, add source, upload) routes through it. Delete and TTL paths reconcile counters down exactly once. Double-bump guard in place.
- **Design-token foundation.** Colors, fontFamily, fontSize, lineHeight, borderRadius, boxShadow, and spacing map 1:1 from `DESIGN.md` frontmatter to the Tailwind theme config. Archivo Black (display), Space Grotesk (body), and Space Mono (mono) fonts loaded. Dark mode via `dark` class variant + CSS custom properties in `globals.css`.
- **shikigami coupled.** `@glitch-guy0/shikigami` is a direct dependency (not behind a port). Custom templates live in `backend/src/templates/`.
- **Debug component naming.** Every component instance carries a unique stable debug name. In dev / `UX_DEBUG` mode, a zero-impact overlay label renders it; production builds strip it entirely.

## UX & Interaction Patterns

- **Sign-in wall.** A signed-out visitor sees only the Clerk-hosted sign-in wall on the app route. No dashboard, notebook workspace, or data is reachable.
- **Protected routes.** Any navigation to a workspace page while unauthenticated redirects to sign-in. Expired sessions behave identically.
- **Account surface.** Accessible from the header avatar. Contains Clerk account management, a live limit overview (X of Y notebooks, X of Y sources), replay first-run tour, and theme/accessibility preference overrides.
- **Cap violation warning.** When a create notebook or add source operation hits a cap, a modal dialog warns with the limit and current count. One-button dismiss; the operation is blocked.
- **State patterns:** signed-out shows Clerk wall; cold-load shows skeletons; limit violation shows warning dialog.

## Cross-Story Dependencies

- Story 1.1 (bootstrap) is a foundation prerequisite for all stories — without the structural seed, design tokens, and env-driven config, nothing else can build.
- Story 1.2 (auth) must be in place before Story 1.3 (per-user scoping) can be verified — scoping requires a known authenticated identity.
- Story 1.4 (limits) depends on the limits context being wired into the write boundaries established by later epics (notebook creation in Epic 2, source creation in Epic 3), but the counter infrastructure and cap-check transactions can be built and tested independently in this epic.