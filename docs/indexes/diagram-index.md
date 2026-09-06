# Diagram Index

Master catalog of architecture diagrams for Contextual.

## C4 Model - Structure

| Level | Diagram | Description | Status |
|-------|---------|-------------|--------|
| L1 | [System Context](c4/system-context.mmd) | Users, Next.js 15, Inngest, Neon, Qdrant, Cloudinary, OpenAI, Firecrawl, YouTube, Tavily | ✅ Current (v1) |
| L2 | [Containers](c4/containers.mmd) | Next.js App Router, Inngest worker gateway, backend bounded contexts, ports & adapters | ✅ Current (v1) |
| L3 | [Components - Ingestion](c4/components/ingestion.mmd) | Inngest durable step-functions, per-user concurrency cap, memoized pipeline, failure isolation | ✅ Current (v1) |
| L3 | [Components - Chat](c4/components/chat.mmd) | LangChain RAG pipeline, credit governor check, scoped retrieval, SSE tokens, citation parser, refusal | ✅ Current (v1) |

## Flows - Behavior

| Diagram | Description | Status |
|---------|-------------|--------|
| [sequence-ingestion](flows/sequence-ingestion.mmd) | Asynchronous multi-modal ingestion pipeline with Inngest step memoization and failure isolation | ✅ Current (v1) |
| [sequence-chat](flows/sequence-chat.mmd) | Grounded chat interaction flow (credit check → Qdrant retrieval → LangChain LLM → citation pills → refusal fallback) | ✅ Current (v1) |
| [sequence-lifecycle](flows/sequence-lifecycle.mmd) | Midnight 12:00 AM IST auto-deletion purge cascade and rolling 24-hour credit window synchronization | ✅ Current (v1) |

## Integrations

| Service | Purpose | Diagram |
|---------|---------|---------|
| Inngest | Durable background step-functions & cron scheduler | [Containers](c4/containers.mmd), [Ingestion Components](c4/components/ingestion.mmd), [Lifecycle Flow](flows/sequence-lifecycle.mmd) |
| Qdrant | Vector store (system of record for chunk text, embeddings, and metadata) | [Containers](c4/containers.mmd), [Chat Components](c4/components/chat.mmd) |
| Neon | PostgreSQL for user/notebook metadata, limits, and telemetry | [Containers](c4/containers.mmd), [Chat Components](c4/components/chat.mmd) |
| Clerk | Authentication and session verification | [System Context](c4/system-context.mmd), [Containers](c4/containers.mmd) |
| Cloudinary | Blob storage for uploaded PDF binaries and raw transcripts | [Containers](c4/containers.mmd), [Ingestion Components](c4/components/ingestion.mmd) |
| OpenAI | Compatible endpoints for embeddings (1536d) and Chat LLM | [Chat Components](c4/components/chat.mmd), [Ingestion Components](c4/components/ingestion.mmd) |
| Firecrawl | Web content extraction into sanitized clean markdown | [Ingestion Components](c4/components/ingestion.mmd) |
| YouTube Captions | Automated or uploaded caption track cue extraction | [Ingestion Components](c4/components/ingestion.mmd) |
| Tavily | Approval-gated live web search on honest refusal | [Chat Components](c4/components/chat.mmd) |

## Related Documentation

- [Architecture Reference](../architecture.md) — Authoritative architecture decisions (AD-1 through AD-16)
- [Architecture Spine](../../_bmad-output/planning-artifacts/architecture/architecture-Contextual-2026-09-06/ARCHITECTURE-SPINE.md) — Invariants build substrate
- [Tech Stack](../../_bmad-output/planning-artifacts/tech-stack.md) — Pinned technologies and free-tier cost posture
- [Assumptions Report](../../assumption-report.md) — Approved architectural decisions & assumptions questionnaire