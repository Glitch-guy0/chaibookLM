# Adversarial Review — chaibookLM v0.1 Architecture Spine

- **Reviewed:** `ARCHITECTURE-SPINE.md` (2026-08-09)
- **Mode:** READ-ONLY adversarial attack on the AD set. No files modified.
- **Method:** For each hole, two independently-built units one level down (stories / developers in separate bounded contexts) are constructed so that **each obeys every AD to the letter**, and then shown to build incompatibly. Each hole names the AD to tighten or the new AD to add.

---

## Verdict

The spine is coherent at the single-AD level, but the **seams between ADs** leak: the chunk kernel (AD-6) leaves `chunkId` determinism and span coordinates undefined; AD-1 forbids in Neon exactly the citation-render data AD-9 needs; removal (AD-4) has no ordering/atomicity across Neon+Qdrant+Filebase; and every **async boundary** (QStash retries, lazy TTL, FR-7 fetch-on-refusal) is unguarded against the owner mutations (removal, expiry, counters) it can race. Nine holes below, roughly in severity order.

---

## H1 — The chunk kernel: `chunkId` determinism and span coordinate space are undefined (AD-6)

**Unit A — SourceIndexer story (ingestion context).** Generates `chunkId = crypto.randomUUID()` per chunk (the spine's own convention: "ids are UUIDs"), splits the source text, records `span{start,end}` as character offsets into the Turndown markdown string, `position` as the per-source ordinal.

**Unit B — CitationMapper / FR-8 highlight story (chat context).** Validates `[[C:chunkId]]` against the retrieved set, and for a Text Source maps `span{start,end}` onto the DOM of the Original View to draw the highlight.

**The clash — three ways, all AD-compliant:**

1. **QStash retry duplicates chunks.** The callback writes chunks to Qdrant, then crashes before flipping source status to `ready`. QStash retries the callback. Unit A re-splits and writes **fresh random chunkIds** for the same text. Now Qdrant holds two copies of every chunk. `topK = 8` (AD-8) can return both copies: context doubles, two chips cite byte-identical text, and the duplicate vectors silently waste the 1 GB free tier. A deterministic `chunkId` (`hash(sourceId + position)`) would make retries idempotent — nothing in AD-6 demands it, and Unit A picked the "UUID" reading of the convention.
2. **Span coordinates point into the wrong buffer.** AD-6 says spans are char offsets "in the source's original text," but never defines the canonical buffer. For a Text Source, Unit A measures into the raw pasted string; Unit B highlights against the **markdown-rendered DOM** (react-markdown + remark-gfm). The two differ wherever the renderer changes text: `&amp;`, HTML entities, soft-wraps, and — critically — **astral characters** (emoji, CJK) where `string.length` (UTF-16 code units) ≠ character count. Unit A's offsets are right in raw text and wrong in the DOM, so the highlight lands off-target or empty.
3. **Half-open vs closed spans.** `span{start,end}` never states inclusive/exclusive. Unit A writes `{i, i+1}` for a one-char chunk; Unit B's highlighter treats `{i, i}` as one char. Any single-char chunk highlights zero or two characters depending on the builder.

**Tighten AD-6:** `chunkId` MUST be deterministic — `hash(sourceId + position)` — so QStash retries and re-ingest are idempotent; define the canonical split buffer once (the exact normalized string that the Original View renders, stored on the Neon source record); define `span` as half-open `[start, end)` in **UTF-16 code units** over that canonical buffer; and define that Text-Source highlights render against the same canonical buffer (text-node walker), never the rendered-DOM string.

---

## H2 — AD-1 forbids the exact citation-render data AD-9 needs (citation snapshot gap)

**Unit A — chat persistence story (chat context, AD-9).** Persists each message's text (including the raw `[[C:chunkId]]` markers) plus role in Neon, paginates by 7 on scroll.

**Unit B — CitationMapper render story (chat context, AD-7).** To render a chip it needs `{sourceId, notebookId, span, sourceTitle}` per `chunkId`. For the current turn it validates against the in-memory retrieved set — fine. For **old** messages pulled up by AD-9 pagination there is no retrieved set.

**The clash.** Unit B's only legal data sources under AD-1 are Qdrant (chunk data) and Neon ("No chunk-level data is ever written to Neon"). Old messages therefore cannot resolve markers without either (a) re-querying Qdrant per marker at render — chunks may since be deleted, so a citation that was **valid at answer time silently vanishes**, plus N vector round-trips per render — or (b) persisting a `chunkId → {sourceId, span}` mapping in Neon, which the literal AD-1 text forbids ("No chunk-level data is ever written to Neon"). Two developers read AD-1 vs AD-9 and build opposite things: chips that break on scroll, or a Neon write that violates AD-1.

**New AD (carve-out to AD-1):** the answer-time `CitationSnapshot` — a per-message Neon record `{messageId, chunks: [{chunkId, sourceId, notebookId, span, sourceTitle}]}` written once by CitationMapper — is **chat working metadata, not chunk content**, and is explicitly allowed under AD-1. Old messages render exclusively from the snapshot; live validation applies only to the current turn.

---

## H3 — Removal has no ordering or atomicity across Neon + Qdrant + Filebase (AD-4)

**Unit A — remove-source flow (sources → ingestion removal service).** Deletes in order Qdrant (filtered `sourceId` delete) → Neon record → Filebase file.

**Unit B — bulk-clear-failed / notebook-delete flow (notebooks/ingestion).** Deletes in order Neon record → Qdrant filtered delete → Filebase.

**The clash.** AD-4 fixes only the **mechanism** (filtered delete on `sourceId`), never the order or atomicity, so both orderings are AD-compliant and both are locally sensible. Now interleave a failure in Unit B's order: the Neon record flips to `removed`, then the **Qdrant filtered delete fails** (Qdrant rate-limit/hiccup). The source is gone from the UI, but its chunks remain in Qdrant. AD-8 scopes retrieval by `notebookId` only — **no status filter** — so the stale chunks still retrieve, the model can still cite them (FR-4: "removing a source removes its chunks from retrieval and its citations from future answers" is violated silently), and SM-1 counts citations to a source that no longer exists. There is also no defined retry/compensation and no reconciliation sweep for the partial state.

**New AD:** a single shared removal orchestration (used by FR-4 remove, clear-failed, and FR-1 notebook delete) with a fixed order: **(1)** Qdrant filtered delete first, retried to success (idempotent), **(2)** Filebase delete, **(3)** Neon record removal — plus the invariant that retrieval must never return chunks of a removed source even if step (1) ultimately fails (either a bounded-retry plus a reconciliation sweep, or a tombstone payload field in Qdrant that the retrieval filter also excludes).

---

## H4 — In-flight QStash ingestion vs removal / lazy TTL: the orphan resurrect (AD-4 + AD-11)

**Unit A — SourceIndexer callback (ingestion).** fetch → extract → split → embed → write chunks → flip source status (implemented as an upsert so retries are harmless).

**Unit B — removal and TTL-delete (sources/notebooks).** Deletes the source/notebook record (and chunks/file, per H3), and — for AD-11 — deletes expired notebooks on dashboard load / notebook open.

**The clash.** The callback is already past "fetch" when Unit B commits the deletion. The callback then writes chunks to Qdrant for a deleted source/notebook and **upserts** the status row:
- Removed source → chunks resurrected, retrieval can return them again (H3's hole), and the upsert re-creates the source row (or throws on a foreign key, depending on the schema one of the devs chose — undefined).
- Expired notebook (AD-11) → **orphan chunks** in Qdrant for a notebook that no longer exists, invisible to users but burning the free tier and, if the callback upserts the source row, a **ghost row** for a deleted notebook.

Both devs comply with AD-4 (ingestion writes chunks; removal deletes them) — neither is told to check a tombstone or generation token before writing.

**Tighten AD-4 / new AD:** source records carry an immutable identity plus a `deletedAt` tombstone (or generation counter); the QStash callback MUST verify the source still exists and is un-deleted before writing any chunk or status; the callback is a status **updater only**, never a creator or resurrector — no upsert path that can recreate a deleted row; AD-11 TTL deletion writes the tombstone before any store teardown so late callbacks no-op.

---

## H5 — The refusal gate races: removal mid-conversation (AD-7 vs AD-4)

**Unit A — chat story (chat context, AD-7).** Retrieve topK=8 → build context → `GroundedAnswerReasoningStrategy` emits per-sentence `[[C:chunkId]]` → `CitationMapper` validates markers **against the retrieved set** → render chips.

**Unit B — remove-source story (sources/ingestion).** In another tab the user removes source S while Unit A's answer is generating; per H3's AD, S's chunks and status are deleted.

**The clash.** Retrieval returned S's chunks above `minScore` (valid at retrieval time). Unit B deletes them. The strategy emits markers citing S. `CitationMapper` validates against the **in-memory retrieved set**, which still contains S — AD-7 says exactly that ("validates every marker against the retrieved set"), so the citation passes and a chip renders for a source that no longer exists. Clicking it opens the Original View → source record gone → dead endpoint. The "structural" refusal only guarantees no fabrication when retrieval finds **nothing at turn start**; it is silent on the retrieval→render window.

**Tighten AD-7:** CitationMapper re-validates survivors against the **current** source set for the notebook (Neon source records, excluding removed) before rendering chips; citation click is defensive (missing source → inline toast, never a broken state); and the H2 `CitationSnapshot` is written from the post-validation survivors so the chip target stays resolvable.

---

## H6 — Limits: async ingestion, retries, unowned decrements, and the unnamed FR-7 boundary (AD-10 + AD-11 + AD-4)

**Unit A — limits story (limits context, AD-10).** Per-user 30 / per-notebook 10 counters in Neon; check-and-increment in a single Postgres txn at "add source" (upload).

**Unit B — ingestion/QStash story + FR-7 fetch-on-refusal story (chat).** The approval-gated fetch indexes new sources; QStash retries the callback on failure.

**The clash — four ways:**

1. **Double-bump vs no-bump on fetch-on-refusal.** AD-10 names "create notebook, add source, upload" as write boundaries but never names the **FR-7 fetch-on-refusal path**. Unit B's chat dev calls `limits.enterSource()` when the fetched source is created; the ingestion dev also bumps "because adding a source = ingesting a source." Counts double. Or neither bumps and FR-7 bypasses both caps.
2. **Failed sources and decrement symmetry.** A failed source (404, JS-only, paywall) — does it count against the caps? If yes, a user can exhaust the per-notebook 10 with dead URLs and never add a working source. If no, the AD-10 transaction must be compensated on failure — **by whom**? The callback is async; the transaction already committed at upload. Undefined.
3. **TTL delete never reconciles counters.** AD-11 deletes expired notebooks but says nothing about decrementing the per-user notebook and source counters. A user who reaches the 10-notebook cap and then has notebooks expire is stuck at the cap forever — or worse, the 30-source budget is permanently eaten by expired notebooks, so the user "has nothing" yet hits the cap. AD-11 binds `limits` and `sources`, but AD-10 only covers increment paths.
4. **QStash retries and the cap transaction.** The retry (H1) that duplicates chunks doesn't re-bump counters if the bump is keyed to the upload, but nothing states that the bump is keyed to the **source record** rather than to callback execution — a dev who bumps in the callback double-counts under retry.

**New/tightened AD:** the counter transaction is keyed by the **source record identity** and executes exactly once, at the upload boundary; all three creation paths (text upload, web upload, fetch-on-refusal) MUST call the same `limits.enterSource()` entry point; the ingestion callback never touches counters; failed ingestion compensates via a defined decrement event; and TTL deletion and AD-2 recovery decrement counts in the same transaction that deletes the notebook/source.

---

## H7 — "A turn" is undefined, and the SDK Session port carries unbounded history (AD-9 vs Session port)

**Unit A — NotebookSession story (chat context).** Implements shikigami's `Session` port. The SDK contract is explicit: "Prior turns are carried forward without re-supplying." A faithful, SDK-documented implementation returns the **whole** conversation.

**Unit B — chat window + pagination story (chat context, AD-9).** Trims context to "the last 7 user+assistant turns"; the chat list "loads the most recent 7" and "pulls the next 7 upward."

**The clash — three ways:**

1. **Who trims?** The SDK Session port carries everything forward; AD-9 demands a 7-window. If Unit A wires its faithful (unbounded) session into the `Agent`, AD-9's token-cost bound is silently violated — the app feeds full history and nobody owns the trim. If Unit B trims before handing to the SDK, the trim and the session's carry-forward can disagree (the SDK re-appends its own history). The spine never says NotebookSession is where the window is computed.
2. **"7 user+assistant turns" vs "pagination by 7."** 7 turns = 7 pairs = **14 messages**. The chat list paginates "the most recent 7" — 7 messages or 7 turns? If messages, the model's window (14 messages) is double the first page (7): the model references messages the user hasn't scrolled to, and a pair splits across page boundaries. The consistency-conventions row says "pagination by 7" without saying of what.
3. **FR-7 turns.** The refusal → approval → fetch → re-answer flow runs as extra `execute()` calls with tool round-trips. Does the re-answer consume one turn or three? Neon persists (say) user-Q + final-A as one pair; the session window counts every `execute()` — the window math and the persisted history diverge, exactly the divergence AD-9 exists to prevent.

**Tighten AD-9:** define **"turn" = one user message + its final persisted assistant reply (tool round-trips and the refusal re-answer do not add turns)**; declare that `NotebookSession` is the **single place** the sliding 7-turn window is computed and trimmed (it must wrap/override the SDK's carry-forward, an explicit sanctioned deviation from the SDK contract); and declare that UI pagination paginates **turns (pairs)** in pages of 7, computed over the same persisted history the window is fed from.

---

## H8 — Source status is multi-writer; the failure-reason shape is undefined (AD-1 + AD-4)

**Unit A — sources context.** Owns the Neon source record. AD-4's binding line says sources "reads status only."

**Unit B — ingestion callback.** Must set `processing → ready/failed` on that same record (it is the only component that knows the fetch outcome). The app-layer upload also sets `queued`.

**The clash.** Three writers to `source.status`, no owner, no transition model. AD-4's "sources reads status only" appears to forbid exactly the write the ingestion pipeline needs — so Unit B (ingestion) builds its own status-update path into a sources-owned table, while Unit A (sources) builds a guarded aggregate. Worse, the failure shape diverges: the sources dev models failure as `status: 'failed'` + `reason: string`; the ingestion dev, following the spine's `{message, code}` error convention, writes `error_code` / `error_message`. The FR-3 "clear reason" (404 vs JS-only vs paywall) is then unreadable by the UI, and the distinction between API error shape and **source** failure reason is never made.

**New AD:** the Neon source record is owned by the sources context; its status is mutated **only** through a sources-port method (`SourceRepository.transition(sourceId, event)`) called by the app-layer upload, the ingestion callback, and removal; the status model (`queued | processing | ready | failed` + a single `failureReason` field with a defined enum) lives in the shared-kernel; `{message, code}` applies to API errors only, never to source failure reasons.

---

## H9 — AD-2 recovery has no owner and no counter reconciliation (AD-2)

**Unit A — recovery flow.** Bound to "ops," which is **not a bounded context**: on Qdrant loss, delete affected users' Filebase resources and surface an honest error.

**Unit B — limits + sources contexts.** Own the per-user counters and the Neon source records.

**The clash.** Recovery deletes Filebase files but leaves the Neon source records `ready` and the counters at their pre-loss values, and no named component owns the orchestration. Users see `ready` sources that retrieve nothing (universal refusal across the notebook); their 30-source budget is consumed by sources that no longer exist. The "affected users" set itself is underdetermined: Qdrant (the chunk authority) is lost, so the set can only come from Neon records + Filebase listings — an AD-2 detail no one is bound to. Two devs (one building a sources-touching recovery, one building limits/sources) produce incompatible recovery semantics.

**New AD:** recovery is owned by the **ingestion context** (the chunk-lifecycle owner per AD-4); the affected set is computed from **Neon source records + Filebase listings, never Qdrant**; the recovery sequence is fixed as mark-sources-`failed` (reason surfaced per FR-13 tone) → delete Filebase → decrement per-user counters in the limits transaction → zero chunk writes. Bind AD-2 to this owner.

---

## Secondary note — ownership at the port boundary

AD-8's "notebook-scoped by construction (FR-6)" holds only if notebookId→userId ownership is enforced **before** the `VectorStore` port is called. The spine never binds that check. A retrieval story that filters by `notebookId` only, paired with a notebooks story that trusts the route's notebookId, leaks another user's chunks (FR-9) or lets one user's removal filtered-delete another user's chunks (AD-4's `sourceId` delete is global). Tighten AD-8/AD-4: every `VectorStore` read/delete call is scoped by `(userId, notebookId)` with ownership enforced at the controller boundary.

---

## Hole → Fix index

| # | Two units | Clash | Fix |
|---|---|---|---|
| H1 | SourceIndexer vs CitationMapper/highlight | random chunkIds → QStash-retry duplicates; spans measured into wrong buffer (rendered vs raw, UTF-16) | Tighten AD-6: deterministic `chunkId=hash(sourceId+position)`, canonical buffer, half-open UTF-16 spans |
| H2 | chat persistence vs CitationMapper | old messages can't resolve markers; AD-1 forbids the snapshot | New AD: CitationSnapshot carve-out to AD-1 |
| H3 | remove-source vs clear-failed/notebook-delete | differing delete order; Qdrant failure after Neon flip leaks stale chunks into retrieval | New AD: fixed removal order + retrieval never returns removed-source chunks |
| H4 | QStash callback vs removal/TTL | late callback resurrects chunks/rows for deleted source or expired notebook | Tighten AD-4: tombstone check before any write; callback is updater-only |
| H5 | chat refusal gate vs removal | chunks removed mid-generation → citation to deleted source | Tighten AD-7: re-validate against current source set |
| H6 | limits vs ingestion/FR-7 | double-bump / no-bump on FR-7; failed-source counting; TTL never decrements | New/tightened AD-10: one entry keyed by source record; callback never bumps; TTL/recovery reconcile |
| H7 | NotebookSession vs 7-window/pagination | SDK Session carries all history; "turn"≠"message"; FR-7 extra executes | Tighten AD-9: define turn, NotebookSession owns the trim |
| H8 | sources vs ingestion callback | three writers to source.status; failure shape diverges | New AD: sources-port transition, shared status model |
| H9 | recovery vs limits/sources | no owner, no counter reconciliation, affected-set from lost Qdrant | New AD: recovery owned by ingestion, fixed sequence |
