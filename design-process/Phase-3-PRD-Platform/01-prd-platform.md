# Product Requirements Document (PRD): chaibookLM

> The technical and functional specification for the portfolio-grade RAG AI Research Assistant.

**Created:** 2026-07-25  
**Phase:** 3 — PRD & Architecture Platform  
**Authors:** Project Manager, Architect, Tech Writer, UX Designer  
**Status:** Approved / Specification Ready  

---

## 1. Executive Summary

**chaibookLM** (chaiRAG) is a full-stack, Next.js-based web application providing source-grounded RAG answers with interactive citation traceability. Users manage isolated notebooks containing PDFs, plain text files, web URLs, YouTube videos, and VTT transcript files.

---

## 2. Core Functional Requirements

### 2.1 Notebook Management (FR-1)
- **FR-1.1**: Create, rename, list, and delete isolated notebooks.
- **FR-1.2**: Each notebook has an isolated vector collection in Qdrant (e.g. `nb_<uuid>`) **scoped by authenticated `userId`** from Clerk.
- **FR-1.3**: Notebook metadata (title, created date, source count, status) stored in local DB/file index, keyed by `userId`.

### 2.5 Authentication & User Identity (FR-5)
- **FR-5.1**: All routes are protected by Clerk middleware (`authMiddleware`). Unauthenticated requests redirect to `/sign-in`.
- **FR-5.2**: Sign-up and sign-in flows handled entirely by Clerk-hosted or embedded `<SignIn />` / `<SignUp />` components.
- **FR-5.3**: All server-side notebook and source lookups filter by `userId` obtained from `auth()` (Clerk server helper).
- **FR-5.4**: Public routes: `/` (Landing), `/sign-in`, `/sign-up`. All other routes are private.

### 2.2 Multi-Format Source Ingestion (FR-2)
- **FR-2.1**: Support 5 source types:
  1. `PDF` (.pdf, max 5MB) — PDF section & page extraction.
  2. `Plain Text` (.txt, .md, max 5MB) — Raw text chunking.
  3. `VTT Transcript` (.vtt, max 5MB) — Time-stamped subtitle chunking.
  4. `YouTube URL` — Auto-extraction of transcripts via YouTube API/scraper + timestamp preservation.
  5. `Web URL` — HTML main-content parsing & metadata extraction.
- **FR-2.2**: Enforcement of **5MB max file size** per file, and **50MB total notebook cap**.
- **FR-2.3**: Asynchronous background pipeline status: `uploading` → `indexing` → `ready` / `failed`.

### 2.3 RAG Retrieval & Generation (FR-3)
- **FR-3.1**: Intelligent chunking (default chunk size ~500 tokens with 50 token overlap).
- **FR-3.2**: Vector embedding generation via configurable `EMBEDDING_MODEL_BASE_URL` & `EMBEDDING_MODEL_NAME`.
- **FR-3.3**: Vector similarity search in Qdrant returning Top-K (default K=5) chunks with metadata (source_id, chunk_id, page_num, timestamp_start, text_snippet).
- **FR-3.4**: Grounded response synthesis via `MAIN_MODEL_NAME` with enforced system prompts requiring inline citation markers (`[1]`, `[2]`).
- **FR-3.5**: Streaming response delivery via Server-Sent Events (SSE) / Web streams.
- **FR-3.6**: Fast helper tasks (notebook titling, source summary) handled by `LITE_MODEL_NAME`.

### 2.4 Citation & Source Viewer UX (FR-4)
- **FR-4.1**: Inline clickable citation chips (`[1]`, `[2]`) rendered inside assistant chat messages.
- **FR-4.2**: Clicking a citation opens/swaps the right-hand **Source Preview Panel**.
- **FR-4.3**: Type-aware viewer behavior:
  - **PDF**: Renders PDF viewer navigated to specific cited page.
  - **YouTube**: Renders embedded player seeked to start timestamp (`t=120s`).
  - **Text/VTT**: Highlights cited paragraph/line in text view.
  - **Web URL**: Shows web preview card with URL link and extracted passage.

---

## 3. Non-Functional Requirements (NFR)

- **NFR-1 (Performance)**: Ingestion to `ready` state < 15 seconds for a 2MB PDF.
- **NFR-2 (Traceability)**: Zero uncited assertions in synthesized AI answers.
- **NFR-3 (Design Tokens)**: Zero raw hex codes in component files; 100% theme control via HSL variables in `globals.css`.
- **NFR-4 (Configurability)**: 100% configurable LLM and vector DB endpoints via environment variables.
- **NFR-5 (Security)**: All API routes validate Clerk `userId` on the server side before data access. Zero data cross-contamination between users.

---

## 4. Requirement Traceability Matrix

| Req ID | Feature | Target Persona | Validation Criteria |
| :--- | :--- | :--- | :--- |
| **FR-1.2** | Notebook Isolation | Rachel / Devon | Qdrant collections strictly scoped by `userId` + Notebook ID. |
| **FR-2.1** | 5 Source Types | Rachel | Successful ingestion of PDF, Text, VTT, YouTube, Web. |
| **FR-3.4** | Citation Synthesis | Rachel | AI responses contain inline `[N]` chips matching retrieved metadata. |
| **FR-4.2** | Citation Deep-link | Rachel | Clicking `[1]` opens right panel scrolled to page/timestamp. |
| **FR-5.1** | Auth Middleware | Both | Unauthenticated access to `/dashboard` or `/notebook` redirects to `/sign-in`. |
| **FR-5.3** | Per-User Data Scoping | Both | Notebooks belonging to user A are never accessible by user B. |
| **NFR-3** | Design Tokens | Devon | Theme changes live via `globals.css` HSL triplets. |
| **NFR-5** | Security | Both | All API routes reject requests with missing/invalid Clerk session. |
