# Epic 4 Context: Ask Questions, Get Verifiable Answers

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A user asks questions inside a notebook and receives answers grounded only in that notebook's own sources, with per-sentence citation chips they can click to open the Original View (live page or highlighted text). When the sources can't support an answer, the system refuses honestly instead of guessing, and offers an approval-gated web fetch that grows the notebook's own material rather than polluting it silently. This closes the trust loop that is the product's core differentiator: ask, cite, verify, without leaving the flow.

## Stories

- Story 4.1: Ask questions and get grounded, streaming answers
- Story 4.2: Render verifiable citation chips
- Story 4.3: Open the Original View from a citation
- Story 4.4: Refuse honestly and offer approval-gated fetch-on-refusal
- Story 4.5: Persist chat history with a sliding window

## Requirements & Constraints

- Answers must be generated using only the current notebook's chunks as context; chunks from other notebooks must never appear as citations (retrieval scoped by notebookId).
- Retrieval uses topK = 5 chunks and an absolute minScore = 0.30 cosine threshold; when no retrieved chunk clears this bar, the system must produce an explicit "not found in your sources" refusal with zero fabricated citations, never falling back to general knowledge.
- ≥90% of answers must carry at least one citation to a source in the current notebook (primary success metric); citation count itself is a counter-metric — never optimize toward more citations, only factual ones.
- Citation click-through is a second success metric: ≥60% of cited answers should see at least one citation clicked, resolving to the correct source's Original View.
- Web search (fetch-on-refusal) may only run after explicit user approval — never invoked autonomously by the model. Fetched pages must be indexed through the normal ingestion path and count against the same per-notebook/per-user source limits as any other source.
- Chat and user messages render as markdown.
- Exactly the last 7 user+assistant turns are fed into model context per turn (sliding window); a fetch-on-refusal sub-answer counts as its own turn. Full chat history persists server-side; only the window is re-fed, never the full history.
- Chat list loads the most recent 7 turns on open and paginates by 7 on scroll — infinite scroll is banned.
- Streaming answers must render inside a stable `aria-live="polite"` region; only final/settled states are announced, never intermediate ones.
- Network/LLM failures show an inline retry on the failed message — no silent failures.

## Technical Decisions

- Answer runtime (shikigami SDK) is tightly coupled application code, not behind a port — this is an approved architectural carve-out distinct from storage/vector/LLM/embedding/search, which remain ported. Any change to the SDK itself needs a change-request; custom templates/strategies built on top of it do not.
- Custom template set (app code, not SDK): `VectorStoreMemoryStrategy`, `GroundedAnswerReasoningStrategy`, `NotebookSession`, `WebSearchTool`, `SourceIndexer`, `EmbeddingService`, `CitationMapper`.
- One shared chunk kernel `{chunkId, sourceId, notebookId, span{start,end}, position, text}` is used identically by ingestion (writer), retrieval/chat (reader), and CitationMapper. `chunkId` is a deterministic hash of `sourceId + position`, making retrieval/citation resolution consistent with ingestion.
- Citation contract is structural, not trust-based: the reasoning strategy emits per-sentence inline markers referencing only chunkIds actually present in the retrieved, notebook-scoped context; CitationMapper (app-level) validates every marker against that retrieved set, drops unknown/invalid markers, and maps survivors to chips + span highlights. A refusal therefore has zero markers by construction, not by a separate rule.
- Answers stream via shikigami's event emission as tokens are produced; the controller pulls the stream and forwards deltas to the client. Citation markers stream inline with the answer text — no buffering the whole answer before display.
- Web search uses jina `s.jina.ai` (SERP → markdown, top-5) mediated entirely by the controller: refusal → user clicks approve → WebSearchTool runs → results re-enter through the existing SourceIndexer/ingestion pipeline (same chunking, embedding, and limits enforcement as any other source) → next turn can cite them.
- Persisted chat messages may carry a resolved-citation snapshot (`chunkId` + `sourceId` + span) captured at render time, since chunk content itself lives only in Qdrant (Neon holds no chunk-level data) — this lets old messages still render their chips.
- Chat/answers belong to the `chat` bounded context; it reads chunks (never writes them — ingestion is the single writer of the chunk lifecycle) and depends on the `VectorStore`, `Embeddings`, and search ports plus the coupled shikigami runtime.
- All LLM/embedding/search configuration is env-driven (`baseURL`/`apiKey`/`model` pattern); secrets never appear in client bundles.

## UX & Interaction Patterns

- Notebook workspace has exactly three tab sections — Sources | Chat | Showcase — with real tablist semantics (`role="tablist"`/`tab`, `aria-selected`, arrow-key nav); no rail, no side panel, same tabs at every breakpoint including mobile.
- Composer: Enter sends, Shift+Enter inserts a newline, textarea auto-grows, disabled while an answer is generating.
- Assistant messages render as open document-style text (react-markdown) with no bubble/avatar; user messages render as a contained, right-aligned markdown block. Per-sentence citation chips sit inline at the end of the sentence they support.
- Citation chip is a first-class interactive target: keyboard-focusable (Tab), opens on Enter, shows source title on hover/focus.
- Refusal state renders as "Not in your sources." with a single button "Find related web pages."; while a fetch-on-refusal runs, show a pending state, then announce "Added N sources" and surface the new sources in the Sources section. On failure, restore the refusal state with a retryable "Try again" button and add no sources — the notebook must never be left half-fetched.
- Showcase (alias: Original View): for a Web Source citation, opens the live webpage in a showcase frame with a loading state, falling back to a stored snapshot if embedding is blocked; for a Text Source citation, opens the full text with the cited passage highlighted via `mark` semantics + highlight color (never color alone), scrolled into view. Esc returns to Chat with focus restored to the invoking citation chip. Screen reader announces "Showcase: {title}" and, for text sources, the highlighted passage.
- The Showcase is the product's signature differentiator versus NotebookLM-style quote previews: it renders the actual source, not a parsed extract — every citation flow must protect this.
- Voice/tone: plain and honest, never theatrical — e.g. "Not in your sources." rather than an apologetic or hedging framing; no typing-dot theatre, no celebratory animations on citation success.

## Cross-Story Dependencies

- Story 4.1 (grounded streaming answers) is the foundation Stories 4.2–4.4 build on: citation chips (4.2), Original View (4.3), and refusal/fetch-on-refusal (4.4) all depend on the same retrieval + streaming pipeline and shared chunk kernel established there.
- Story 4.2's CitationMapper validation depends on the retrieved chunkId set produced during 4.1's retrieval step; it cannot be implemented independently of the retrieval gate.
- Story 4.3 (Original View) depends on chunk span/offset data produced by the Epic 3 ingestion pipeline (AD-6) and on source records from the Epic 3 `sources` context — a citation is only openable for sources that still exist in the notebook.
- Story 4.4's fetch-on-refusal re-enters new pages through the same `SourceIndexer`/ingestion pipeline built in Epic 3, and those fetched sources count against the Epic 1 `limits` context's per-notebook/per-user caps (single-transaction check-and-increment).
- Story 4.5 (sliding-window persistence) underlies every turn processed in 4.1 and 4.4: the last-7-turns window is what gets fed to the model each time, and a fetch-on-refusal sub-answer counts as its own turn in that window.
- All of Epic 4 depends on Epic 3 sources being indexed (status `ready`) before they are queryable, and on Epic 1's per-user data scoping so retrieval and chat history never cross user or notebook boundaries.
