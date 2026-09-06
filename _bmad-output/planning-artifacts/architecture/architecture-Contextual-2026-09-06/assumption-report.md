# Contextual — Architectural Decisions & Assumptions Questionnaire

**Date:** 2026-09-06  
**Author:** Winston (System Architect)  
**Status:** Pending User Approval  
**Scope:** Contextual v1 (Direct Production Release)  
**Companion Planning Diagrams:** `planning-artifacts/c4/` & `planning-artifacts/flows/`

---

## Executive Summary

Following the **Fast Path** planning workflow under [`dbw-planning-workflow`](file:///Users/prajwal/Documents/learning/Contextual/.agent/skills/dbw-planning-workflow/SKILL.md), the system architecture has been visually mapped and structured based on [PRD v1](file:///Users/prajwal/Documents/learning/Contextual/_bmad-output/planning-artifacts/prds/prd-contextual-v1-2026-09-05/prd.md), [addendum.md](file:///Users/prajwal/Documents/learning/Contextual/_bmad-output/planning-artifacts/prds/prd-contextual-v1-2026-09-05/addendum.md), and [tech-stack.md](file:///Users/prajwal/Documents/learning/Contextual/_bmad-output/planning-artifacts/tech-stack.md).

All baseline architecture diagrams have been generated in `planning-artifacts/`:
- **L1 System Context:** [`planning-artifacts/c4/system-context.mmd`](file:///Users/prajwal/Documents/learning/Contextual/planning-artifacts/c4/system-context.mmd)
- **L2 Containers:** [`planning-artifacts/c4/containers.mmd`](file:///Users/prajwal/Documents/learning/Contextual/planning-artifacts/c4/containers.mmd)
- **L3 Ingestion Pipeline:** [`planning-artifacts/c4/components/ingestion.mmd`](file:///Users/prajwal/Documents/learning/Contextual/planning-artifacts/c4/components/ingestion.mmd)
- **L3 LangChain RAG & Chat:** [`planning-artifacts/c4/components/chat.mmd`](file:///Users/prajwal/Documents/learning/Contextual/planning-artifacts/c4/components/chat.mmd)
- **Flows:** Ingestion ([`sequence-ingestion.mmd`](file:///Users/prajwal/Documents/learning/Contextual/planning-artifacts/flows/sequence-ingestion.mmd)), Chat ([`sequence-chat.mmd`](file:///Users/prajwal/Documents/learning/Contextual/planning-artifacts/flows/sequence-chat.mmd)), Lifecycle ([`sequence-lifecycle.mmd`](file:///Users/prajwal/Documents/learning/Contextual/planning-artifacts/flows/sequence-lifecycle.mmd)).

Below are **6 load-bearing architectural decisions and assumptions** requiring your explicit review and sign-off before code implementation.

---

## Architectural Decisions & Assumptions Questionnaire

### Decision 1: Qdrant Multi-Tenancy & Collection Strategy (RAM Optimization)

- **Context:** PRD §4.4 references `getCollectionName(event.data.userId)` (one collection per user). 
- **The Trade-Off:** On the **Qdrant Cloud Free Tier (1GB RAM cluster)**, each collection allocates fixed memory overhead for HNSW graph indexes and segment managers. If 50–100 active users each create a collection, the 1GB cluster RAM will be rapidly exhausted, risking 503 OOM crashes.
- **Winston's Recommended Solution:**
  Use a **single unified collection** (`contextual_chunks_v1`) with indexed payload fields:
  ```json
  {
    "notebookId": "keyword (indexed)",
    "userId": "keyword (indexed)",
    "sourceId": "keyword (indexed)"
  }
  ```
  All vector queries apply strict filter: `must: [{ key: "notebookId", match: { value: currentNotebookId } }, { key: "userId", match: { value: currentUserId } }]`.
  - *Benefits:* 10x lower memory overhead, sub-50ms query times, clean atomic deletes by `notebookId` or `sourceId`, and stays well within the free tier budget.
- **Your Options:**
  - `[A] (Recommended)` Unified collection `contextual_chunks_v1` with payload index filtering.
  - `[B]` Per-user isolated collections (`contextual_user_{userId}`).

user feedback: A (no graphDB will be used in this project)
---

### Decision 2: Inngest PDF Text Extraction Execution in Serverless

- **Context:** FR-3 and FR-8 specify asynchronous PDF ingestion via Inngest `step.run("extract-raw-content")` and `step.run("process-to-intermediate-text")`. 
- **The Trade-Off:** Native C++ PDF tools (`poppler`, `pdftotext`) cannot be deployed inside Vercel serverless functions without complex custom container runtimes. Standard `pdfjs-dist` in Node requires canvas shims and worker mocking that often break on edge/serverless runtimes.
- **Winston's Recommended Solution:**
  Implement `PDFPageTextExtractor` using a pure-JavaScript serverless-tested PDF parser (`unpdf` or `pdf-parse` with page-by-page buffer slicing) inside the Inngest step.
  - Returns `IntermediateTextDocument` with array of page blocks:
    ```typescript
    sections: { text: string; pageNumber: number }[]
    ```
  - Chunker splits each page independently into ~500 token segments while preserving `pageNumber: number` in the chunk metadata.
- **Your Options:**
  - `[A] (Recommended)` Pure-JS serverless page-by-page parser (`unpdf` / `pdf-parse`).
  - `[B]` Offload PDF text extraction to an external OCR/document extraction API.

user feedback: A
---

### Decision 3: YouTube Captions Extraction (Keyless vs Google API Key)

- **Context:** FR-5 specifies fetching official or auto-generated subtitle tracks from YouTube URLs.
- **The Trade-Off:** The official Google YouTube Data v3 API requires every developer/deployer to configure a Google Cloud Console project, enable the API, create an API key, and manage a strict daily quota (10,000 units/day, where caption lists cost quota). Alternatively, keyless caption scraping libraries (`youtube-transcript`) fetch public timedtext XML tracks directly without API keys or quota limits.
- **Winston's Recommended Solution:**
  Use a keyless, zero-config YouTube transcript fetcher (`youtube-transcript` with direct timedtext fallback) in `YouTubeCaptionsAdapter`:
  - Parses video ID from standard (`youtube.com/watch?v=...`) and short (`youtu.be/...`) links.
  - Fetches timestamp cues `{ timestamp: "04:15", text: "..." }`.
  - If no captions exist, throws deterministic error immediately, transitioning source to `status: "failed"` with: *"No captions or transcript available for this YouTube video. Try uploading an .srt transcript file."* (Realizes UJ-1 Edge Case).
- **Your Options:**
  - `[A] (Recommended)` Keyless `youtube-transcript` extraction (zero credential setup, zero quota costs).
  - `[B]` Official Google Cloud YouTube Data v3 API (requires `YOUTUBE_API_KEY` in `.env.local`).

user feedback: A
---

### Decision 4: Daily Credit Governor Calculation (Dynamic Rolling 24h vs Cron Job)

- **Context:** FR-25 specifies 10 credits per day on a rolling 24-hour window. FR-29 specifies logging every chat prompt in `telemetry_chat_prompts` with `createdAt`.
- **The Trade-Off:** Maintaining a separate stateful balance counter that gets decremented on chat and periodically incremented by a cron job introduces race conditions, clock drift, and sync bugs.
- **Winston's Recommended Solution:**
  Calculate credits **statelessly and dynamically** against Neon:
  ```sql
  SELECT COUNT(*)::int AS used_credits 
  FROM telemetry_chat_prompts 
  WHERE user_id = $1 
    AND created_at > NOW() - INTERVAL '24 hours'
    AND credit_cost > 0;
  ```
  - Remaining credits = `Math.max(0, 10 - used_credits)`.
  - Oldest consumed credit timestamp gives exact countdown until next reset (`resetInHours`).
  - Atomicity is guaranteed: zero chance of drift or desynchronization between counters and telemetry.
- **Your Options:**
  - `[A] (Recommended)` Dynamic rolling window calculated directly from `telemetry_chat_prompts`.
  - `[B]` Stateful `limit_counters` table with an hourly Inngest replenishment cron.

user feedback: have a strict reset time aka 12AM IST. which currently even notebook also be deleted at that point of time to do this job during that time period. also clear things from DB at this point too; except analytics data keep it as it is and aggregate all daily recorded data into one single record (olap processing)
---

### Decision 5: Deep Original View Highlighting & Span Preservation Strategy

- **Context:** FR-16 to FR-19 require that clicking citation `[1]` opens the Showcase pane and scrolls/highlights the exact passage in context across all 5 modalities.
- **The Trade-Off:** Storing absolute character offsets (`span: { start: 1042, end: 1180 }`) from raw files is fragile: markdown formatters, Firecrawl sanitizers, and PDF renderers alter whitespace, causing absolute index offsets to land off-target.
- **Winston's Recommended Solution:**
  Adopt a **hybrid anchor contract**:
  1. **Canonical Chunk Payload:** Stores an exact text snippet (`excerpt: text.slice(0, 160)`) + type-specific structural locator:
     - **PDF:** `{ pageNumber: number, excerpt: string }`
     - **YouTube / Transcript:** `{ timestampSeconds: number, timestampLabel: "04:15" }`
     - **Web:** `{ link: string, excerpt: string }`
     - **Text:** `{ excerpt: string }`
  2. **Showcase Rendering:**
     - **PDF:** Jumps directly to `pageNumber`, executes PDF.js text-layer search for `excerpt`, and draws the cyan focus highlight.
     - **YouTube:** Embeds player with `start={timestampSeconds}&autoplay=1` and scrolls timestamped dialogue line.
     - **Web / Text:** Uses text-search highlighting to scroll to the matching passage and wraps it in a neo-brutalist `<mark class="cite-highlight">`.
- **Your Options:**
  - `[A] (Recommended)` Hybrid anchor contract (Structural locator + Text snippet search).
  - `[B]` Strict character byte offsets (`start_byte`, `end_byte`).

user feedback: will have a intermediate format that will be markdown; anything ingested will be first converted to markdown as intermediate format and then will be chunked and indexed this will resolve a lot of issues. with this we can go with option A.
---

### Decision 6: Vector Store Disaster Recovery Policy

- **Context:** In `tech-stack.md` line 36: *"Chunk authority & recovery — Qdrant is the sole record of chunk-level data; Neon never stores chunk content. Qdrant loss is not rebuilt by re-indexing; the approved recovery is to delete the affected users' resource files from Cloudinary and surface an error to those users."*
- **Assumption for v1:**
  To maintain zero backup infrastructure costs on the free tier, we adopt this policy verbatim as invariant `AD-3`:
  - We do NOT maintain shadow chunk tables in Neon.
  - We do NOT maintain automated Qdrant snapshot backup pipelines.
  - If Qdrant cluster data is lost or corrupted, the system detects missing vector namespaces, purges orphaned Cloudinary assets, and surfaces a clear message asking the user to re-upload.
- **Your Options:**
  - `[A] (Recommended)` Adopt approved PRD recovery policy (zero shadow chunk tables, zero backup infra cost).
  - `[B]` Mirror all parsed chunk text in Neon DB as a fallback recovery store (increases Neon storage size significantly).

user feedback: will temporarly store the uploaded file just for ingestion delay once done the file will be deleted and user has to solely relay on the chat and outputs. we will not provide any kind of backup. so option A
---

## Next Steps

Please reply with your approval (e.g. *"Approved all recommended"* or specify choices for Decisions 1–6). Once approved:
1. I will update `docs/architecture.md` and lock down `ARCHITECTURE-SPINE.md`.
2. I will promote the planning diagrams from `planning-artifacts/` to `docs/c4/` and `docs/flows/`.
3. We will hand off to the implementation phase.
