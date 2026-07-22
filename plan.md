# AI Application — Architecture & Implementation Plan

> **Status:** Architecture v1.0
> **Role:** Senior Architecture Baseline
> **Purpose:** Define a clear, secure, scalable, and implementation-ready architecture for an AI application with conversations, knowledge ingestion, RAG, memory, guardrails, tools, and agentic orchestration.

---

# 1. Executive Summary

This document defines the target architecture for an AI application that allows authenticated users to:

* Have conversations with an AI system.
* Upload and manage documents.
* Build a private knowledge base.
* Retrieve relevant knowledge using RAG.
* Maintain short-term and long-term memory.
* Use tools and external capabilities.
* Apply deterministic security and authorization policies.
* Apply dynamic AI policies and guardrails.
* Route requests across different LLMs and models.
* Eventually support multi-step agentic workflows.

The architecture is designed around five major architectural planes:

```text
+------------------------------------------------------------------+
|                         CLIENT / API PLANE                       |
|                                                                  |
|       Web App       Mobile App       API Clients       SDKs      |
+-------------------------------+----------------------------------+
                                |
                                v
+------------------------------------------------------------------+
|                    APPLICATION / CONTROL PLANE                   |
|                                                                  |
| Auth | Users | Conversations | Messages | Files | AI Runtime    |
+-------------------------------+----------------------------------+
                                |
                 +--------------+--------------+
                 |                             |
                 v                             v
+--------------------------------+   +-----------------------------+
|       KNOWLEDGE PLANE          |   |      INTELLIGENCE PLANE     |
|                                |   |                             |
| File Ingestion                 |   | Query Understanding         |
| Parsing                        |   | Context Builder             |
| Chunking                       |   | Query Planning              |
| Metadata Extraction            |   | Guardrails / Policies       |
| Embeddings                     |   | Memory Manager              |
| Vector Search                  |   | Tool Manager                |
| Keyword Search                 |   | Model Router                |
| Reranking                      |   | Agent Execution             |
+----------------+---------------+   +---------------+-------------+
                 |                                   |
                 +------------------+----------------+
                                    |
                                    v
+------------------------------------------------------------------+
|                         DATA / MEMORY PLANE                      |
|                                                                  |
| PostgreSQL | Vector DB | Object Storage | Cache | Queue | Events |
+------------------------------------------------------------------+
```

The primary architectural principle is:

> **Keep the core application modular and simple first. Introduce distributed services only when scale, isolation, or operational requirements justify them.**

The initial implementation should therefore use a **modular monolith with asynchronous workers**, rather than immediately splitting every component into a microservice.

---

# 2. Architectural Goals

## 2.1 Primary Goals

The system should provide:

1. Secure multi-user access.
2. Strict tenant and user data isolation.
3. Reliable document ingestion.
4. High-quality RAG retrieval.
5. Context-aware conversations.
6. Persistent memory.
7. Configurable guardrails and policies.
8. Tool execution.
9. LLM/model routing.
10. Agentic orchestration.
11. Strong observability.
12. Easy local development.
13. Incremental scalability.
14. Clear boundaries between deterministic and AI-driven logic.

---

## 2.2 Non-Goals for Initial Version

The initial version should avoid:

* Premature microservices.
* Distributed transactions.
* Complex multi-agent architectures.
* Autonomous agents everywhere.
* LLM-based authorization.
* LLM-based security enforcement.
* Over-engineered event sourcing.
* Excessive model calls for simple operations.
* Replacing deterministic parsers with LLMs unnecessarily.

---

# 3. Core Architectural Principles

## Principle 1 — Security Is Deterministic

LLMs must never be responsible for enforcing authorization.

```text
BAD:

User
 |
 v
LLM
 |
 +--> "I think this user can access Document A"
```

Instead:

```text
User Request
     |
     v
Authentication
     |
     v
Authorization Policy
     |
     +---- DENY ----> Request Rejected
     |
     v
Authorized Scope
     |
     v
Retrieval / Tools / LLM
```

The LLM may reason over data that has already been authorized.

It must never decide whether a user is allowed to access the data.

---

## Principle 2 — Code First, LLM Second

Use deterministic code whenever possible.

| Operation                  | Preferred Implementation |
| -------------------------- | ------------------------ |
| Authentication             | Code                     |
| Authorization              | Code                     |
| MIME validation            | Code                     |
| File size validation       | Code                     |
| File type validation       | Code                     |
| Rate limiting              | Code                     |
| Chunking Markdown          | Parser                   |
| Chunking source code       | Language parser          |
| Chunking PDFs              | PDF parser               |
| Text normalization         | Code                     |
| Metadata extraction        | Small LLM where useful   |
| Topic extraction           | Small LLM                |
| Summarization              | Small LLM                |
| Query rewriting            | Small LLM                |
| Embeddings                 | Embedding model          |
| Vector retrieval           | Vector DB                |
| Keyword retrieval          | Search engine / DB       |
| Reranking                  | Reranker model           |
| Security policy            | Code                     |
| Output schema validation   | Code                     |
| Natural language reasoning | LLM                      |

---

## Principle 3 — Separate Ingestion From Query Execution

The document pipeline and user query pipeline are separate systems.

```text
                KNOWLEDGE INGESTION
                       |
                       v
              Documents / Files
                       |
                       v
                  Processing
                       |
                       v
                 Knowledge Base
                       |
                       |
                       +----------------+
                                        |
                                        v
USER QUERY -----------------------> RETRIEVAL
                                        |
                                        v
                                  AI RUNTIME
                                        |
                                        v
                                    RESPONSE
```

---

## Principle 4 — Start Modular, Not Microservices

Initial architecture:

```text
+-----------------------------------------------------------+
|                    APPLICATION                            |
|                                                           |
| Auth Module                                               |
| User Module                                               |
| Conversation Module                                       |
| Message Module                                            |
| File Module                                               |
| Knowledge Module                                          |
| Retrieval Module                                          |
| Memory Module                                             |
| Guardrail Module                                          |
| AI Runtime Module                                         |
| Agent Module                                              |
+-----------------------------------------------------------+
              |
              +------------------+
              |                  |
              v                  v
       Async Workers        Infrastructure
```

Extract services later only when justified by:

* Independent scaling.
* Long-running workloads.
* Different deployment requirements.
* Security isolation.
* Team ownership.
* Independent release cycles.

---

# 4. High-Level Architecture

```text
+------------------------------------------------------------------+
|                           CLIENTS                                |
|                                                                  |
| Web | Mobile | CLI | External API Consumers                      |
+-------------------------------+----------------------------------+
                                |
                                v
+------------------------------------------------------------------+
|                        API / EDGE LAYER                          |
|                                                                  |
| API Gateway | Authentication Middleware | Rate Limiting          |
+-------------------------------+----------------------------------+
                                |
                                v
+------------------------------------------------------------------+
|                     APPLICATION CONTROL PLANE                    |
|                                                                  |
| +---------+  +-------------+  +----------+  +----------------+  |
| |  Auth   |  |Conversation  |  |  Files   |  |   AI Runtime   | |
| +---------+  +-------------+  +----------+  +----------------+  |
+-------------------+----------------------+-----------------------+
                    |                      |
                    |                      |
          +---------+---------+            |
          |                   |            |
          v                   v            v
+------------------+   +----------------+--------------------------+
| KNOWLEDGE PLANE  |   |             INTELLIGENCE PLANE           |
|                  |   |                                          |
| Ingestion        |   | Query Understanding                       |
| Parsing          |   | Query Rewriting                           |
| Chunking         |   | Context Builder                           |
| Metadata         |   | Memory Manager                            |
| Embeddings       |   | Retrieval Manager                         |
| Vector Search    |   | Tool Manager                              |
| Keyword Search   |   | Model Router                              |
| Reranking        |   | Planner / Agent Executor                 |
+---------+--------+   +--------------------+---------------------+
          |                                 |
          +----------------+----------------+
                           |
                           v
+------------------------------------------------------------------+
|                        DATA PLANE                                |
|                                                                  |
| PostgreSQL | Vector DB | Object Storage | Redis | Queue           |
+------------------------------------------------------------------+
```

---

# 5. Architectural Planes

## 5.1 Client / API Plane

Responsible for external interaction.

Components:

```text
Web Client
Mobile Client
CLI
External API
SDK
```

Responsibilities:

* Authentication requests.
* Conversation requests.
* File uploads.
* Streaming responses.
* Conversation history.
* User settings.

The client should not directly access:

* Vector DB.
* PostgreSQL.
* Object storage internals.
* Internal tools.
* LLM providers.

---

# 5.2 Application / Control Plane

The application control plane manages business workflows.

Modules:

```text
+-----------------------+
| Authentication        |
+-----------------------+
| Users                 |
+-----------------------+
| Organizations/Tenants |
+-----------------------+
| Conversations         |
+-----------------------+
| Messages              |
+-----------------------+
| Files                 |
+-----------------------+
| AI Runtime            |
+-----------------------+
```

---

# 5.3 Knowledge Plane

The knowledge plane transforms raw information into searchable knowledge.

```text
Raw File
   |
   v
Validation
   |
   v
Parsing
   |
   v
Normalization
   |
   v
Chunking
   |
   +--------------------+
   |                    |
   v                    v
Metadata            Embedding
   |                    |
   |                    v
   |               Vector DB
   |
   v
PostgreSQL
```

---

# 5.4 Intelligence Plane

The intelligence plane decides how the AI system should respond.

```text
User Query
     |
     v
Query Understanding
     |
     v
Policy Evaluation
     |
     v
Context Builder
     |
     +---------> Memory
     |
     +---------> RAG
     |
     +---------> Tools
     |
     +---------> Conversation
     |
     v
Query Planner
     |
     v
Model Router
     |
     v
LLM / Agent Execution
     |
     v
Response Validation
```

---

# 5.5 Data / Memory Plane

Recommended initial storage model:

```text
+-----------------------+
| PostgreSQL            |
|-----------------------|
| Users                 |
| Tenants               |
| Conversations         |
| Messages              |
| Documents             |
| Chunks Metadata       |
| Memories              |
| Policies              |
| Tool Definitions      |
+-----------------------+

+-----------------------+
| Object Storage        |
|-----------------------|
| Original Files        |
| Parsed Artifacts      |
| Large Documents       |
+-----------------------+

+-----------------------+
| Vector Database       |
|-----------------------|
| Document Embeddings   |
| Memory Embeddings     |
| Query Embeddings      |
+-----------------------+

+-----------------------+
| Redis / Cache         |
|-----------------------|
| Sessions              |
| Rate Limits           |
| Temporary Context     |
| Caching               |
+-----------------------+

+-----------------------+
| Queue / Event Bus     |
|-----------------------|
| Ingestion Jobs        |
| Embedding Jobs        |
| Async Processing      |
+-----------------------+
```

---

# 6. Core Components

## 6.1 Authentication

Responsibilities:

* User authentication.
* Session/token management.
* Identity verification.
* Token validation.

```text
Client
  |
  v
Auth Endpoint
  |
  v
Identity Provider / Auth System
  |
  v
Session / Token
  |
  v
Authenticated Request
```

Authentication answers:

> Who is the user?

Authorization answers:

> What is this user allowed to access?

These must remain separate concepts.

---

## 6.2 Authorization

Authorization must be enforced before accessing:

* Documents.
* Chunks.
* Memories.
* Conversations.
* Tools.
* External resources.

Recommended scope model:

```text
Tenant
  |
  +--- User
  |
  +--- Workspace
          |
          +--- Conversation
          |
          +--- Documents
          |
          +--- Memories
          |
          +--- Tools
```

Every retrievable resource should carry enough ownership information to enforce access.

Example metadata:

```text
tenant_id
workspace_id
user_id
conversation_id
document_id
visibility
permissions
```

---

# 7. Knowledge Ingestion Architecture

The ingestion pipeline should be asynchronous.

```text
+---------+
|  User   |
+----+----+
     |
     | Upload
     v
+------------------+
| API              |
| Authenticate     |
| Authorize        |
| Validate         |
+--------+---------+
         |
         v
+------------------+
| Object Storage   |
| Original File    |
+--------+---------+
         |
         v
+------------------+
| Ingestion Queue  |
+--------+---------+
         |
         v
+------------------+
| Ingestion Worker |
+--------+---------+
         |
         v
+------------------+
| File Parser      |
+--------+---------+
         |
         v
+------------------+
| Normalization    |
+--------+---------+
         |
         v
+------------------+
| Chunking         |
+--------+---------+
         |
         +------------------+
         |                  |
         v                  v
+----------------+   +----------------+
| Metadata       |   | Embedding      |
| Extraction     |   | Generation     |
+--------+-------+   +--------+-------+
         |                    |
         v                    v
+----------------+   +----------------+
| PostgreSQL     |   | Vector DB      |
+----------------+   +----------------+
```

---

# 8. File Ingestion Stages

## Stage 1 — Upload

Validate:

* Authentication.
* Authorization.
* File size.
* MIME type.
* Extension.
* Content signature.

Do not trust only the filename extension.

---

## Stage 2 — Storage

Store original files in object storage.

```text
Document
    |
    +--> document_id
    +--> tenant_id
    +--> owner_id
    +--> object_storage_key
    +--> mime_type
    +--> size
    +--> checksum
    +--> created_at
```

---

## Stage 3 — Parsing

Convert files into normalized content.

```text
PDF
DOCX
Markdown
HTML
TXT
Code
CSV
JSON
       |
       v
Normalized Document
```

---

## Stage 4 — Chunking

Chunk according to content type.

```text
Document
   |
   +-- Markdown ----> Heading-aware chunks
   |
   +-- Code --------> AST / symbol-aware chunks
   |
   +-- PDF ---------> Page / section-aware chunks
   |
   +-- HTML --------> DOM / semantic chunks
   |
   +-- CSV ---------> Row / table chunks
```

Chunk metadata should include:

```text
chunk_id
document_id
tenant_id
owner_id
position
content
token_count
page_number
section
heading
created_at
```

---

## Stage 5 — Metadata Extraction

Optional LLM-powered enrichment:

```text
Chunk
  |
  v
Small LLM
  |
  +--> Summary
  +--> Topics
  +--> Tags
  +--> Entities
```

This should be asynchronous.

Metadata extraction must never block basic ingestion unless required.

---

## Stage 6 — Embedding

```text
Chunk
  |
  v
Embedding Model
  |
  v
Vector
  |
  v
Vector Database
```

Store embedding metadata that allows safe filtering.

---

# 9. Query Execution Architecture

The query pipeline is the primary runtime path.

```text
+---------+
|  User   |
+----+----+
     |
     v
+---------------------+
| API Request         |
+----------+----------+
           |
           v
+---------------------+
| Authentication      |
+----------+----------+
           |
           v
+---------------------+
| Authorization       |
+----------+----------+
           |
           v
+---------------------+
| Load Conversation   |
+----------+----------+
           |
           v
+---------------------+
| Query Understanding |
+----------+----------+
           |
           v
+---------------------+
| Policy Engine       |
+----------+----------+
           |
           v
+---------------------+
| Context Builder     |
+----------+----------+
           |
           +--------------------+
           |                    |
           v                    v
      Memory Manager       Retrieval Manager
           |                    |
           |                    v
           |              Hybrid Retrieval
           |                    |
           |              +-----+-----+
           |              |           |
           |              v           v
           |           Vector      Keyword
           |              |           |
           |              +-----+-----+
           |                    |
           |                    v
           |                 Reranker
           |                    |
           +---------+----------+
                     |
                     v
              Context Selection
                     |
                     v
               Query Planner
                     |
                     v
                Model Router
                     |
                     v
                  LLM / Agent
                     |
                     v
             Response Validation
                     |
                     v
                  Response
```

---

# 10. Query Understanding

The query understanding layer determines what the user is asking.

Possible outputs:

```text
intent
entities
keywords
query_rewrite
retrieval_required
memory_required
tool_required
conversation_required
```

Example:

```text
Original:

"Can you explain the authentication system from my backend project?"

Query Understanding:

intent = explanation
retrieval_required = true
memory_required = false
tool_required = false

query =
"Explain authentication architecture in the user's backend project"
```

---

# 11. Query Rewriting

The system may rewrite ambiguous queries.

```text
Conversation:

User:
"How does that work?"

Previous context:
"OAuth2 authentication"

Rewritten query:

"How does OAuth2 authentication work in the current project?"
```

The rewritten query should be used for retrieval.

The original query should remain available for response generation.

---

# 12. RAG Architecture

Recommended RAG pipeline:

```text
User Query
     |
     v
Query Understanding
     |
     v
Query Rewrite
     |
     v
Authorization Filter
     |
     v
Metadata Filter
     |
     v
+-----------------------+
| Hybrid Retrieval      |
|                       |
| Vector Search         |
| Keyword Search        |
+-----------+-----------+
            |
            v
        Merge Results
            |
            v
         Reranker
            |
            v
      Top Relevant Chunks
            |
            v
      Context Selection
            |
            v
        LLM Context
```

---

# 13. RAG Security

The most important RAG rule:

> **Authorization filtering must occur before unauthorized data reaches the LLM.**

Bad:

```text
All Documents
     |
     v
Vector Search
     |
     v
Top K Results
     |
     v
Check Permission
```

Correct:

```text
User Identity
     |
     v
Authorized Scope
     |
     v
Filtered Search
     |
     v
Vector / Keyword Retrieval
     |
     v
Reranking
     |
     v
LLM
```

Every query should be scoped by:

```text
tenant_id
workspace_id
user_id
permissions
document visibility
```

This prevents cross-user data leakage.

---

# 14. Hybrid Retrieval

Pure vector search is insufficient for many applications.

Recommended:

```text
                 Query
                   |
         +---------+---------+
         |                   |
         v                   v
    Semantic Search      Keyword Search
         |                   |
         v                   v
      Vector DB          Search Index
         |                   |
         +---------+---------+
                   |
                   v
             Result Fusion
                   |
                   v
               Reranker
                   |
                   v
              Final Context
```

Use:

* Vector search for semantic similarity.
* Keyword search for exact terms.
* Metadata filtering for precision.
* Reranking for final relevance.

---

# 15. Memory Architecture

Do not treat every piece of context as generic RAG.

Use explicit memory types.

```text
Memory
|
+-- Conversation Memory
|      |
|      +-- Current conversation
|
+-- Episodic Memory
|      |
|      +-- Past interactions
|
+-- Semantic Memory
|      |
|      +-- Extracted facts
|
+-- User Memory
|      |
|      +-- Preferences
|      +-- Long-term information
|
+-- Knowledge Memory
       |
       +-- Documents
       +-- External resources
```

---

# 16. Memory Lifecycle

```text
Conversation
     |
     v
Messages
     |
     v
Memory Extraction
     |
     v
Candidate Memory
     |
     v
Validation
     |
     v
Memory Store
     |
     v
Embedding
     |
     v
Vector DB
```

Memory retrieval:

```text
User Query
     |
     v
Memory Manager
     |
     +--> Recent Conversation
     |
     +--> Relevant Semantic Memory
     |
     +--> User Memory
     |
     v
Context Builder
```

Memory should include lifecycle controls:

```text
created_at
updated_at
expires_at
confidence
source
importance
```

---

# 17. AI Runtime

The AI Runtime is the central intelligence execution layer.

```text
+------------------------------------------------------+
|                    AI RUNTIME                        |
|                                                      |
|  +--------------------+                              |
|  | Request Context    |                              |
|  +---------+----------+                              |
|            |                                         |
|            v                                         |
|  +--------------------+                              |
|  | Policy Engine      |                              |
|  +---------+----------+                              |
|            |                                         |
|            v                                         |
|  +--------------------+                              |
|  | Query Planner      |                              |
|  +---------+----------+                              |
|            |                                         |
|       +----+----+                                    |
|       |         |                                    |
|       v         v                                    |
|    Memory    Retrieval                               |
|       |         |                                    |
|       +----+----+                                    |
|            |                                         |
|            v                                         |
|  +--------------------+                              |
|  | Context Builder    |                              |
|  +---------+----------+                              |
|            |                                         |
|            v                                         |
|  +--------------------+                              |
|  | Tool Manager       |                              |
|  +---------+----------+                              |
|            |                                         |
|            v                                         |
|  +--------------------+                              |
|  | Model Router       |                              |
|  +---------+----------+                              |
|            |                                         |
|            v                                         |
|  +--------------------+                              |
|  | Execution Engine   |                              |
|  +---------+----------+                              |
|            |                                         |
|            v                                         |
|  +--------------------+                              |
|  | Response Validator |                              |
|  +--------------------+                              |
+------------------------------------------------------+
```

The AI Runtime should own the execution lifecycle.

---

# 18. Query Planner

The planner determines what is needed.

Example:

```text
User Query
    |
    v
Planner
    |
    +-- Need conversation context? YES
    |
    +-- Need memory? YES
    |
    +-- Need RAG? YES
    |
    +-- Need tool? NO
    |
    +-- Need external search? NO
    |
    v
Execution Plan
```

Example plan:

```text
1. Load recent conversation.
2. Retrieve relevant user memory.
3. Rewrite query.
4. Retrieve authorized documents.
5. Rerank results.
6. Build context.
7. Call model.
8. Validate response.
9. Store response.
10. Extract candidate memory.
```

---

# 19. Model Router

Different tasks should use different models.

```text
                    Model Router
                         |
         +---------------+---------------+
         |               |               |
         v               v               v
      Small LLM       Large LLM       Embedding
         |               |               |
         |               |               |
   Classification    Reasoning       Vector Search
   Summarization     Planning
   Query Rewrite     Generation
   Metadata
```

Recommended model usage:

```text
Small Model
  |
  +-- Intent classification
  +-- Metadata extraction
  +-- Query rewriting
  +-- Summarization
  +-- Simple classification

Large Model
  |
  +-- Complex reasoning
  +-- Planning
  +-- Tool orchestration
  +-- Final response

Embedding Model
  |
  +-- Documents
  +-- Chunks
  +-- Memory
  +-- Queries
```

---

# 20. Guardrails and Policy Architecture

Guardrails should be divided into three layers.

```text
                    POLICY SYSTEM
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
     Security         Runtime        AI Guidance
      Policy           Policy          Policy
          |              |              |
          +--------------+--------------+
                         |
                         v
                  Effective Policy
                         |
                         v
                     AI Runtime
```

## 20.1 Security Policies

Deterministic.

Examples:

```text
User cannot access another tenant's documents.
User cannot execute unauthorized tools.
User cannot access private resources.
```

---

## 20.2 Runtime Policies

Examples:

```text
Maximum tool calls.
Maximum execution time.
Maximum context size.
Maximum token budget.
Allowed models.
Allowed tools.
```

---

## 20.3 AI Guidance

May be generated dynamically.

Examples:

```text
Task-specific instructions.
Domain-specific instructions.
Document-specific instructions.
Response formatting.
```

AI-generated guidance is never a replacement for security controls.

---

# 21. Guardrail Generation

Optional AI-powered process:

```text
System Policy
      |
      v
Domain Policy
      |
      v
Task Context
      |
      v
Small / Large LLM
      |
      v
Candidate Guardrails
      |
      v
Policy Validator
      |
      v
Curated Guardrails
      |
      v
AI Runtime
```

Generated guardrails must be validated before execution.

---

# 22. Tool Architecture

Tools should be explicitly registered.

```text
+---------------------+
| Tool Registry       |
+----------+----------+
           |
           +---- Search
           |
           +---- Browser
           |
           +---- Database
           |
           +---- Code Execution
           |
           +---- Internal API
           |
           +---- File Operations
```

Each tool should define:

```text
tool_id
name
description
input_schema
output_schema
permissions
timeout
rate_limit
risk_level
```

Tool execution:

```text
LLM / Planner
      |
      v
Tool Request
      |
      v
Policy Engine
      |
      +---- DENY
      |
      v
Tool Validator
      |
      v
Tool Executor
      |
      v
Tool Result
      |
      v
AI Runtime
```

---

# 23. Agent Architecture

Agents should be introduced after the core AI Runtime is stable.

```text
                    Orchestrator
                         |
                         v
                      Planner
                         |
             +-----------+-----------+
             |           |           |
             v           v           v
         Researcher    Coder       Reviewer
             |           |           |
             +-----------+-----------+
                         |
                         v
                    Executor
                         |
                         v
                     Validator
                         |
                         v
                      Result
```

Agents should not bypass:

* Authorization.
* Policy checks.
* Tool permissions.
* Resource limits.
* Observability.

---

# 24. Agent Execution Loop

```text
Request
   |
   v
Planner
   |
   v
Create Plan
   |
   v
Execute Step
   |
   v
Observe Result
   |
   v
Validate
   |
   +---- Failed ----> Retry / Replan
   |
   v
Next Step
   |
   v
Complete
```

Recommended limits:

```text
max_steps
max_tool_calls
max_execution_time
max_tokens
max_retries
max_cost
```

---

# 25. Data Model

Core entities:

```text
Tenant
  |
  +-- User
  |
  +-- Workspace
       |
       +-- Conversation
       |      |
       |      +-- Message
       |
       +-- Document
       |      |
       |      +-- Chunk
       |
       +-- Memory
       |
       +-- Tool Access
       |
       +-- Policies
```

---

# 26. Document Data Model

```text
Document
{
    id
    tenant_id
    workspace_id
    owner_id

    name
    mime_type
    size
    checksum

    storage_key

    status
    ingestion_version

    created_at
    updated_at
}
```

Chunk:

```text
Chunk
{
    id
    document_id

    tenant_id
    workspace_id
    owner_id

    content
    position

    page_number
    section
    heading

    token_count

    summary
    topics
    tags

    embedding_id

    created_at
}
```

---

# 27. Conversation Data Model

```text
Conversation
{
    id
    tenant_id
    workspace_id
    user_id

    title
    summary

    created_at
    updated_at
}
```

Message:

```text
Message
{
    id
    conversation_id
    user_id

    role
    content

    model
    token_usage

    created_at
}
```

---

# 28. Memory Data Model

```text
Memory
{
    id

    tenant_id
    workspace_id
    user_id
    conversation_id

    type

    content
    summary

    source
    confidence
    importance

    embedding_id

    created_at
    updated_at
    expires_at
}
```

---

# 29. Multi-Tenant Data Isolation

Every data access path must preserve tenant boundaries.

```text
Request
   |
   v
Authenticated User
   |
   v
Tenant Context
   |
   v
Authorization Scope
   |
   +--------------------+
   |                    |
   v                    v
PostgreSQL          Vector DB
   |                    |
   |                    |
   +---------+----------+
             |
             v
       Authorized Data
```

Never rely only on the LLM to prevent leakage.

---

# 30. Asynchronous Architecture

Long-running work should use asynchronous jobs.

```text
API
 |
 +--> Immediate Response
 |
 +--> Queue
       |
       +--> File Ingestion
       |
       +--> Parsing
       |
       +--> Chunking
       |
       +--> Metadata Extraction
       |
       +--> Embedding
       |
       +--> Memory Extraction
```

Recommended initial events:

```text
DocumentUploaded
IngestionStarted
DocumentParsed
ChunksCreated
MetadataExtracted
EmbeddingsGenerated
IngestionCompleted
IngestionFailed
MemoryCreated
```

---

# 31. Recommended Module Structure

Initial backend:

```text
src/
|
+-- modules/
|   |
|   +-- auth/
|   +-- users/
|   +-- tenants/
|   +-- workspaces/
|   |
|   +-- conversations/
|   +-- messages/
|   |
|   +-- files/
|   +-- ingestion/
|   +-- knowledge/
|   +-- retrieval/
|   |
|   +-- memory/
|   +-- guardrails/
|   +-- policies/
|   |
|   +-- ai-runtime/
|   +-- model-router/
|   +-- tools/
|   +-- agents/
|   |
|   +-- observability/
|
+-- infrastructure/
|   |
|   +-- database/
|   +-- vector-store/
|   +-- object-storage/
|   +-- cache/
|   +-- queue/
|   +-- llm/
|
+-- shared/
    |
    +-- types/
    +-- errors/
    +-- events/
    +-- config/
```

---

# 32. Component Dependency Rules

The architecture should enforce dependency direction.

```text
API
 |
 v
Application
 |
 v
Domain
 |
 v
Infrastructure
```

Infrastructure should not leak into domain logic.

Example:

```text
BAD:

ConversationService
    |
    +--> Direct PostgreSQL SQL
    +--> Direct OpenAI SDK
    +--> Direct Redis
```

Better:

```text
ConversationService
    |
    +--> ConversationRepository
    +--> LLMProvider
    +--> MemoryRepository
    |
    v
Infrastructure Adapters
```

Use interfaces at boundaries.

---

# 33. Observability

Every AI request should be traceable.

```text
Request
  |
  v
Trace ID
  |
  +--> Authentication
  |
  +--> Query Understanding
  |
  +--> Memory Retrieval
  |
  +--> RAG Retrieval
  |
  +--> Tool Calls
  |
  +--> LLM Calls
  |
  +--> Response Validation
  |
  v
Response
```

Track:

```text
request_id
trace_id
user_id
tenant_id
conversation_id

model
provider

input_tokens
output_tokens

latency
cost

retrieval_latency
retrieved_chunks

tool_calls
errors
retries
```

---

# 34. AI-Specific Observability

Track every model call:

```text
LLM Call
{
    request_id
    trace_id

    model
    provider

    prompt_tokens
    completion_tokens

    latency

    retry_count

    success
    error
}
```

For RAG:

```text
Retrieval
{
    query
    filters
    top_k

    vector_results
    keyword_results

    reranked_results

    retrieval_latency
}
```

This will be essential for debugging poor answers.

---

# 35. Error Handling

Errors should be classified.

```text
Client Errors
   |
   +-- Authentication
   +-- Authorization
   +-- Validation

Processing Errors
   |
   +-- Parsing
   +-- Chunking
   +-- Embedding

AI Errors
   |
   +-- Model unavailable
   +-- Context too large
   +-- Invalid output

Infrastructure Errors
   |
   +-- Database
   +-- Vector DB
   +-- Queue
   +-- Storage
```

Async jobs must support:

```text
retry
backoff
dead-letter queue
failure status
manual retry
```

---

# 36. API Boundaries

Initial API groups:

```text
/auth
/users
/tenants
/workspaces

/conversations
/messages

/files
/documents

/search
/retrieval

/memory

/tools

/ai
/agents
```

Example:

```text
POST /conversations
POST /conversations/:id/messages
GET  /conversations/:id

POST /documents
GET  /documents
DELETE /documents/:id

POST /ai/query
POST /ai/stream
```

---

# 37. Streaming

For conversational responses:

```text
Client
  |
  v
API
  |
  v
AI Runtime
  |
  v
LLM
  |
  +---- token ----+
  +---- token ----+
  +---- token ----+
  |
  v
Client
```

Streaming should not expose internal tool execution details unless explicitly designed to do so.

---

# 38. Initial Deployment Architecture

Start simple.

```text
                     Internet
                        |
                        v
                 +-------------+
                 | Load Balancer|
                 +------+------+
                        |
                        v
                 +-------------+
                 | API Server  |
                 +------+------+
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
      PostgreSQL      Redis       Object Store
          |
          v
      Vector DB

                 +-------------+
                 | Worker      |
                 +------+------+
                        |
                        v
                      Queue
```

Later:

```text
API
 |
 +--> API Instances
 |
 +--> AI Runtime Workers
 |
 +--> Ingestion Workers
 |
 +--> Agent Workers
```

---

# 39. Recommended Technology Categories

The architecture should keep provider-specific choices behind interfaces.

```text
LLMProvider
EmbeddingProvider
VectorStore
ObjectStorage
MessageQueue
Cache
SearchProvider
```

Example:

```text
interface LLMProvider {
    generate(request)
    stream(request)
}
```

Then:

```text
OpenAIAdapter
AnthropicAdapter
LocalModelAdapter
CustomProviderAdapter
```

This allows model providers to change without rewriting the AI Runtime.

---

# 40. Architecture Decision Records

The following decisions should be explicitly documented.

## ADR-001 — Modular Monolith First

Decision:

> Start with a modular monolith and asynchronous workers.

Reason:

* Faster development.
* Lower operational complexity.
* Easier refactoring.
* Clear module boundaries.

---

## ADR-002 — Asynchronous Document Ingestion

Decision:

> File processing occurs asynchronously.

Reason:

* Parsing can be slow.
* Embeddings can be expensive.
* LLM metadata extraction can be slow.
* User requests should not block.

---

## ADR-003 — Authorization Before Retrieval

Decision:

> Authorization scope must be applied before data reaches the LLM.

Reason:

* Prevent cross-user data leakage.
* Prevent cross-tenant leakage.

---

## ADR-004 — Hybrid Retrieval

Decision:

> Use vector + keyword retrieval with reranking.

Reason:

* Better semantic relevance.
* Better exact-match performance.

---

## ADR-005 — Deterministic Security

Decision:

> Security and authorization are enforced by code.

Reason:

* LLMs are probabilistic.
* Security cannot depend on model compliance.

---

## ADR-006 — AI Runtime as Central Execution Layer

Decision:

> All AI execution flows through the AI Runtime.

Reason:

* Centralized policies.
* Centralized model routing.
* Centralized observability.
* Easier future agent orchestration.

---

# 41. Implementation Roadmap

## Phase 0 — Architecture Foundation

Deliver:

```text
Product Requirements
Domain Model
System Context
Container Architecture
Data Model
ADRs
```

---

## Phase 1 — Application Foundation

Build:

```text
Authentication
Users
Tenants
Workspaces
Conversations
Messages
PostgreSQL
Basic LLM Provider
Streaming
```

Success criteria:

> A user can securely have an AI conversation.

---

## Phase 2 — Knowledge Ingestion

Build:

```text
File Upload
Object Storage
Validation
Async Queue
Parsing
Normalization
Chunking
Embedding
Vector Storage
```

Success criteria:

> A user can upload documents and index them.

---

## Phase 3 — RAG

Build:

```text
Query Rewriting
Authorization Filtering
Metadata Filtering
Vector Retrieval
Keyword Retrieval
Result Fusion
Reranking
Context Builder
Citations
```

Success criteria:

> A user can ask questions about authorized documents.

---

## Phase 4 — AI Runtime

Build:

```text
Query Understanding
Policy Engine
Query Planner
Memory Manager
Retrieval Manager
Tool Manager
Model Router
Response Validator
```

Success criteria:

> The system dynamically decides how to answer requests.

---

## Phase 5 — Memory

Build:

```text
Conversation Memory
Episodic Memory
Semantic Memory
User Memory
Memory Extraction
Memory Retrieval
Memory Lifecycle
```

Success criteria:

> The system can maintain useful long-term context.

---

## Phase 6 — Guardrails

Build:

```text
Security Policies
Runtime Policies
AI Guidance
Tool Policies
Output Validation
Resource Limits
```

Success criteria:

> AI behavior is controllable and secure.

---

## Phase 7 — Tools

Build:

```text
Tool Registry
Tool Schemas
Tool Permissions
Tool Executor
Timeouts
Retries
Audit Logs
```

Success criteria:

> The AI can safely execute authorized capabilities.

---

## Phase 8 — Agentic Runtime

Build:

```text
Planner
Orchestrator
Execution Engine
Multi-step Tasks
Replanning
Validation
Budget Controls
```

Success criteria:

> The system can complete multi-step tasks reliably.

---

# 42. Implementation Dependency Graph

```text
                    +------------------+
                    | Requirements     |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    | Domain Model     |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    | Core Application |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
       Conversation                    Knowledge
              |                             |
              |                     +-------+-------+
              |                     |               |
              |                     v               v
              |                  Ingestion      Retrieval
              |                     |               |
              +----------+----------+---------------+
                         |
                         v
                  +-------------+
                  | AI Runtime  |
                  +------+------+
                         |
              +----------+----------+
              |          |          |
              v          v          v
           Memory     Tools      Policies
              |          |          |
              +----------+----------+
                         |
                         v
                    Agent Runtime
```

---

# 43. Recommended MVP Boundary

The MVP should contain:

```text
+------------------------------------------------+
|                    MVP                         |
|                                                |
| Authentication                                 |
| Conversations                                 |
| Messages                                       |
| File Upload                                    |
| Document Ingestion                             |
| Chunking                                       |
| Embeddings                                     |
| Vector Search                                  |
| Authorization Filtering                        |
| Basic RAG                                     |
| Basic Conversation Memory                      |
| Single LLM Provider                            |
| Basic Observability                            |
+------------------------------------------------+
```

Do not put these into MVP unless required:

```text
Multi-agent orchestration
Complex planning
Autonomous agents
Multiple model providers
Advanced memory
Dynamic guardrail generation
Complex tool ecosystems
Distributed microservices
```

---

# 44. Target Architecture

The final system should conceptually look like:

```text
                                      USER
                                        |
                                        v
                              +------------------+
                              |   API / Gateway  |
                              +--------+---------+
                                       |
                                       v
                              +------------------+
                              | Auth + Policy    |
                              +--------+---------+
                                       |
                                       v
                              +------------------+
                              |   AI Runtime     |
                              +--------+---------+
                                       |
             +-------------------------+--------------------------+
             |                         |                          |
             v                         v                          v
      +-------------+          +---------------+          +-------------+
      |   Memory    |          |  Retrieval    |          |   Tools     |
      |   Manager   |          |   Manager     |          |   Manager   |
      +------+------+          +-------+-------+          +------+------+
             |                         |                         |
             v                         v                         v
       Memory Store             Vector + Search              Tool APIs
                                       |
                                       v
                                  Reranking
                                       |
                                       v
                              +------------------+
                              | Context Builder  |
                              +--------+---------+
                                       |
                                       v
                              +------------------+
                              |  Query Planner   |
                              +--------+---------+
                                       |
                                       v
                              +------------------+
                              |   Model Router   |
                              +--------+---------+
                                       |
                         +-------------+-------------+
                         |             |             |
                         v             v             v
                      Small LLM    Large LLM    Local Model
                         |
                         v
                  Response Validation
                         |
                         v
                       USER
```

---

# 45. Final Architectural Position

The architecture should be built around these core boundaries:

```text
                    APPLICATION
                         |
          +--------------+--------------+
          |                             |
          v                             v
       KNOWLEDGE                   INTELLIGENCE
          |                             |
          |                             |
     Ingestion                    AI Runtime
     Retrieval                    Planning
     Documents                    Memory
     Embeddings                   Tools
                                  Models
                                  Agents
          |                             |
          +--------------+--------------+
                         |
                         v
                      DATA
```

The most important architectural decisions are:

1. **Modular monolith first.**
2. **Async ingestion from day one.**
3. **AI Runtime as the central intelligence layer.**
4. **RAG and ingestion as separate pipelines.**
5. **Authorization before retrieval.**
6. **Hybrid retrieval instead of vector-only retrieval.**
7. **Deterministic security instead of LLM-enforced security.**
8. **Memory separated into explicit categories.**
9. **LLMs used only where semantic reasoning adds value.**
10. **Tools accessed through a permission-aware registry.**
11. **Agents built on top of the AI Runtime, not beside it.**
12. **Observability built into every AI execution path.**
13. **Provider abstraction for LLMs, embeddings, vector stores, and infrastructure.**
14. **Microservices introduced only when operationally justified.**

The resulting architecture is:

```text
                         +----------------+
                         |    CLIENTS     |
                         +-------+--------+
                                 |
                                 v
                         +----------------+
                         | API / AUTH     |
                         +-------+--------+
                                 |
                                 v
                    +--------------------------+
                    |    APPLICATION CORE      |
                    |                          |
                    | Conversations            |
                    | Files                    |
                    | AI Runtime               |
                    +------------+-------------+
                                 |
                +----------------+----------------+
                |                                 |
                v                                 v
      +-------------------+             +-------------------+
      | KNOWLEDGE PLANE   |             | INTELLIGENCE      |
      |                   |             | PLANE             |
      | Ingestion         |             | Query Understanding|
      | Parsing           |             | Planning          |
      | Chunking          |             | Memory            |
      | Embeddings        |             | Retrieval         |
      | Retrieval         |             | Tools             |
      | Reranking         |             | Model Routing     |
      +---------+---------+             | Agents            |
                |                       +---------+---------+
                |                                 |
                +----------------+----------------+
                                 |
                                 v
                    +--------------------------+
                    |      POLICY ENGINE       |
                    |                          |
                    | Authorization            |
                    | Guardrails               |
                    | Tool Permissions         |
                    | Runtime Limits           |
                    +------------+-------------+
                                 |
                                 v
                    +--------------------------+
                    |       DATA PLANE          |
                    |                          |
                    | PostgreSQL                |
                    | Vector DB                 |
                    | Object Storage            |
                    | Redis                    |
                    | Queue                    |
                    +--------------------------+
```

---

# 46. Recommended Next Engineering Sequence

The architecture is now ready to be converted into implementation work.

The recommended order is:

```text
1. Freeze requirements
        |
        v
2. Define domain entities
        |
        v
3. Define module boundaries
        |
        v
4. Define database schema
        |
        v
5. Define API contracts
        |
        v
6. Define authentication + authorization
        |
        v
7. Implement conversation core
        |
        v
8. Implement file ingestion
        |
        v
9. Implement retrieval
        |
        v
10. Implement AI Runtime
        |
        v
11. Implement memory
        |
        v
12. Implement policies / guardrails
        |
        v
13. Implement tools
        |
        v
14. Implement agents
        |
        v
15. Optimize / extract services where necessary
```

This order minimizes rework because the **agentic layer is built on top of stable primitives** rather than becoming the foundation itself.

---

# 47. Definition of Architecture Completion

The architecture should be considered implementation-ready when the following are finalized:

```text
[ ] Product requirements
[ ] Functional requirements
[ ] Non-functional requirements

[ ] Domain model
[ ] Bounded contexts
[ ] System context diagram
[ ] Container diagram
[ ] Component diagrams

[ ] Authentication flow
[ ] Authorization model
[ ] Tenant isolation model

[ ] File ingestion sequence
[ ] RAG sequence
[ ] AI runtime sequence
[ ] Memory lifecycle
[ ] Tool execution sequence
[ ] Agent execution sequence

[ ] PostgreSQL schema
[ ] Vector DB schema
[ ] Object storage strategy
[ ] Cache strategy
[ ] Queue strategy

[ ] API contracts
[ ] Event contracts
[ ] Internal interfaces

[ ] ADRs
[ ] Security model
[ ] Observability model

[ ] Epics
[ ] Stories
[ ] Implementation tasks
[ ] Dependency graph
[ ] Sprint plan
```

Once these artifacts are complete, implementation should proceed from the architecture rather than continuously redesigning the architecture during coding.

**Final recommendation:** treat this document as the **Architecture v1.0 baseline**. The next artifact should be a separate **Implementation Specification** that converts each section into concrete modules, interfaces, database tables, API contracts, events, and BMAD-compatible epics/stories. That is the point where the architecture becomes directly actionable by your development agents.
