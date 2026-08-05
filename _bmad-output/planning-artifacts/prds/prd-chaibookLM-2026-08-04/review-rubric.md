# PRD Quality Review — chaibookLM v0.1

## Overall verdict

This is a substantively honest, well-scoped, coherent PRD: the thesis is real ("v0.1 validates that the citation-to-original loop is worth building the rest on", §1), trade-offs and counters are surfaced (§7), non-goals are explicit and dated (§5), and the assumptions index roundtrips cleanly (§9). The load-bearing risk is done-ness on the core loop itself: SM-2 — the primary metric for the second half of the thesis — is non-operational as written (§7), FR-8's text-source highlight promise depends on position metadata FR-5 never contracts (§4.3 vs §4.4), and FR-5 asserts a re-ingest path no feature specifies. Tighten those three and add UJ coverage for the management/refusal flows and this is green-light-clean; as written, downstream stories for the chat/citation half will have to invent requirements.

## Decision-readiness — strong

Decisions are stated as decisions: the 10-source cap is a dated decision ("notebook cap is 10 Sources [decision 2026-08-05]", OQ-3), auth is pinned to Clerk (FR-9), and de-scoping is explicit with milestones rather than vague deferral (§5, §6.2). Trade-offs are named with what was given up, not just what was chosen — citation spam is flagged as the counter on SM-1 ("Do not optimize by always-citing", §7), SM-C1 names the metric not to optimize, and the credit-gate deferral carries a `[NOTE FOR PM]` at the real cost tension rather than a safe checkpoint (§6.2). Open Questions are genuinely open (OQ-1 provider/retrieval, OQ-3 per-source budget, OQ-4 citation granularity) and land in the right downstream docs. No "balances everything" smoothing anywhere.

### Findings
- **[low]** [OQ-2 vs FR-8 assumption tension] (§8 vs §4.4 FR-8) — FR-8 records "[ASSUMPTION: in-app frame preferred, new tab acceptable fallback]" as if settled while OQ-2 calls the original-view mechanism "pending design pass"; a downstream author could read the assumption as a decision. *Fix:* close OQ-2 as "preference set, decision deferred to UX" and point the assumption at it.

## Substance over theater — strong

No furniture. The single persona (Meera, UJ-1) is load-bearing — it "Realizes UJ-1" on every FR in §4.1–4.4 — and there is no persona zoo. The differentiation (§1 "Why now") is earned and specific: "trust and focus" against NotebookLM being "heavy, Google-bound, and feature-first," not template filler. The Vision is non-swappable — it names the exact loop (grounded answers → citations → "the original source itself"). Notably there is zero NFR boilerplate: no "scalable / secure / reliable" filler anywhere, which is why the missing *bounds* (Dim 4) stand out so sharply. §2.2 Non-Users is doing scope work, not padding.

### Findings
None.

## Strategic coherence — adequate

The thesis is stated and bet on, and feature prioritization follows it rather than easy-first: notebooks → sources → chunking with origin metadata (§4.3) → per-sentence citations → Original View (§4.4), with the metadata work justified as "the foundation for citations". Success metrics map to the thesis (SM-1→FR-6, SM-2→FR-8) and a counter-metric is named (SM-C1). The weakness is that one of the two *primary* metrics cannot validate the thesis as written: SM-2's "a meaningful share of Citations are clicked and land on the correct Original View" (§7) has no threshold, so the flagship loop's second half is unmeasurable at green-light. (Treated fully under Dim 4 — it is a bound-vs-adjective failure, but it also quietly undermines the thesis-validation claim here.) SM-3's builder-self-referential targets are appropriate to solo stakes.

### Findings
None (flagged under Dim 4, SM-2).

## Done-ness clarity — thin

The bulk of FRs are genuinely testable — FR-2 (empty/whitespace rejection with inline message), FR-3 (404/paywall/non-HTML → "failed" with a clear reason), FR-6 (≥90% citation floor; "Sources from other notebooks never appear as Citations"), FR-7 (explicit "not found in your sources" with "no fabricated Citations"), FR-9 (cross-user isolation; "Data survives a full session/logout cycle"). But the load-bearing citation-to-original half is not closed: the flagship metric has no bound, the text-source highlight is a hedged promise resting on an uncontracted metadata model, and one consequence references a capability no feature provides. Downstream story creation for §4.4 will stall without these.

### Findings
- **[high]** [SM-2 is non-operational] (§7) — "a meaningful share of Citations are clicked" is precisely the adjective-without-bound the rubric flags; a primary SM with no target cannot gate build or validate the loop. *Fix:* set a number and a measurement (e.g., ≥60% of answers with citations see ≥1 citation click, resolving to the correct Source) and name the event instrumentation.
- **[high]** [FR-8's text-source highlight lacks a metadata contract] (§4.4 FR-8 vs §4.3 FR-5) — FR-5 defines chunk "position" only as ordering ("in what order", §3 Glossary), which cannot support FR-8's "with the cited passage visually indicated", and the deliverable is double-hedged by "[ASSUMPTION: highlight the cited chunk if position metadata is available]". An engineer building FR-8 must invent a span model FR-5 does not specify. *Fix:* add a FR-5 consequence defining chunk span/offset within the original source, and make the highlight an unconditional FR-8 consequence.
- **[medium]** [FR-5 asserts a phantom re-ingest path] (§4.3 FR-5) — "A re-ingested updated Source replaces its prior Chunks" presupposes an add/edit/re-index capability, yet no FR in §4.1–4.5 provides one; stories will either invent or ignore it. *Fix:* add an update/re-ingest FR or delete the clause.
- **[medium]** [FR-7's trigger is undefined] (§4.4 FR-7) — "If the notebook's Chunks cannot support an answer" has no threshold (retrieval score floor / refusal policy); the response string is specified but not the condition that fires it. *Fix:* define the refusal condition (e.g., no retrieved chunk above a minimum relevance score).
- **[medium]** [NFRs are adjectives, not bounds] (§6.1) — "Responsive web app, mobile-optimized" and "zero-noise design language applied to all surfaces" carry no testable consequence; there are no supported viewport/device targets and no performance bound for ingestion or chat. *Fix:* one or two bounded NFR lines (supported widths, answer-latency or ingestion-status bound).
- **[medium]** [FR-3 misses the fetch-OK-but-extract-empty case] (§4.2 FR-3, §2.3 UJ-1) — the UJ edge case covers only fetch-level failure ("a paywalled page"), so a page that fetches but yields no extractable main content (JS-only render) falls between "ready" and "failed". *Fix:* add a consequence — extraction yielding empty main content → "failed" with a reason.

## Scope honesty — strong

Omissions are explicit, not inferred: §5 is a dated Non-Goals list with milestone routing (PDF/transcripts/YouTube → "v0.3–v1"; audio transcription "not planned, even at v1"), §6.2 de-scopes honestly (credit system with a `[NOTE FOR PM]` cost watch at the real tension), and the assumptions index roundtrips 5-for-5 (§9 covers exactly the inline tags at FR-8×2, FR-9, §5, §6.1). Open-items density (4 OQs + 5 assumptions + 1 `[NOTE FOR PM]`) is right for moderate stakes, and the addendum confirms the right deferrals land in architecture (OQ-1, OQ-3, FR-9). The one silent scope item is measurement itself.

### Findings
- **[medium]** [SM telemetry is silently assumed] (§7 vs §6.1) — both primary metrics (citation attach rate, citation click-through) require event instrumentation, which appears nowhere in the in-scope list; the reader must infer an analytics capability. *Fix:* add event logging for SM-1/SM-2 to §6.1 or as an indexed assumption.
- **[low]** [Excess-budget behavior unspecified] (OQ-3) — per-Source size budget is honestly left open, but the PRD never states what happens when a source exceeds it (reject with message vs truncate vs auto-chunk), which will surprise the builder mid-build. *Fix:* a provisional line or assumption stating rejection-with-inline-message.

## Downstream usability — adequate

IDs are contiguous and cross-references resolve: FR-1–9, SM-1–4 + SM-C1 each "Validates FR-x" correctly, and the assumptions index references resolve to real sections. The single UJ has a named protagonist carrying context inline — "Meera, a lifelong learner researching 'indoor plant care'" (§2.3) — with entry state, path, climax, resolution, and an edge case; it is not a floating UJ. Glossary covers the domain nouns and is used consistently in FR text. The gaps: one UJ carries the entire product, so the management and refusal journeys are unrepresented, and one JTBD promise drifts from scope.

### Findings
- **[medium]** [Single UJ under-serves the UX extraction] (§2.3) — UJ-1 covers create→ingest→ask→verify, but delete/switch (FR-1), remove-source (FR-4), and the refusal turn (FR-7) are journeyless; for a chain-top consumer PRD these are load-bearing for `bmad-ux`. *Fix:* add a second UJ (a named protagonist managing notebooks/sources over time) and a refusal-turn UJ, even brief.
- **[low]** [JTBD-3 promises more than v0.1 scope] (§2.1 vs §6.1) — "searchable, queryable knowledge base" implies a search surface, but v0.1 is chat-only with no search FR. *Fix:* annotate JTBD-3 as partially addressed in v0.1 (querying via chat) or trim "searchable".

## Shape fit — strong

The shape matches both the product and the chain. Consumer product with meaningful UX → one richly-formed, named-protagonist UJ rather than a persona zoo; MVP kind is problem-solving/experience and the scope logic (§6) tracks it. The PRD is explicitly written "for the builder and downstream AI workflows (UX, architecture, epics/stories)" (§0), so the lean traceability is warranted rather than over-formalized — 183 lines, no boilerplate, but all required sections present. The single-UJ coverage question is the one shape tension and is already captured in Dim 6.

### Findings
None.

## Mechanical notes

- **Assumptions roundtrip:** clean — 5 inline `[ASSUMPTION]` tags (FR-8 ×2, FR-9, §5, §6.1) match the 5 index entries, with section refs that resolve. The addendum carries its own `[ASSUMPTION]` (design anchors, addendum line 9) not in the PRD index — acceptable for a companion doc, but worth a cross-ref if the addendum feeds story creation.
- **ID continuity:** contiguous with no gaps or duplicates — FR-1–9, SM-1–4 + SM-C1, OQ-1–4, JTBD-1–3, UJ-1; "Validates FR-x" / "Realizes UJ-1" refs all resolve.
- **Glossary drift:** cosmetic only — capitalization wobbles in prose ("Chunk/chunks", "Source/source", "Citation/citations" in §4.2–4.4); "Original View" is consistent (§3, FR-8).
- **Untracked items:** "Working title — confirm" (header) is a live open item that belongs in §8; the "decision 2026-08-05" date inside OQ-3 post-dates PRD creation (2026-08-04) — fine, but untracked.
- **Required sections for stakes:** all present — Vision, Target User (JTBD, Non-Users, UJ), Glossary, Features/FRs, Non-Goals, MVP Scope, Success Metrics + counter-metric, Open Questions, Assumptions Index.
