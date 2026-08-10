# Epic 3 Context: Bring & Index Your Sources

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This epic makes a notebook's research material usable. A signed-in user pastes raw text or adds a webpage by URL, watches each source index through `queued → processing → ready/failed`, then inspects and removes sources (individually, in bulk, or all failed at once). Under the hood every accepted source is split deterministically into span-preserving chunks, embedded, and stored with origin metadata so that Epic 4 can ground answers in exactly these sources. Chunks are queryable only after a source is `ready`; removed sources are removed from retrieval so future answers never cite them.

## Stories

- Story 3.1: Build the ingestion pipeline
- Story 3.2: Add a text source
- Story 3.3: Add a web source by URL
- Story 3.4: List, inspect, and remove sources

## Requirements & Constraints

- Paste text as a Text Source; the full pasted text becomes the Source content and renders as markdown in its Original View. Empty/whitespace-only submissions are rejected inline.
- Add a Web Source by URL: fetch the page and extract main content (title + body text). Unfetchable URLs (404, paywall, non-HTML, JS-only render) surface a `failed` status with a clear reason without breaking other sources. No headless browser in v0.1.
- List all sources with name, type, and status; inspect metadata; remove with confirmation, bulk remove, and one-click "clear failed". Removal deletes the source's chunks from retrieval.
- Chunk and index every source with origin metadata (source, position, span/offset) and embed it, making it retrievable per notebook.
- Limits (enforced atomically, configurable server-side): 10 sources/notebook, 30 sources/user, 5MB/source. A violating source is rejected with a pop-up warning showing the limit and current count.
- Ingestion status announces on transition via `aria-live` — only final states (`ready`/`failed`) are announced, never intermediate ones.
- A source is not queryable until it is `ready`.

## Technical Decisions

- Ingestion runs as app code in an Upstash QStash job: fetch → readability + linkedom → Turndown → split → embed → store. The QStash callback passes only a `sourceId` reference (never the ≤5MB body); the serverless fn re-fetches metadata/raw from Neon/Filebase and must finish inside the Vercel Hobby function-duration cap.
- Shared chunk kernel used by ingestion, retrieval, and CitationMapper: `{chunkId, sourceId, notebookId, span{start,end}, position, text}`. `chunkId` is a deterministic hash of `sourceId + position`, making upserts idempotent (no duplicates on re-run/retry).
- Splitter is deterministic and span-preserving: 500 chars/chunk with 25% overlap for plain text; heading-aware splitting for web markdown so no chunk crosses a section boundary.
- Qdrant is the system of record for chunks (vector + metadata together); Neon stores only source working metadata/status. Only the ingestion context writes to the chunk collection (single writer).
- One embedding model both sides: `EmbeddingService` is the only caller of the embeddings endpoint (env-driven `EMBEDDING_BASE_URL`/`API_KEY`/`MODEL`), shared with Epic 4's query embedding. Changing the model is a deliberate re-index event.
- Web extraction uses jina Reader (`r.jina.ai` → markdown) with readability/linkedom/Turndown. Images are stripped at index time only via a removable interceptor; original Source content is never altered.
- Delete cascade order is Qdrant → Filebase → Neon, owned by the ingestion context, each step idempotent. In-flight QStash ingestion must detect removal (generation/tombstone check) before writing chunks so a deleted source's chunks never resurrect.
- Limits counters live in the `limits` context (single owner); the write boundary bumps counters exactly once atomically, and deletion reconciles down exactly once.
- Qdrant hosting is one adapter driven by env (`QDRANT_URL` + key); cloud free-tier and self-hosted are the same adapter with different endpoints.

## UX & Interaction Patterns

- Add-source trigger is a `button-secondary` opening the upload dialog with two paths (textarea paste; URL field). Dialog traps focus with initial focus inside and returns focus to the trigger on close; dialogs never stack.
- Source cards show icon, title, type + size, added time, and a status dot + label — color is never the only channel. Click inspects metadata; remove uses a row action with a confirmation stating the consequence ("Removing this removes its chunks from answers.").
- Ingestion state `queued → processing → ready/failed` is surfaced as color + label. While processing, the card body stays static and only its offset shadow animates as a rotating activity indicator; on `ready` the shadow snaps back and the card glows green for 1 second then fades. Reduced-motion skips the rotation and uses a flat color change.
- Remove confirmation, bulk-select remove (single confirmation), and one-click "clear failed" are supported in the Sources section.
- Empty notebook state shows "This notebook has no sources yet." with a primary action to add the first source.

## Cross-Story Dependencies

- Story 3.2 and 3.3 both enqueue through the Story 3.1 pipeline; status transitions drive the card UI in 3.2/3.3/3.4.
- Story 3.4's removal path depends on the cascade and single-writer guarantees from 3.1.
- Story 3.1 must also support Epic 4's fetch-on-refusal, where fetched pages re-enter via the source indexer and count against limits.
- Requires Epic 1's `limits` context, storage (Filebase), and Qdrant/Neon adapters; requires Epic 2's notebook workspace (Sources tab) to expose the sources UI.
