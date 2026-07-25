---
title: chaiRAG — AI Research Assistant
status: draft
created: 2026-07-25
updated: 2026-07-25
---

# Product Brief: chaiRAG

## Executive Summary

chaiRAG is a portfolio-grade web application demonstrating end-to-end modern RAG system design — from source ingestion pipelines through vector search to LLM-powered grounded generation. Built for knowledge workers who manage fragmented research across dozens of files, it delivers what no general-purpose chatbot can: answers grounded in your specific sources, with every claim traceable to a citation.

Users create isolated "notebooks" — self-contained workspaces holding curated collections of PDFs, plain text, website URLs, YouTube videos, and VTT transcripts. Each source is ingested, chunked, embedded, and indexed. When a user asks a natural language question, the system retrieves the most relevant context and generates a grounded answer with inline citations. Clicking any citation opens the original source — a PDF at the relevant section, a YouTube video at the referenced timestamp, a text file highlighting the cited chunk.

The product solves a real pain point: the gap between having information scattered across files and actually extracting coherent, sourced answers from it. As a portfolio piece, it demonstrates clean architecture, thoughtful RAG pipeline design, and a user experience built around trust and traceability.

## The Problem

Knowledge workers today drown in documents. A single research project can involve dozens of PDFs, a handful of YouTube lectures, scattered web articles, and personal notes — all stored in different places, in different formats. When someone needs to synthesize an answer that draws on multiple sources, the process is manual, slow, and error-prone: open each file, search through it, copy-paste fragments, try to remember which document said what.

Existing tools offer partial solutions. Traditional search (Ctrl+F) finds keywords but can't reason across documents. Note-taking apps store information but can't answer questions about it. ChatGPT can answer questions but has no context about your specific sources — it hallucinates or defaults to generic training data. NotebookLM showed that groundable AI answers with citations are transformative, but it's a closed Google product.

The cost is real: hours wasted re-reading documents, answers that can't be traced to sources, and the nagging feeling that you missed something important buried in a PDF you read last week.

## The Solution

chaiRAG provides a clean, notebook-based workspace where users:

1. **Add sources** of five types — PDF, plain text, website URL, YouTube video, and VTT/transcript files — through a guided upload flow with clear status indicators (uploading → indexing → ready).

2. **Each source is automatically processed** through the RAG pipeline: content is extracted, chunked intelligently, embedded into vector representations, and stored in a vector database. Each notebook maintains its own isolated knowledge base.

3. **Ask natural language questions** and receive grounded answers. The system retrieves the most relevant chunks from the notebook's sources, feeds them as context to an LLM, and generates answers with inline citations.

4. **Verify every answer** by clicking citations that open the original source — a PDF at the relevant section, a YouTube video at the referenced timestamp, a text file highlighting the cited chunk.

The user should never receive an answer without knowing exactly where it came from.

## What Makes This Different

**Source-grounded by design, not bolted on.** Every architectural decision — from chunking strategy to citation UX — is oriented around one principle: traceability. Citations aren't an afterthought; they're the core product value.

**Multi-source type support.** Unlike most RAG demos that handle PDFs only, chaiRAG ingests five source types with type-aware processing: YouTube timestamps are preserved, PDF section references are tracked, transcripts are chunked with time markers, and websites are previewed inline.

**Notebook isolation.** Each notebook is a self-contained knowledge base. Sources in one notebook don't bleed into another — essential for users juggling multiple projects or clients.

## Technical Execution

- Clean, well-documented codebase with clear separation of concerns
- Retrieval-augmented generation pipeline demonstrates thoughtful chunking, embedding, and retrieval design
- Metadata handling preserved throughout ingestion and retrieval (source type, page/timestamp, chunk position)
- Streaming responses with proper error handling
- Prompt construction designed for grounded answers with minimal hallucinations
- Answers formatted clearly with proper structure and citation markers
- Evaluation criteria from the project plan are demonstrably met across all 10 categories
- README clearly explains architecture, retrieval flow, and setup

## Success Criteria

**User Success Signals:**
- Source ingestion completes reliably for all 5 source types without manual intervention
- Answers consistently reference the correct source material
- Citation links open the correct source location (PDF section, YouTube timestamp, text highlight, website preview)
- Source metadata is preserved correctly through ingestion, retrieval, and citation display
- Users can onboard a new notebook with sources and get their first answer in under 2 minutes
- Source status indicators accurately reflect indexing state at all times

**What success looks like in the user's words:**
- "I added 10 PDFs and a YouTube lecture to my notebook. In 30 seconds I found the exact answer I spent 2 hours searching for manually."
- "I can click every citation and see the exact page, timestamp, or section it came from."
- "I trust this tool because I can always verify its sources."

## Scope

**In for v1 (portfolio delivery):**
- Notebook management: create, rename, delete notebooks with isolation
- Source ingestion: PDF, plain text, YouTube URL, VTT/transcript, website URL
- RAG pipeline: chunking, embedding generation, vector storage, status tracking
- Querying: natural language questions with grounded, streaming answers
- Citations: inline citation buttons in every answer, source viewer panel
- Source viewer: PDF at relevant section, YouTube at timestamp, text/transcript highlighting
- Source management: upload status indicators, source removal, re-indexing
- Responsive, clean UI with loading states, empty states, smooth interactions

**Explicitly out for v1:**
- User authentication or multi-user support [ASSUMPTION: single-user or demo-only auth]
- Collaborative notebooks or sharing
- Podcast generation from sources (bonus feature, deferred)
- Personalized learning roadmaps from YouTube playlists (bonus feature, deferred)
- Production infrastructure (monitoring, rate limiting, abuse prevention)
- Mobile-native experience (responsive web only)
- Offline support
