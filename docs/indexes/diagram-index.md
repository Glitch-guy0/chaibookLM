# Diagram Index

Master catalog of architecture diagrams for chaibookLM.

## C4 Model - Structure

| Level | Diagram | Description | Status |
|-------|---------|-------------|--------|
| L1 | [System Context](c4/system-context.mmd) | Shows users and external systems | ✅ Current |
| L2 | [Containers](c4/containers.mmd) | Runtime units (Next.js, contexts, ports) | ✅ Current |
| L3 | [Components - Chat](c4/components/chat.mmd) | Chat bounded context internals | ✅ Current |
| L3 | [Components - Ingestion](c4/components/ingestion.mmd) | Ingestion bounded context internals | ✅ Current |

## Flows - Behavior

| Diagram | Description | Status |
|---------|-------------|--------|
| [sequence-chat](flows/sequence-chat.mmd) | Chat interaction flow (retrieval → LLM → citations) | ✅ Current |

## Integrations

| Service | Purpose | Diagram |
|---------|---------|---------|
| Qdrant | Vector store for chunks | [Containers](c4/containers.mmd) |
| Neon | PostgreSQL for user/notebook metadata | [Containers](c4/containers.mmd) |
| Clerk | Authentication | [System Context](c4/system-context.mmd) |
| LLM | Answer generation | [Chat Components](c4/components/chat.mmd) |
| Tavily | Web search on refusal | [Chat Components](c4/components/chat.mmd) |
| Firecrawl | Web content extraction | [Ingestion Components](c4/components/ingestion.mmd) |

## Related Documentation

- [Architecture Reference](../architecture.md) - Full architecture decisions (AD-1 through AD-16)
- [Tech Stack](../tech-stack.md) - Technology choices
- [Decisions](../decisions/) - Architecture Decision Records

## Maintenance

- Review diagrams when adding new bounded contexts
- Update on external service changes
- Verify sync with actual code using `dbw-documentation:verify-sync`