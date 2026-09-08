# Graph Report - .  (2026-08-11)

## Corpus Check
- Large corpus: 1023 files · ~896,585 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 714 nodes · 1498 edges · 38 communities (30 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.7)
- Token cost: 377,143 input · 0 output

## Community Hubs (Navigation)
- Auth & Embeddings Adapters
- Backend Services & Jina Adapter
- Neon Repository Layer
- Product Brief & Competitive Landscape
- Architecture Reconciliation Review
- API Route Helpers
- Frontend Build Tooling
- TypeScript Project Config
- Package Dependencies
- Notebook Delete UI
- Notebook Client Actions
- Architecture Spine & ADs
- Chat Panel UI
- Epic 2: Notebooks
- Epic 4: Grounded Chat & Citations
- Frontend API Client Types
- Filebase Adapter
- Workspace Source Actions
- Source Showcase Panel
- Chunk Splitter
- Core Services Orchestration
- App Layout & Fonts
- Ingestion & Removal Hazards
- Citation & SSRF Safety
- Epic 1: Sign In
- Embedding & Reasoning Services
- LLM Adapter
- Sign-In Page
- Debug Label Component
- Auth Middleware
- Chat History Tests
- Project READMEs
- Next.js Config
- Next.js Env Types
- AD-10 Duplicate Node

## God Nodes (most connected - your core abstractions)
1. `NeonRepository` - 45 edges
2. `getBackend()` - 27 edges
3. `errorResponse()` - 26 edges
4. `LimitsService` - 24 edges
5. `SourceService` - 23 edges
6. `CitationSnapshot` - 20 edges
7. `Architecture Spine — chaibookLM v0.1` - 20 edges
8. `ChatMessage` - 19 edges
9. `ScoredChunk` - 18 edges
10. `IngestionService` - 17 edges

## Surprising Connections (you probably didn't know these)
- `BackendServices` --references--> `NeonRepository`  [EXTRACTED]
  app/api/lib/backend.ts → backend/src/adapters/neon/index.ts
- `BackendServices` --references--> `LimitsService`  [EXTRACTED]
  app/api/lib/backend.ts → backend/src/contexts/limits/index.ts
- `BackendServices` --references--> `NotebookService`  [EXTRACTED]
  app/api/lib/backend.ts → backend/src/contexts/notebooks/index.ts
- `AssistantMessageContent()` --indirect_call--> `chunkId()`  [INFERRED]
  components/chat/chat-panel.tsx → backend/src/chunking/splitter.ts
- `transformMarkersToChipLinks()` --indirect_call--> `chunkId()`  [INFERRED]
  components/chat/chat-panel.tsx → backend/src/chunking/splitter.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Grounded answer + citation pipeline (Epic 4 stories 4.1-4.5)** — _bmad_output_implementation_artifacts_epic_4_context_story_4_1, _bmad_output_implementation_artifacts_epic_4_context_story_4_2, _bmad_output_implementation_artifacts_epic_4_context_story_4_3, _bmad_output_implementation_artifacts_epic_4_context_story_4_4, _bmad_output_implementation_artifacts_epic_4_context_story_4_5 [EXTRACTED 1.00]
- **Consumers of the shared chunk kernel (AD-6)** — _bmad_output_planning_artifacts_architecture_architecture_chaibooklm_2026_08_06_architecture_spine_ingestionservice, _bmad_output_planning_artifacts_architecture_architecture_chaibooklm_2026_08_06_architecture_spine_vectorstorememorystrategy, _bmad_output_planning_artifacts_architecture_architecture_chaibooklm_2026_08_06_architecture_spine_citationmapper [EXTRACTED 1.00]
- **PRD FRs dropped from architecture-spine governance** — _bmad_output_planning_artifacts_architecture_architecture_chaibooklm_2026_08_06_reviews_review_reconcile_prd_fr10, _bmad_output_planning_artifacts_architecture_architecture_chaibooklm_2026_08_06_reviews_review_reconcile_prd_fr11, _bmad_output_planning_artifacts_architecture_architecture_chaibooklm_2026_08_06_reviews_review_reconcile_prd_fr12, _bmad_output_planning_artifacts_architecture_architecture_chaibooklm_2026_08_06_reviews_review_reconcile_prd_fr14 [EXTRACTED 1.00]
- **FR-10/11/12/14 Ungoverned Presentation Surfaces** — bmad_output_planning_artifacts_architecture_architecture_chaibooklm_2026_08_06_reviews_review_rubric_fr_coverage_gap, bmad_output_planning_artifacts_prds_prd_chaibooklm_2026_08_04_prd_fr10_walkthrough, bmad_output_planning_artifacts_prds_prd_chaibooklm_2026_08_04_prd_fr11_landing_page, bmad_output_planning_artifacts_prds_prd_chaibooklm_2026_08_04_prd_fr12_cookie_consent, bmad_output_planning_artifacts_prds_prd_chaibooklm_2026_08_04_prd_fr14_dark_mode [INFERRED 0.85]
- **Chunk Data Authority Decision Chain (proposal to addendum to tech-stack to AD-1)** — bmad_output_planning_artifacts_sprint_change_proposal_2026_08_06_chunk_authority_decision, bmad_output_planning_artifacts_prds_prd_chaibooklm_2026_08_04_addendum_chunk_data_authority_anchor, bmad_output_planning_artifacts_tech_stack_tech_stack_document, bmad_output_planning_artifacts_epics_ad1_chunk_data_authority [EXTRACTED 1.00]
- **shikigami SDK Surfaces Dropped from Architecture Spine** — bmad_output_planning_artifacts_shikigami_sdk_reasoningmanager, bmad_output_planning_artifacts_shikigami_sdk_kairo_templates, bmad_output_planning_artifacts_shikigami_sdk_guardrail_bypass_limitation, bmad_output_planning_artifacts_architecture_architecture_chaibooklm_2026_08_06_reviews_review_reconcile_stack_reasoningmanager_omission, bmad_output_planning_artifacts_architecture_architecture_chaibooklm_2026_08_06_reviews_review_reconcile_stack_guardrail_omission [INFERRED 0.85]

## Communities (38 total, 8 thin omitted)

### Community 0 - "Auth & Embeddings Adapters"
Cohesion: 0.06
Nodes (25): clerkClient, extractUserIdFromRequest(), validateSession(), EmbeddingResponse, EmbeddingsAdapter, QdrantAdapter, QdrantPoint, toUuid() (+17 more)

### Community 1 - "Backend Services & Jina Adapter"
Cohesion: 0.06
Nodes (27): BackendServices, JinaAdapter, parseSearchMarkdown(), stripImages(), rowToSource(), ChatService, FetchOnRefusalResult, FetchOnRefusalService (+19 more)

### Community 2 - "Neon Repository Layer"
Cohesion: 0.08
Nodes (15): NeonRepository, rowToChatMessage(), rowToLimitCounter(), rowToNotebook(), rowToUser(), DEFAULT_LIMITS, LimitsService, NOTE: Source size is checked at upload time via the ingest boundary, not (+7 more)

### Community 3 - "Product Brief & Competitive Landscape"
Cohesion: 0.06
Nodes (55): FR-7 Approval Gate Unbound, Brief Addendum: Competitive Landscape & Roadmap, Daily Credit Limit (10/day), Deep Research / Discover Sources = Parity Not Novelty, Google NotebookLM / Gemini Notebook, Citation-to-Original-View Loop (differentiator), Purely Neo-Brutalist Design Identity, Product Brief: chaibookLM (+47 more)

### Community 4 - "Architecture Reconciliation Review"
Cohesion: 0.07
Nodes (42): Composite Adapter Property (weakened in spine), Guardrail Omission (spine gap), Numeric Cost Limits Gap, ReasoningManager Omission, Reconciliation Review: Spine vs Tech Stack + shikigami SDK, Deployment Mermaid Diagram Parse Error, FR-10/11/12/14 Ungoverned in Capability Map, Multi-Store Delete Cascade Unbound (+34 more)

### Community 5 - "API Route Helpers"
Cohesion: 0.14
Nodes (26): errorResponse(), serializeNotebook(), serializeSource(), getBackend(), DELETE(), GET(), POST(), RouteContext (+18 more)

### Community 6 - "Frontend Build Tooling"
Cohesion: 0.06
Nodes (31): devDependencies, postcss, tailwindcss, @tailwindcss/postcss, tsx, @types/node, @types/react, @types/react-dom (+23 more)

### Community 7 - "TypeScript Project Config"
Cohesion: 0.06
Nodes (31): ./backend/src/*, ./components/*, dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+23 more)

### Community 8 - "Package Dependencies"
Cohesion: 0.08
Nodes (25): @clerk/nextjs, @clerk/types, driver.js, @glitch-guy0/shikigami, @neondatabase/serverless, next, dependencies, @clerk/nextjs (+17 more)

### Community 9 - "Notebook Delete UI"
Cohesion: 0.11
Nodes (16): DeleteNotebookDialog(), DeleteNotebookDialogProps, Button, ButtonProps, ButtonVariant, buttonVariantClasses, Card(), CardProps (+8 more)

### Community 10 - "Notebook Client Actions"
Cohesion: 0.17
Nodes (16): createNotebook(), daysUntilExpiry(), deleteNotebook(), deleteNotebooksBulk(), fetchNotebooks(), NotebookRecord, renameNotebook(), BulkDeleteBar() (+8 more)

### Community 11 - "Architecture Spine & ADs"
Cohesion: 0.12
Nodes (20): Spec 4.5: Persist Chat History with a Sliding Window, Architecture Spine — chaibookLM v0.1, AD-1: Chunk data authority — Qdrant is system of record, AD-12: Honest degradation scoped to AI/ingestion ops, AD-13: Web search is approval-gated, never unprompted, AD-14: Delete cascade order Qdrant→Filebase→Neon, AD-15: Qdrant hosting is a build decision, not a fork, AD-6: One shared chunk kernel, deterministically split (+12 more)

### Community 12 - "Chat Panel UI"
Cohesion: 0.20
Nodes (15): ChatTurnEvent, CitationSnapshot, ChatPanel(), ChatPanelProps, dtoToTurn(), nextId(), Turn, TurnStatus (+7 more)

### Community 13 - "Epic 2: Notebooks"
Cohesion: 0.15
Nodes (16): Epic 2 Context: Organize Your Research Notebooks, Epic 2: Organize Your Research Notebooks, Story 2.1: Create a notebook, Story 2.2: Open a notebook workspace, Story 2.3: Rename a notebook, Story 2.4: Delete and bulk-delete notebooks, Story 2.5: Auto-expire notebooks after one week, Epic 2 Task List (+8 more)

### Community 14 - "Epic 4: Grounded Chat & Citations"
Cohesion: 0.25
Nodes (14): In-band stream sentinel collision risk (CHAT_ERROR/CHAT_CITATIONS/CHAT_REFUSAL), Epic 4: Ask Questions, Get Verifiable Answers, Story 4.1: Ask questions and get grounded, streaming answers, Story 4.2: Render verifiable citation chips, Story 4.3: Open the Original View from a citation, Story 4.4: Refuse honestly and offer approval-gated fetch-on-refusal, Story 4.5: Persist chat history with a sliding window, Spec 4.1: Ask Questions and Get Grounded, Streaming Answers (+6 more)

### Community 15 - "Frontend API Client Types"
Cohesion: 0.20
Nodes (12): ApiErrorPayload, ChatHistoryResponse, createTextSource(), createWebSource(), NotebookListResponse, NotebookSingleResponse, SourceListResponse, SourceSingleResponse (+4 more)

### Community 16 - "Filebase Adapter"
Cohesion: 0.28
Nodes (6): encodeKey(), encodePathPart(), FilebaseAdapter, formatAmzDate(), hmac(), sha256Hex()

### Community 17 - "Workspace Source Actions"
Cohesion: 0.31
Nodes (10): clearFailedSources(), deleteSource(), deleteSourcesBulk(), fetchNotebook(), fetchSources(), request(), TABS, Workspace() (+2 more)

### Community 18 - "Source Showcase Panel"
Cohesion: 0.21
Nodes (9): fetchSourceContent(), formatBytes(), SourceContent, SourceRecord, ShowcasePanel(), ShowcasePanelProps, SourceCard(), SourceCardProps (+1 more)

### Community 19 - "Chunk Splitter"
Cohesion: 0.26
Nodes (10): chunkId(), RawChunk, Section, SplitChunk, splitFixed(), splitIntoHeadingSections(), splitMarkdown(), splitPlainText() (+2 more)

### Community 20 - "Core Services Orchestration"
Cohesion: 0.20
Nodes (10): WebSearchTool.searchWeb implementation, NeonRepository.findChatMessagesBefore (cursor pagination), AD-10: Limits — one counter owner, atomic enforcement, FetchOnRefusalService, JinaAdapter, LimitsService, NeonRepository, NotebookService (+2 more)

### Community 21 - "App Layout & Fonts"
Cohesion: 0.22
Nodes (6): archivoBlack, spaceGrotesk, spaceMono, metadata, Providers(), ProvidersProps

### Community 22 - "Ingestion & Removal Hazards"
Cohesion: 0.22
Nodes (9): Deferred Work Log, Spec 2: Organize Your Research Notebooks, Spec 3: Bring and Index Your Sources, AD-11: Notebook TTL is lazy, AD-4: Single writer for the chunk lifecycle, H1: chunkId determinism and span coordinate space undefined, H3: Removal has no ordering/atomicity across Neon+Qdrant+Filebase, H4: In-flight QStash ingestion vs removal/lazy TTL orphan resurrect (+1 more)

### Community 23 - "Citation & SSRF Safety"
Cohesion: 0.22
Nodes (9): SSRF DNS-rebinding/TOCTOU residual gap in snapshot capture, CitationChip component, Spec 4.3: Open the Original View from a Citation, ShowcasePanel component, AD-2: No rebuild on Qdrant loss, AD-7: Citation contract — markers validated, never trusted, CitationMapper, H5: Refusal gate races with mid-conversation removal (+1 more)

### Community 24 - "Epic 1: Sign In"
Cohesion: 0.32
Nodes (8): Epic 1 Context: Sign In & Own Your Workspace, Epic 1: Sign In & Own Your Workspace, Story 1.1: Bootstrap the workspace foundation, Story 1.2: Sign in with your account, Story 1.3: Scope and persist my workspace data per user, Story 1.4: Establish workspace limits and counters, Epic 1 Task List, Spec 1: Sign In and Own Your Workspace

### Community 25 - "Embedding & Reasoning Services"
Cohesion: 0.25
Nodes (8): AD-5: One embedding model, both sides, ChatService, EmbeddingService, GroundedAnswerReasoningStrategy, IngestionService / SourceIndexer, LlmAdapter, QdrantAdapter, VectorStoreMemoryStrategy

### Community 26 - "LLM Adapter"
Cohesion: 0.32
Nodes (4): ChatCompletionChoice, ChatCompletionChunk, LlmAdapter, streamTokens()

## Knowledge Gaps
- **138 isolated node(s):** `RouteContext`, `RouteContext`, `RouteContext`, `RouteContext`, `RouteContext` (+133 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CitationSnapshot` connect `Chat Panel UI` to `Auth & Embeddings Adapters`, `Neon Repository Layer`, `Frontend API Client Types`, `Workspace Source Actions`, `Source Showcase Panel`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `NeonRepository` connect `Neon Repository Layer` to `Auth & Embeddings Adapters`, `Backend Services & Jina Adapter`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `SourceService` connect `Backend Services & Jina Adapter` to `Auth & Embeddings Adapters`, `Neon Repository Layer`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `RouteContext`, `RouteContext`, `RouteContext` to the rest of the system?**
  _138 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Embeddings Adapters` be split into smaller, more focused modules?**
  _Cohesion score 0.057455540355677154 - nodes in this community are weakly interconnected._
- **Should `Backend Services & Jina Adapter` be split into smaller, more focused modules?**
  _Cohesion score 0.06342342342342343 - nodes in this community are weakly interconnected._
- **Should `Neon Repository Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.07932692307692307 - nodes in this community are weakly interconnected._