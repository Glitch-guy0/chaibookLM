# Product Brief: chaibookLM (chaiRAG)

> Portfolio-grade AI Research Assistant demonstrating end-to-end modern RAG system design with source-grounded answers and interactive citation traceability.

**Created:** 2026-07-25  
**Updated:** 2026-07-25  
**Phase:** 1 — Product Brief  
**Agent:** Saga (Analyst)  
**Status:** Approved / Fully Confirmed  

---

## Executive Summary

**chaibookLM** (chaiRAG) is a web application demonstrating end-to-end modern RAG system design — from multi-format source ingestion pipelines through vector search to LLM-powered grounded generation. Built for knowledge workers managing fragmented research across dozens of files, it delivers answers grounded in specific sources, with every claim traceable to an interactive citation.

Users create isolated **notebooks** — self-contained workspaces holding curated collections of PDFs, plain text, website URLs, YouTube videos, and VTT transcripts. Each source is ingested, chunked, embedded, and indexed into Qdrant. Natural language questions retrieve the most relevant context and generate grounded answers with inline citations.

---

## The Problem

Knowledge workers drown in scattered documents across formats (PDFs, YouTube lectures, web articles, notes). Synthesizing answers across sources manually is slow and error-prone:
- **Ctrl+F** finds keywords but can't reason across documents.
- **Note-taking apps** store info but can't synthesize or answer.
- **General LLMs** hallucinate or lack specific document context.
- **NotebookLM** is closed source / Google ecosystem.

---

## The Solution

1. **Add sources** across 5 types: PDF, plain text, website URL, YouTube video, VTT transcript.
2. **Automated RAG processing**: intelligent chunking, vector embedding, vector storage in isolated notebooks in Qdrant.
3. **Natural language querying**: grounded streaming answers with inline citations.
4. **Interactive verification**: click citations to view exact source sections/timestamps.

---

## Platform Requirements & Technical Constraints

- **Source File Limits**: Max 5MB per individual file; Max 50MB total capacity per notebook.
- **Vector Database**: Qdrant (local container via `docker-compose`).
- **Authentication**: Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) — manages sign-up, sign-in, and per-user session context. All notebook data is scoped to the authenticated Clerk `userId`.
- **AI Model Architecture**: Fully flexible environment variable configuration supporting 3 distinct models:
  - `MAIN_MODEL_BASE_URL`, `MAIN_MODEL_NAME`, `MAIN_MODEL_API_KEY` (Main LLM for grounded answer synthesis)
  - `LITE_MODEL_BASE_URL`, `LITE_MODEL_NAME`, `LITE_MODEL_API_KEY` (Lite LLM for fast extraction & titling)
  - `EMBEDDING_MODEL_BASE_URL`, `EMBEDDING_MODEL_NAME`, `EMBEDDING_MODEL_API_KEY` (Embedding model for vectorization)

---

## Target Audience & User Goals

- **Knowledge Workers / Researchers**: Synthesize insights across multi-format documents rapidly.
- **Developers / Portfolio Reviewers**: Inspect clean, production-grade RAG architecture, citation UX, and full stack Next.js execution.

---

## Success Criteria

1. Reliable ingestion across all 5 source types without manual intervention.
2. 100% citation accuracy pointing to source location (page, timestamp, line highlight).
3. Onboarding a notebook and receiving first grounded answer in < 2 minutes.
4. Clear status indicators (uploading → indexing → ready).

---

## Scope (v1)

### Included in v1:
- Notebook management: Create, rename, delete, switch notebook context.
- Source ingestion: PDF, Plain Text, YouTube URL, VTT/Transcript, Web URL.
- RAG pipeline: Chunking, embedding generation, Qdrant vector storage, retrieval status.
- Query & Chat: Streaming grounded answers with inline clickable citations.
- Citation & Source Viewer: PDF viewer, YouTube timestamped player, text highlighter.
- Clean UI: Next.js + Tailwind + shadcn/ui.

### Explicitly Out for v1:
- Collaborative notebooks / team sharing.
- Audio podcast generation from sources (deferred bonus).
- Offline support.
- Native mobile app (responsive web only).
