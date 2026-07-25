# Comprehensive UML Diagrams: chaibookLM

> Formal UML & Mermaid Architectural Diagrams covering system overview, sequence flows, data models, state transitions, ER entities, activity flows, and requirements.

**Created:** 2026-07-25  
**Phase:** 3 — UML Architecture  
**Author:** Technical Writer & Architect  

---

## 1. Project Working Overview Diagram

High-level architecture showing user interactions, Next.js App Router, RAG Engine, 3 LLM Model Tiers, and Qdrant Vector Store.

```mermaid
flowchart TB
    subgraph Client["Browser Client (React UI)"]
        UI_Nav["Navigation & Header (UserButton)"]
        UI_Dash["Notebook Dashboard"]
        UI_Workspace["3-Column Workspace"]
        UI_Sources["Source Manager"]
        UI_Chat["Chat Component"]
        UI_Preview["Source Preview Panel (PDF/YT/Text)"]
    end

    subgraph Auth["Clerk Authentication"]
        ClerkProvider["ClerkProvider (Root Layout)"]
        Middleware["middleware.ts (Route Protection)"]
        SignIn["<SignIn /> — /sign-in"]
        SignUp["<SignUp /> — /sign-up"]
        UserButton["<UserButton /> (Navbar)"]
    end

    subgraph Server["Next.js Server API Layer"]
        API_Auth["auth() — Clerk server helper"]
        API_Notebooks["/api/notebooks (userId-scoped)"]
        API_Upload["/api/sources/upload"]
        API_RAG["/api/rag/query (SSE Stream)"]
    end

    subgraph RAGCore["RAG Pipeline & Parsers"]
        Parsers["Parsers (PDF, VTT, YT, Web, Text)"]
        Chunker["Intelligent Chunker (500t / 50t overlap)"]
        VectorEngine["Qdrant Vector Client"]
    end

    subgraph LLM_Services["Configurable AI Services (.env)"]
        MainLLM["MAIN LLM (Grounded Synthesis)"]
        LiteLLM["LITE LLM (Summaries & Titling)"]
        EmbedModel["EMBEDDING Model (Vectorization)"]
    end

    subgraph Storage["Infrastructure"]
        Qdrant[("Qdrant Vector DB (Docker)")]
        LocalDB[("Local State / File Store (userId-keyed)")]
    end

    Client --> Middleware
    Middleware -->|Unauthenticated| SignIn
    Middleware -->|Authenticated| Server

    UI_Sources -->|Upload File / URL| API_Upload
    UI_Chat -->|Submit Natural Language Query| API_RAG
    UI_Dash -->|Create / Open Notebook| API_Notebooks

    API_Notebooks --> API_Auth
    API_Upload --> API_Auth
    API_RAG --> API_Auth
    API_Auth -->|userId| LocalDB

    API_Upload --> Parsers --> Chunker --> EmbedModel
    EmbedModel -->|Vector Chunks| VectorEngine --> Qdrant

    API_RAG -->|Similarity Search| VectorEngine
    Qdrant -->|Top-K Context Chunks| API_RAG
    API_RAG -->|Context + Prompt| MainLLM
    MainLLM -->|Streamed Tokens + Citations| UI_Chat

    UI_Chat -->|Click Citation [N]| UI_Preview
```

---

## 2. Requirement Diagram

Maps functional & non-functional requirements to system modules.

```mermaid
requirementDiagram

    requirement req_grounded {
        id: "FR-3.4"
        text: "Grounded AI answers with inline citations [1], [2]"
        risk: High
        verifyMethod: Test
    }

    requirement req_multi_source {
        id: "FR-2.1"
        text: "Support 5 source types: PDF, Text, VTT, YouTube, Web"
        risk: Medium
        verifyMethod: Demonstration
    }

    requirement req_qdrant_isolation {
        id: "FR-1.2"
        text: "Isolated vector collections per notebook in Qdrant"
        risk: Medium
        verifyMethod: Inspection
    }

    requirement req_preview_deeplink {
        id: "FR-4.2"
        text: "Clicking citation opens PDF page / YT timestamp"
        risk: High
        verifyMethod: Demonstration
    }

    requirement req_design_tokens {
        id: "NFR-3"
        text: "Single-lever HSL color tokens in globals.css"
        risk: Low
        verifyMethod: Inspection
    }

    element RAG_Engine {
        type: component
    }

    element Source_Parsers {
        type: component
    }

    element Preview_Panel {
        type: component
    }

    element Design_Tokens {
        type: component
    }

    RAG_Engine - satisfies -> req_grounded
    RAG_Engine - satisfies -> req_qdrant_isolation
    Source_Parsers - satisfies -> req_multi_source
    Preview_Panel - satisfies -> req_preview_deeplink
    Design_Tokens - satisfies -> req_design_tokens
```

---

## 3. Sequence Diagram (Source Ingestion & Citation Querying)

Detailed sequence of interactions from file upload to streaming answer synthesis and citation deep-linking.

```mermaid
sequenceDiagram
    autonumber
    actor User as Knowledge Worker
    participant Clerk as Clerk Auth
    participant Mid as middleware.ts
    participant UI as Chat & Workspace UI
    participant API as Next.js API Route
    participant Parser as Source Parser
    participant Embed as Embedding Service
    participant Qdrant as Qdrant Vector DB
    participant MainLLM as Main LLM (Grounded)

    %% Auth Flow
    rect rgb(230, 240, 255)
    note right of User: Phase 0: Authentication
    User->>Mid: Navigate to /dashboard
    Mid->>Clerk: Check session token
    Clerk-->>Mid: Unauthenticated
    Mid-->>User: Redirect to /sign-in
    User->>Clerk: Submit credentials
    Clerk-->>User: Session established (userId)
    Mid->>API: Pass userId in request context
    end

    %% Ingestion Flow
    rect rgb(240, 248, 255)
    note right of User: Phase 1: Source Ingestion
    User->>UI: Upload Source (PDF / YT URL)
    UI->>API: POST /api/sources/upload (File / URL)
    API->>Clerk: auth() — validate & extract userId
    Clerk-->>API: userId confirmed
    API->>Parser: Parse & Extract Text + Metadata (page/timestamp)
    Parser-->>API: Extracted Documents
    API->>Embed: Request Vector Embeddings (Chunks)
    Embed-->>API: Vector Embeddings Array
    API->>Qdrant: Upsert Vectors to Collection (nb_<id>) with userId payload
    Qdrant-->>API: Upsert Success
    API-->>UI: Source Status: READY (Green Settle Animation)
    end

    %% Query & Citation Flow
    rect rgb(255, 245, 238)
    note right of User: Phase 2: Grounded Query & Citation Verification
    User->>UI: Submit Question
    UI->>API: POST /api/rag/query {notebookId, question}
    API->>Clerk: auth() — validate userId
    Clerk-->>API: userId confirmed
    API->>Embed: Embed Question String
    Embed-->>API: Query Vector
    API->>Qdrant: Search Top-K Similarity filtered by userId + notebookId
    Qdrant-->>API: Retrieved Context Chunks + Metadata
    API->>MainLLM: Synthesize Prompt (Context + Instructions)
    MainLLM-->>API: Streamed Tokens with Inline Citations [1]
    API-->>UI: SSE Stream (Render text + clickable [1] chip)
    User->>UI: Click Citation Chip [1]
    UI->>UI: Slide-in Preview Panel & Scroll to Cited Page / Seek Timestamp
    end
```

---

## 4. Class Diagram

Object-oriented representation of domain models, services, and parsers.

```mermaid
classDiagram
    class ClerkUser {
        +string userId
        +string email
        +string displayName
        +getNotebooks() Notebook[]
    }

    class Notebook {
        +string id
        +string userId
        +string title
        +Date createdAt
        +Date updatedAt
        +Source[] sources
        +string qdrantCollectionName
        +getStats() NotebookStats
    }

    class Source {
        +string id
        +string notebookId
        +string title
        +SourceType type
        +string urlOrPath
        +number sizeBytes
        +IndexingStatus status
        +Date createdAt
    }

    class SourceType {
        <<enumeration>>
        PDF
        PLAIN_TEXT
        VTT_TRANSCRIPT
        YOUTUBE_URL
        WEB_URL
    }

    class IndexingStatus {
        <<enumeration>>
        UPLOADING
        INDEXING
        READY
        FAILED
    }

    class VectorChunk {
        +string chunkId
        +string sourceId
        +string userId
        +number[] embedding
        +string text
        +ChunkMetadata metadata
    }

    class ChunkMetadata {
        +number pageNumber
        +number startTimestamp
        +number endTimestamp
        +string sectionHeader
    }

    class RAGEngine {
        +createCollection(notebookId)
        +ingestSource(source) IndexingResult
        +retrieveContext(notebookId, query, userId) VectorChunk[]
        +generateGroundedAnswer(query, chunks) ReadableStream
    }

    ClerkUser "1" *-- "0..*" Notebook : owns
    Notebook "1" *-- "0..*" Source : contains
    Source "1" *-- "0..*" VectorChunk : chunks into
    VectorChunk "1" *-- "1" ChunkMetadata : carries
    Source --> SourceType : has
    Source --> IndexingStatus : has
    RAGEngine ..> Notebook : operates on
    RAGEngine ..> VectorChunk : queries
```

---

## 5. State Machine Diagram (Source Lifecycle)

State transitions for a source document through ingestion.

```mermaid
stateDiagram-v2
    [*] --> UPLOADING : User drops file or submits URL

    state UPLOADING {
        [*] --> ValidatingSize
        ValidatingSize --> FileAccepted : Size <= 5MB & Total <= 50MB
        ValidatingSize --> FileRejected : Exceeds Capacity
    }

    FileRejected --> FAILED : Emit Error Toast

    FileAccepted --> INDEXING : Trigger Async Parsing

    state INDEXING {
        [*] --> ParsingContent
        ParsingContent --> GeneratingEmbeddings : Text & Metadata Extracted
        GeneratingEmbeddings --> UpsertingQdrant : Embeddings Created
        UpsertingQdrant --> IndexingSuccess : Qdrant Upsert OK
    }

    INDEXING --> FAILED : Processing Timeout / Parsing Error

    IndexingSuccess --> READY : Pulse-Settle Green Dot Animation

    READY --> [*] : Active & Queryable
    FAILED --> [*] : User Can Retry or Delete
```

---

## 6. Entity Relationship (ER) Diagram

Database schema for relational index & vector payload relations.

```mermaid
erDiagram
    CLERK_USER ||--o{ NOTEBOOK : owns
    NOTEBOOK ||--o{ SOURCE : contains
    NOTEBOOK ||--o{ CHAT_THREAD : has
    CHAT_THREAD ||--o{ MESSAGE : contains
    MESSAGE ||--o{ CITATION : references
    SOURCE ||--o{ VECTOR_CHUNK : produces

    CLERK_USER {
        string clerk_user_id PK
        string email
        string display_name
        datetime created_at
    }

    NOTEBOOK {
        string id PK
        string clerk_user_id FK
        string title
        datetime created_at
        datetime updated_at
        string collection_name
    }

    SOURCE {
        string id PK
        string notebook_id FK
        string title
        string source_type
        string file_path_or_url
        int size_bytes
        string status
        datetime created_at
    }

    VECTOR_CHUNK {
        string chunk_id PK
        string source_id FK
        string clerk_user_id FK
        string text_content
        int page_number
        int timestamp_start
        json vector_payload
    }

    CHAT_THREAD {
        string id PK
        string notebook_id FK
        datetime created_at
    }

    MESSAGE {
        string id PK
        string thread_id FK
        string sender_role
        string text_content
        datetime created_at
    }

    CITATION {
        string id PK
        string message_id FK
        string source_id FK
        string chunk_id FK
        int citation_index
        string snippet_preview
    }
```

---

## 7. Activity Diagram (Query & Source Viewer Navigation)

Step-by-step user and system flow during query execution and citation previewing.

```mermaid
flowchart TD
    Start([User Types Question in Workspace]) --> CheckSource{At Least 1 Source Ready?}
    
    CheckSource -- No --> PromptUpload[Display 'Add Source First' Tooltip & Input Disabled]
    PromptUpload --> End([Wait for Upload])

    CheckSource -- Yes --> SubmitQuery[Submit Query to API]
    SubmitQuery --> SearchVector[Qdrant Similarity Search in notebook collection]
    SearchVector --> SynthesizeAnswer[Stream Grounded Answer via MAIN LLM]
    SynthesizeAnswer --> RenderMessage[Render Streamed Message with Citation Pills [1], [2]]

    RenderMessage --> UserClick{User Clicks Citation Pill [1]?}
    UserClick -- No --> ContinueChat[User Continues Chatting]
    
    UserClick -- Yes --> OpenPreview[Slide Open Right Preview Panel]
    OpenPreview --> CheckType{Source Type?}

    CheckType -- PDF --> ScrollPDF[Render PDF & Jump to Page N]
    CheckType -- YouTube --> SeekYT[Render Player & Seek to Timestamp T]
    CheckType -- Text/VTT --> HighlightText[Render Text View & Highlight Line Segment]

    ScrollPDF --> Verify([User Verifies Claim in Original Source])
    SeekYT --> Verify
    HighlightText --> Verify
```
