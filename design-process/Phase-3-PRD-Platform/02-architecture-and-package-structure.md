# Architecture & Package Structure: chaibookLM

> Comprehensive system architecture, package structure, directory tree, and environment configurations.

**Created:** 2026-07-25  
**Phase:** 3 — Technical Architecture  
**Architect:** Mimir / Architect Lead  

---

## 1. System Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14+ (App Router)** | React SSR, Server Actions, API Routes, Streaming responses |
| **Authentication** | **Clerk** | Managed auth flows (sign-up, sign-in, session, per-user data scoping) |
| **Styling & UI** | **Tailwind CSS + shadcn/ui** | Component design system with HSL CSS variables (`globals.css`) |
| **Typography** | **Fraunces / Inter / JetBrains Mono** | Display serif, body sans, mono source code font via `next/font` |
| **Vector Database** | **Qdrant (Local Docker)** | High-performance vector index with payload metadata filtering |
| **RAG Pipeline Engine** | **LangChain / Custom RAG Service** | Chunking, embedding generation, context retrieval |
| **Embedding Model** | **Configurable API Endpoint** | E.g. OpenAI `text-embedding-3-small` or Ollama embeddings |
| **LLM Provider** | **Configurable OpenAI-compatible API** | Supports 3 model tiers (`MAIN`, `LITE`, `EMBEDDING`) |

---

## 2. Directory & Package Structure

```
chaibookLM/
├── .env.example                       # Environment template
├── .env.local                         # Local secrets (gitignored)
├── middleware.ts                      # Clerk auth middleware (route protection)
├── docker-compose.yml                 # Local Qdrant infra
├── next.config.mjs                    # Next.js configuration
├── package.json                       # Dependencies & scripts
├── postcss.config.mjs                 # PostCSS config
├── tailwind.config.ts                 # Design tokens & color roles
├── app/                               # Next.js App Router
│   ├── globals.css                    # HSL CSS Custom Properties (Single Source of Truth)
│   ├── layout.tsx                     # Root layout (ClerkProvider, fonts, dark mode)
│   ├── page.tsx                       # Landing page (hero, live mini-demo, features)
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx  # Clerk <SignIn /> component route
│   │   └── sign-up/[[...sign-up]]/page.tsx  # Clerk <SignUp /> component route
│   ├── dashboard/
│   │   └── page.tsx                   # Protected: Notebooks grid dashboard
│   ├── notebook/
│   │   └── [notebookId]/
│   │       └── page.tsx               # Protected: 3-column workspace
│   └── api/
│       ├── notebooks/route.ts         # CRUD notebooks (auth-scoped by userId)
│       ├── sources/
│       │   ├── upload/route.ts        # Source upload & parser trigger
│       │   └── status/route.ts        # SSE / polling indexing status
│       ├── rag/
│       │   ├── query/route.ts         # Query RAG engine (streaming SSE)
│       │   └── vector-search/route.ts # Direct similarity testing API
│       └── health/route.ts            # System & Qdrant health check
├── components/                        # UI Components (shadcn re-themed)
│   ├── ui/                            # Base primitives (button, dialog, input, card)
│   ├── landing/                       # Hero, live demo, feature cards
│   ├── dashboard/                     # Notebook card, empty state, search bar
│   ├── workspace/                     # Workspace layout
│   │   ├── sidebar/                   # Source list, status dots, add modal
│   │   ├── chat/                      # Chat thread, message bubble, citation chip, input
│   │   └── preview/                   # PDF viewer, YT player, text/VTT highlighter
│   └── shared/                        # Navbar (with UserButton), footer, status indicators
├── lib/                               # Core Business Logic & Infrastructure
│   ├── auth.ts                        # Clerk server-side helpers (auth(), currentUser())
│   ├── db/                            # Local storage / index DB for notebooks & sources
│   ├── rag/                           # RAG Engine Core
│   │   ├── chunker.ts                 # Document chunkers (PDF, VTT, Text, Web, YT)
│   │   ├── embeddings.ts              # Embedding service client
│   │   ├── qdrant.ts                  # Qdrant client connection & collection management
│   │   └── synthesis.ts               # Grounded answer synthesis & prompt templates
│   ├── parsers/                       # Source Parsers
│   │   ├── pdf-parser.ts              # PDF extraction & page mapping
│   │   ├── youtube-parser.ts          # YouTube transcript & timestamp fetcher
│   │   ├── web-parser.ts              # HTML main content scraper
│   │   └── vtt-parser.ts              # Subtitle VTT timeline parser
│   └── utils.ts                       # Helper utilities (cn, formatting, validators)
├── design-process/                    # WDS Design Process Artifacts (Phases 0-7)
└── docs/                              # Project Documentation
```

---

## 3. Environment Variables Configuration (`.env.example`)

```env
# Server Port
PORT=3000
NODE_ENV=development

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Vector Database (Qdrant)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# File Limits
MAX_FILE_SIZE_MB=5
MAX_NOTEBOOK_SIZE_MB=50

# 1. Main LLM (Grounded Answer Synthesis)
MAIN_MODEL_BASE_URL=https://api.openai.com/v1
MAIN_MODEL_NAME=gpt-4o-mini
MAIN_MODEL_API_KEY=your_main_api_key_here

# 2. Lite LLM (Fast Titling, Summaries, Metadata Extraction)
LITE_MODEL_BASE_URL=https://api.openai.com/v1
LITE_MODEL_NAME=gpt-4o-mini
LITE_MODEL_API_KEY=your_lite_api_key_here

# 3. Embedding Model (Vector Embedding Generation)
EMBEDDING_MODEL_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL_NAME=text-embedding-3-small
EMBEDDING_MODEL_API_KEY=your_embedding_api_key_here
```
