# Epic 1: Sign In & Own Your Workspace — Task List

**Date:** 2026-08-09
**Status:** Complete ✅

## Story 1.1: Bootstrap the workspace foundation ✅

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Initialize npm project with all dependencies | `package.json` | ✅ |
| 2 | Configure TypeScript and Next.js | `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` | ✅ |
| 3 | Create design token foundation | `app/globals.css` — CSS custom properties, Tailwind v4 @theme, dark mode, reduced motion, debug overlay styles | ✅ |
| 4 | Create full backend directory structure | `backend/src/contexts/`, `ports/`, `adapters/`, `templates/`, `shared-kernel/` | ✅ |
| 5 | Define shared kernel types | `backend/src/shared-kernel/types.ts` — User, Notebook, Source, Chunk, ChatMessage, LimitCounter | ✅ |
| 6 | Define port interfaces | `backend/src/ports/` — VectorStore, StorageService, Embeddings, Search | ✅ |
| 7 | Create Neon adapter with schema | `backend/src/adapters/neon/` — connection pool, SQL migration, CRUD repositories | ✅ |
| 8 | Create Clerk backend adapter | `backend/src/adapters/clerk/` — session validation, userId extraction | ✅ |
| 9 | Create stub adapters | `backend/src/adapters/{qdrant,filebase,llm,embeddings,jina}/` — port-compliant "not implemented" stubs | ✅ |
| 10 | Create shikigami template stubs | `backend/src/templates/` — 7 stub templates for shikigami integration | ✅ |
| 11 | Implement limits context | `backend/src/contexts/limits/` — LimitsService, atomic cap-check transactions, v0.1 caps | ✅ |
| 12 | Implement notebooks context | `backend/src/contexts/notebooks/` — NotebookService, CRUD, TTL checks | ✅ |
| 13 | Configure environment variables | `.env.example` — all env vars with documentation | ✅ |
| 14 | Configure fonts | `app/fonts.ts` — Archivo Black, Space Grotesk, Space Mono via next/font | ✅ |

## Story 1.2: Sign in with your account ✅

| # | Task | Files | Status |
|---|------|-------|--------|
| 15 | Create Clerk middleware with auth wall | `app/middleware.ts` — public routes, protected route matcher | ✅ |
| 16 | Create root layout with providers | `app/layout.tsx` — TanStack Query provider, fonts, globals.css | ✅ |
| 17 | Create sign-in page | `app/(auth)/sign-in/page.tsx` — Clerk SignIn component with neo-brutalist styling | ✅ |
| 18 | Create sign-in layout | `app/(auth)/layout.tsx` — centered auth page layout | ✅ |
| 19 | Create dashboard layout with auth guard | `app/(dashboard)/layout.tsx` — auth redirect, header with UserButton, protected shell | ✅ |
| 20 | Create dashboard page | `app/(dashboard)/page.tsx` — notebook grid placeholder, "Create Notebook" CTA, empty state | ✅ |
| 21 | Create API helpers | `app/api/helpers.ts` — userId extraction, error response helpers | ✅ |
| 22 | Create notebook API routes | `app/api/notebooks/route.ts` — GET/POST with auth validation | ✅ |
| 23 | Create auth provider wrapper | `components/auth-provider.tsx` — ClerkProvider for auth-required pages only | ✅ |

## Story 1.3: Scope and persist workspace data per user ✅

| # | Task | Files | Status |
|---|------|-------|--------|
| 24 | Implement Neon schema with per-user tables | `backend/src/adapters/neon/index.ts` — users, notebooks, sources, chat_messages, limit_counters | ✅ |
| 25 | Implement per-user data scoping | All backend contexts take `userId` as first parameter — scoping baked into API contract | ✅ |
| 26 | Create per-user CRUD repositories | Neon repository with `findByUserId`, `findById`, create, update, delete helpers | ✅ |
| 27 | Implement API route auth guard | `app/api/helpers.ts` — `getUserIdFromRequest` extracts Clerk session | ✅ |

## Story 1.4: Establish workspace limits and counters ✅

| # | Task | Files | Status |
|---|------|-------|--------|
| 28 | Implement atomic cap-check | `backend/src/contexts/limits/index.ts` — SELECT FOR UPDATE + COMMIT transaction pattern | ✅ |
| 29 | Configure v0.1 caps | Default limits: 10 notebooks/user, 10 sources/notebook, 30 sources/user, 5MB/source, 7-day TTL | ✅ |
| 30 | Implement double-bump guard | Decrement uses `WHERE count > 0` with `GREATEST(count - 1, 0)` to prevent negative counts | ✅ |
| 31 | Create counter reconciliation API | `LimitsService.checkNotebookCap()`, `checkSourceCap()`, increment/decrement/reconcile methods | ✅ |

### UI Components ✅

| # | Component | Files | Status |
|---|-----------|-------|--------|
| 32 | Neo-brutalist Button (primary/secondary/danger, slanted) | `components/ui/button.tsx` | ✅ |
| 33 | Dialog (3px ink border, 8x8 shadow, overlay dim) | `components/ui/dialog.tsx` | ✅ |
| 34 | Card (2px ink border, 3x3 offset shadow) | `components/ui/card.tsx` | ✅ |
| 35 | Skeleton (animated pulse placeholder) | `components/ui/skeleton.tsx` | ✅ |
| 36 | Debug overlay (UX-DR22) | `components/debug/DebugLabel.tsx` | ✅ |
| 37 | Base providers (TanStack Query) | `components/providers.tsx` | ✅ |

## Build Verification ✅

- `npm run build` — ✅ Passes (TypeScript clean, all routes dynamic, 0 errors)
- `npm run typecheck` — ✅ No type errors
- All 40+ source files created and verified

## Next Steps

- **Epic 2**: Organize Your Research Notebooks — requires real Clerk keys for auth flow testing
- **Action needed**: Set up `.env.local` with real Clerk keys, Neon connection string, and Qdrant URL before starting Epic 2