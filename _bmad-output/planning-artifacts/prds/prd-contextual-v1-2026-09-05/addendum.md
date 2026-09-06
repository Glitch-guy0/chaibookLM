# Addendum — Contextual v1 Technical Architecture & Downstream Handoff

Companion to `prd.md`. Captures deep implementation architecture, Inngest step schemas, PDF/YouTube extraction logic, neo-brutalist CSS tokens, and downstream team handoffs.

---

## 1. System Architecture & Component Interactions

```mermaid
flowchart TD
    subgraph Client [Next.js Client (React 19)]
        UI[Neo-Brutalist UI]
        TriPane[Tri-Pane Workspace: Sources | Chat | Showcase]
        SSE[SSE Streaming Receiver]
    end

    subgraph API [Next.js API Routes / App Router]
        RouteChat["POST /api/chat (Retrieval + SSE)"]
        RouteSources["POST /api/sources (Upload & Ingestion Trigger)"]
        RouteInngest["/api/inngest (Inngest Worker Handler)"]
    end

    subgraph InngestEngine [Inngest Durable Workflow Engine]
        StepExtract["step.run('extract-content')"]
        StepParse["step.run('parse-and-normalize')"]
        StepChunk["step.run('chunk-source')"]
        StepEmbed["step.run('generate-embeddings')"]
        StepUpsert["step.run('upsert-qdrant')"]
        StepStatus["step.run('update-neon-status')"]
    end

    subgraph ManagedServices [External Managed Infrastructure]
        Neon[(Neon Postgres: App State & Sources)]
        Qdrant[(Qdrant Vector DB: Chunks & Embeddings)]
        Cloudinary[(Cloudinary: PDF Binaries)]
        Firecrawl[Firecrawl API: Web Scraping]
        OpenAI[OpenAI Embeddings & Chat Completion]
        Tavily[Tavily Search API: Web Fallback]
    end

    UI --> RouteSources
    RouteSources --> Neon
    RouteSources -->|Dispatch Event| RouteInngest
    RouteInngest --> InngestEngine

    InngestEngine --> Cloudinary
    InngestEngine --> Firecrawl
    InngestEngine --> OpenAI
    InngestEngine --> Qdrant
    InngestEngine --> Neon

    TriPane --> RouteChat
    RouteChat --> Qdrant
    RouteChat --> OpenAI
    RouteChat --> Tavily
    RouteChat --> SSE
    SSE --> TriPane
```

---

## 2. Inngest Durable Step Function Contracts

All ingestion pipelines run through Inngest event triggers to guarantee zero serverless execution timeouts and automatic retries.

### Event Payload Schema: `source.ingest.*`
```typescript
interface IngestionEventPayload {
  name: 'source.ingest.text' | 'source.ingest.web' | 'source.ingest.pdf' | 'source.ingest.transcript' | 'source.ingest.youtube';
  data: {
    sourceId: string;
    notebookId: string;
    userId: string;
    sourceType: 'TEXT' | 'WEB' | 'PDF' | 'TRANSCRIPT' | 'YOUTUBE';
    payload: {
      rawText?: string;
      url?: string;
      cloudinaryUrl?: string;
      youtubeId?: string;
      fileName?: string;
    };
  };
}
```

### Intermediate Text Structure & Chunk Data Models

```typescript
// 1. Intermediate Structure (Text + Source Anchors)
export interface IntermediateTextDocument {
  sourceId: string;
  notebookId: string;
  userId: string;
  sourceType: 'TEXT' | 'WEB' | 'PDF' | 'TRANSCRIPT' | 'YOUTUBE';
  sourceName: string;
  sections: {
    text: string;
    pageNumber?: number; // Present for PDF
    timestamp?: string;   // Present for SRT/VTT/YouTube (e.g. "04:15")
    link?: string;        // Present for Web & YouTube deep links
  }[];
}

// 2. Type-Specific Chunk Metadata Models
export interface PdfChunkMetadata {
  sourceName: string;
  pageNumber: number;
}

export interface TextChunkMetadata {
  sourceName: string;
}

export interface TranscriptChunkMetadata {
  sourceName: string;
  timestamp: string; // e.g. "04:15"
}

export interface YouTubeChunkMetadata {
  sourceName: string;
  timestamp: string; // e.g. "12:40"
  link: string;      // e.g. "https://youtu.be/abc123xyz?t=760"
}

export interface WebChunkMetadata {
  sourceName: string;
  link: string;      // Canonical URL
}

export type ChunkMetadata =
  | PdfChunkMetadata
  | TextChunkMetadata
  | TranscriptChunkMetadata
  | YouTubeChunkMetadata
  | WebChunkMetadata;

// 3. Canonical Chunk Interface
export interface Chunk<TMetadata extends ChunkMetadata = ChunkMetadata> {
  chunkId: string;
  sourceId: string;
  notebookId: string;
  userId: string;
  text: string;
  metadata: TMetadata;
}

// 4. Qdrant Payload Record
export interface QdrantPointPayload {
  chunkId: string;
  sourceId: string;
  notebookId: string;
  userId: string;
  text: string;
  metadata: ChunkMetadata;
}
```

### Inngest Workflow Execution Steps
1. **`extract-raw-content`**:
   - `TEXT`: Ingests `payload.rawText` directly.
   - `WEB`: Calls `firecrawl.scrapeUrl(payload.url)` to get raw content.
   - `PDF`: Fetches binary buffer from Cloudinary URL.
   - `TRANSCRIPT`: Reads `.srt` or `.vtt` file buffer.
   - `YOUTUBE`: Fetches public caption tracks via YouTube Captions API using `youtubeId`.
2. **`process-to-intermediate-text`**:
   - Parses the extracted raw artifact into the uniform `IntermediateTextDocument`:
     - PDF: Extracts text blocks per page, associating `pageNumber` and `sourceName`.
     - Text: Normalizes raw text/markdown with `sourceName`.
     - Transcript (SRT/VTT): Converts cues to dialogue text with formatted `timestamp` ("MM:SS" or "HH:MM:SS") and `sourceName`.
     - YouTube: Extracts caption cues into text with formatted `timestamp`, video `link` (`&t=seconds`), and `sourceName`.
     - Web: Extracts clean markdown with page title as `sourceName` and canonical `link`.
3. **`chunk-intermediate-text`**:
   - Executes recursive character chunking (target size: ~500 tokens, 100 token overlap) on each section of the intermediate text.
   - Generates `Chunk` objects containing `chunkId`, `sourceId`, `notebookId`, `userId`, `text`, and the source-specific `metadata`.
4. **`generate-embeddings`**:
   - Batches chunks (max 20 per request) to OpenAI-compatible embedding API (`text-embedding-3-small`, 1536 dims).
   - Retries up to 3 times with exponential backoff on 429/500 errors.
5. **`index-qdrant`**:
   - Upserts vector points into Qdrant collection with `QdrantPointPayload`.
6. **`update-neon-status`**:
   - Updates source record in Neon:
     `UPDATE sources SET status = 'ready', chunk_count = $1, error_reason = NULL, updated_at = NOW() WHERE id = $2`

---

## 3. PDF & YouTube Deep Verification Mechanics

### PDF Ingestion & Verification
- **Cloudinary Storage:** User uploads PDF directly from browser via signed upload; binary is stored in Cloudinary.
- **Node.js Parser:** Next.js / Inngest handles extraction using `pdfjs-dist/legacy/build/pdf`. Each page's text items and bounds are parsed into discrete paragraphs.
- **Showcase Viewer:** Original View implements an embedded canvas viewer (using `react-pdf` or custom `pdfjs` canvas renderer). When a citation is clicked:
  1. The viewer jumps directly to `chunk.page`.
  2. The text layer searches for the chunk text string and applies an ink-bordered cyan highlighter overlay over the matched text span.
  3. A zoom controller and page navigation toolbar are fixed to the top of the viewer.

### YouTube & Transcript Ingestion & Verification
- **Captions Fetching:** Extracts transcript entries `{ text: string, offset: number, duration: number }`.
- **Chunk Anchor:** Chunks inherit the earliest `offset` in seconds as `startSeconds`.
- **Showcase Viewer:**
  - YouTube iframe embeds with `https://www.youtube.com/embed/{youtubeId}?start={startSeconds}&autoplay=1&enablejsapi=1`.
  - The transcript box beneath the video renders time-stamped chat turns (`04:12 - Speaker: "..."`).
  - Clicking any line in the transcript executes `player.seekTo(line.startSeconds)`.

---

## 4. Neo-Brutalist Design Tokens (CSS & Tailwind)

The following CSS variables and classes represent the single source of truth for all UI components:

```css
:root {
  /* Core Colors */
  --color-ink: #111111;
  --color-surface: #FFFFFF;
  --color-surface-elevated: #F8F7F4;
  --color-brand: #FFE500;
  --color-brand-hover: #E6CE00;
  --color-cite: #00E5FF;
  --color-error: #FF3B30;
  --color-success: #34C759;
  --color-focus-ring: #111111;

  /* Borders & Shadows */
  --border-width-base: 2px;
  --border-width-heavy: 3px;
  --shadow-card: 4px 4px 0px 0px #111111;
  --shadow-dialog: 8px 8px 0px 0px #111111;
  --shadow-button: 6px -6px 0px 0px #111111;
}

.dark {
  --color-ink: #FFFFFF;
  --color-surface: #16130D;
  --color-surface-elevated: #201C14;
  --color-brand: #FFE500;
  --color-brand-hover: #FFF04D;
  --color-cite: #00E5FF;
  --color-error: #FF453A;
  --color-success: #32D74B;
  --color-focus-ring: #FFE500;

  --shadow-card: 4px 4px 0px 0px #000000;
  --shadow-dialog: 8px 8px 0px 0px #000000;
  --shadow-button: 6px -6px 0px 0px #FFE500;
}

/* Slanted Button Utility */
.neo-button-slanted {
  transform: skewX(-6deg);
  border: 2px solid var(--color-ink);
  box-shadow: 6px -6px 0px 0px var(--color-ink);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.neo-button-slanted:hover:not(:disabled) {
  transform: skewX(-10deg) translate(-2px, 2px);
  box-shadow: 8px -8px 0px 0px var(--color-ink);
}

.neo-button-slanted:active:not(:disabled) {
  transform: skewX(0deg) translate(2px, -2px);
  box-shadow: 0px 0px 0px 0px var(--color-ink);
}

@media (prefers-reduced-motion: reduce) {
  .neo-button-slanted,
  .neo-button-slanted:hover,
  .neo-button-slanted:active {
    transform: none !important;
    box-shadow: 2px 2px 0px 0px var(--color-ink) !important;
  }
}
```

---

## 5. Telemetry Schemas & Query Specifications

Contextual enforces an ultra-lean telemetry layer in Neon Postgres strictly limited to two tables:

### 5.1 SQL Schema Definitions
```sql
-- 1. Chat Prompt Usage Telemetry (records every prompt fire)
CREATE TABLE IF NOT EXISTS telemetry_chat_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  prompt_length_chars INTEGER NOT NULL,
  credit_consumed INTEGER DEFAULT 1 NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_chat_created_at ON telemetry_chat_prompts (created_at);
CREATE INDEX IF NOT EXISTS idx_telemetry_chat_user_id ON telemetry_chat_prompts (user_id);

-- 2. File Upload Ingestion Telemetry (records count, type, and size of every file upload)
CREATE TABLE IF NOT EXISTS telemetry_file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('PDF', 'SRT', 'VTT', 'TEXT')),
  file_size_bytes BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_file_created_at ON telemetry_file_uploads (created_at);
CREATE INDEX IF NOT EXISTS idx_telemetry_file_type ON telemetry_file_uploads (file_type);
```

### 5.2 Canonical Analytical Queries
```sql
-- Daily prompt usage volume
SELECT 
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) AS total_prompts_fired,
  COUNT(DISTINCT user_id) AS active_chat_users,
  SUM(credit_consumed) AS total_credits_consumed
FROM telemetry_chat_prompts
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1 ORDER BY 1 DESC;

-- Daily file upload count, type breakdown, and total storage volume
SELECT 
  DATE_TRUNC('day', created_at) AS day,
  file_type,
  COUNT(*) AS files_uploaded_count,
  ROUND(SUM(file_size_bytes) / 1024.0 / 1024.0, 2) AS total_size_mb
FROM telemetry_file_uploads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1, 2 ORDER BY 1 DESC, 3 DESC;
```

---

## 6. Performance Testing & Concurrency Benchmarking Harness

### 6.1 Automated k6 Test Specification (`tests/perf/load-test.js`)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 20 },  // Ramp-up to 20 users
    { duration: '5m', target: 50 },  // Normal sustained load (50 concurrent users)
    { duration: '3m', target: 100 }, // Peak stress load (100 concurrent users)
    { duration: '2m', target: 0 },   // Ramp-down to 0
  ],
  thresholds: {
    'http_req_duration{type:chat_stream}': ['p(95)<1200'], // TTFT under 1.2s for 95% of requests
    'http_req_duration{type:source_upload}': ['p(95)<1500'], // Upload endpoint returns 201 < 1.5s
    'http_req_failed': ['rate<0.02'], // Error rate below 2%
  },
};

export default function () {
  const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer test-token` };

  // 1. Send Grounded Chat Prompt
  const chatPayload = JSON.stringify({
    notebookId: '11111111-1111-1111-1111-111111111111',
    message: 'Summarize the core architectural pillars from the uploaded sources.',
  });

  const chatRes = http.post(`${BASE_URL}/api/chat`, chatPayload, {
    headers,
    tags: { type: 'chat_stream' },
  });

  check(chatRes, {
    'chat response status is 200': (r) => r.status === 200,
  });

  // Pacing: User reads answer for 20 seconds
  sleep(20);
}
```

---

## 7. Downstream Handoff Checklists

### 7.1 System Architect Handoff (Winston / `bmad-architecture`)
- [ ] Define Neon DB schema migrations for multi-modal source metadata (`cloudinary_url`, `youtube_id`, `page_count`, `duration_seconds`, `error_reason`).
- [ ] Implement Neon telemetry tables (`telemetry_chat_prompts` and `telemetry_file_uploads`) with non-blocking write helper.
- [ ] Implement Inngest function handlers under `app/api/inngest/route.ts` with error traps, automatic retries, and per-user concurrency (`limit: 2`).
- [ ] Setup Qdrant payload index for `notebookId` and `sourceType`.
- [ ] Configure Tavily search client for approval-gated fallback.
- [ ] Setup rolling 24-hour daily credit reset counter in Postgres.
- [ ] Set up k6 load test script (`tests/perf/load-test.js`) and run baseline benchmarks against preview environment.

### 7.2 UX / UI Designer Handoff (Sally / `bmad-ux`)
- [ ] Complete tri-pane desktop workspace layout (25% / 45% / 30%).
- [ ] Validate responsive breakpoint behavior (Desktop 3-column → Tablet 2-column + drawer → Mobile 3 tabs).
- [ ] Design mobile sticky `← Back to Chat` button for Showcase view.
- [ ] Verify WCAG 2.2 AA contrast ratios on all neo-brutalist dark mode tokens.
- [ ] Refine Driver.js onboarding tour steps for multi-modal sources and citation clicks.

### 7.3 Developer Implementation Handoff (Amelia / `bmad-create-epics-and-stories`)
- [ ] **Epic 1:** Multi-Modal Ingestion Pipelines (PDF upload & extraction, YouTube captions fetch, SRT/VTT parsing, Firecrawl integration).
- [ ] **Epic 2:** Inngest Workflow Orchestration (Durable step functions, retries, failure isolation, concurrency limits).
- [ ] **Epic 3:** Original View Showcase Viewers (PDF.js viewer with page jump, YouTube player with transcript sync, text/web highlight reader).
- [ ] **Epic 4:** Tri-Pane UI & Neo-Brutalist Component System (Slanted buttons, responsive tab switching, mobile floating return button, credit counter badge).
- [ ] **Epic 5:** Credit Governor & Cost Guardrails (10 credits/day tracking, zero-credit lock banner, 1-week lazy inactivity TTL).
- [ ] **Epic 6:** Lightweight Monitoring & Performance Telemetry (Async insertion of `telemetry_chat_prompts` and `telemetry_file_uploads`, k6 benchmarking suite).
