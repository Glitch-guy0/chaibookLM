# Input Reconciliation — Product Brief vs v0.1 PRD

- **Brief:** `_bmad-output/planning-artifacts/briefs/brief-chaibookLM-2026-08-04/brief.md`
- **Brief addendum:** `_bmad-output/planning-artifacts/briefs/brief-chaibookLM-2026-08-04/addendum.md`
- **PRD under review:** `_bmad-output/planning-artifacts/prds/prd-chaibookLM-2026-08-04/prd.md`
- **PRD addendum:** not present (verified)

Scope note: v0.1 in both documents = textarea + webpage ingestion, rich-metadata indexing, chat with per-source citations, citation → original view. Items the brief defers to v0.3/v0.6/v1 (PDF, subtitles, YouTube, websearch-ingest, credit system, native apps, collaboration) are **not** flagged.

---

## 1. Brief — Gaps

### G1. Hybrid self-hosted + commercial AI positioning dropped, replaced with "commercial-only"
- **Severity:** medium
- **Description:** The brief's identity is "a simpler, cheaper ecosystem built on a **hybrid of self-hosted and commercial AI**"; the PRD §1 restates this as "a commercial-but-lightweight AI stack," and OQ-1 frames provider choice as "commercial, cost-optimized."
- **Source:** brief §Executive Summary; addendum §What this means for chaibookLM (item 2) + §Open questions ("which capabilities self-host … vs commercial")
- **Why it matters:** v0.1 is the slice where stack economics are locked in. The addendum explicitly wants the self-host/commercial split resolved downstream (architecture); the PRD's reframe silently forecloses the self-hosted half, which could steer the architecture workflow to commercial-only embeddings/chunking/retrieval and undercut the brief's "cheaper, more honest, no-Google-lock-in" thesis.

### G2. Responsive / mobile-optimized baseline is silent in the PRD
- **Severity:** medium
- **Description:** The brief's Solution states the product is "A responsive web app (mobile-optimized)" and the addendum's design direction says "the aesthetic must survive small screens." The PRD never mentions responsive/mobile layout — §2.3 UJ-1 even sets the scene on "her laptop."
- **Source:** brief §The Solution; addendum §Design direction
- **Why it matters:** A builder following the PRD alone could ship desktop-only markup. (Caveat: the brief's own roadmap defers "mobile optimization" to v1 polish, so the brief is internally ambiguous — the PRD should at least record the *responsive baseline* as in-scope and defer only the polish.)

### G3. "Sources per notebook grow beyond the first upload" success signal dropped
- **Severity:** medium
- **Description:** The brief's first success criterion is engagement = "users create multiple notebooks; **sources per notebook grow beyond the first upload**." PRD SM-3 captures only the notebooks half ("builder creates 2+ notebooks"); the sources-growth signal is lost.
- **Source:** brief §Success Criteria (Engagement)
- **Why it matters:** The brief explicitly measures whether sources grow past a single upload — that's the test that the notebook is becoming a real knowledge base (JTBD-3). Without it, engagement is under-measured and the metric suite doesn't cover JTBD-3.

### G4. Qualitative design identity narrowed to "neo-brutalist"; the "minimalistic-maximalist" duality and execution anchors dropped
- **Severity:** medium
- **Description:** The brief's design pillar is "**neo-brutalist + minimalistic-maximalist** … bold, modern, unmistakably different," "must be executed with taste," and the addendum lists concrete anchors (thick hard borders, bold offset shadows, saturated palette, chunky typography, "lots of personality, zero noise," small-screen survival). The PRD records only "neo-brutalist design language applied to all surfaces" (§6.1) plus a design-pass assumption.
- **Source:** brief §What Makes This Different (Design/UX row); addendum §Design direction
- **Why it matters:** Design is the brief's stated **lead differentiator on first impression** ("impossible to mistake for anything else"). The PRD should carry the two-part name and the zero-noise discipline forward to the UX workflow, or the neo-brutalist half alone risks being read as loud-and-ugly rather than bold-and-calm. At minimum the qualitative intent belongs in an explicit note-to-UX so it isn't silently flattened.

### G5. "Without leaving the flow" is diluted by "new tab acceptable fallback"
- **Severity:** low
- **Description:** The brief's success framing is "verify against the original source **in one click, without leaving the flow**"; FR-8 keeps the in-app frame as preferred but blesses "new tab acceptable fallback."
- **Source:** brief §Who This Serves (success statement)
- **Why it matters:** Fallback is fine as an engineering fallback, but a builder may read "acceptable" as a free choice. The "stay in flow" property is part of the citation-trust experience (SM-2) and should be the default, not a coin flip (see also OQ-2 duplication in §3).

---

## 2. Brief Addendum — Gaps

### A1. Competitive "free tier must compete on experience, not quota alone" has no PRD echo
- **Severity:** low
- **Description:** The addendum concludes the free tier must compete on experience (citation-to-original, design, calmness) since NotebookLM's quota is generous. The PRD's metrics are functional-only (citation rate, click-through, ingestion success); nothing tracks the *experience* side of that bet.
- **Source:** addendum §What this means for chaibookLM (item 3)
- **Why it matters:** v0.1 validates the differentiation bet; an experience-oriented success check (e.g., qualitative review of the citation→original flow, design quality bar) would anchor it. Largely downstream (UX), so low severity.

---

## 3. PRD Internal Consistency

### I1. §2.2 lists "audio" as deferred to "v0.3–v1"; the brief excludes audio even at v1
- **Severity:** low
- **Description:** PRD §2.2 Non-Users groups "PDF ingestion, YouTube/transcript analysis, or audio — deferred to v0.3–v1." The brief's roadmap has no audio milestone — "audio transcription" is in **Explicitly out (v1)**.
- **Source:** PRD §2.2; brief §Scope
- **Why it matters:** Misstates roadmap intent; a downstream planner could schedule audio. Fix: drop audio from that list or mark it "not scheduled."

### I2. Removing a source leaves stale citations pointing at a deleted Original View
- **Severity:** low
- **Description:** FR-4 guarantees removal "removes its chunks from retrieval and its citations from **future answers**," but says nothing about already-rendered chat citations to the removed source — clicking them would break the Original View.
- **Source:** PRD §4.2 FR-4
- **Why it matters:** An undefined edge case for a product whose core promise is clickable, verifiable citations. Needs a stated behavior (disable/label stale citations).

### I3. SM-1 denominator includes honest refusals (FR-7)
- **Severity:** low
- **Description:** SM-1 requires ≥90% of answers carry a citation, but FR-7 intentionally produces citation-free refusal answers. A user who mostly asks out-of-source questions fails SM-1 with no product defect.
- **Source:** PRD §7 SM-1 vs §4.4 FR-7
- **Why it matters:** Metric/feature tension; exclude refusals from the SM-1 denominator (or define the answer population).

### I4. OQ-2 duplicates the FR-8 assumption
- **Severity:** low
- **Description:** OQ-2 ("in-app frame vs new tab") restates what §4.4 FR-8's assumption and the Assumptions Index already decide ("in-app frame preferred, new tab acceptable fallback").
- **Source:** PRD §8 OQ-2; PRD §4.4 FR-8; PRD §9
- **Why it matters:** Redundant — either the assumption or the open question should go (or OQ-2 should be upgraded to an explicit UX pass decision).

---

## Clean (reconciled fine)

- **v0.1 scope boundary:** text+web only; PDF/transcript/YouTube/websearch/credit-system deferrals match the brief's roadmap exactly (§5, §6.2 vs brief §Scope).
- **Core loop:** sources → grounded answers → citation → original view is faithfully represented (FR-2/3/5/6/8).
- **Grounding-only-in-sources** and honest refusal: FR-6/FR-7 match brief's "answers grounded only in your sources" and "never from general knowledge."
- **Rich-metadata indexing foundation:** FR-5 (origin Source, position, web section/heading) covers the v0.1-relevant part of the brief's metadata pillar; timestamp/page anchors correctly deferred (v0.6/v0.3).
- **Citation quality guardrail:** SM-1's ≥90% citation presence and SM-C1's anti-inflation counter-metric align with the brief's "grounded answers" and "citation trust" criteria.
- **Credit system:** correctly deferred to v1 per roadmap; the §6.2 cost-watch note is consistent with the §5 assumption.
- **Clerk auth + per-user persistence:** reasonable v0.1 addition not contradicted by the brief (no Google-account dependency preserved).
- **Websearch-as-parity reframing:** PRD non-goals treat it as a later parity feature, matching the addendum's rejection/reframe.
- **All FRs trace to an existing workflow (UJ-1)** — no orphan requirements; no workflows without FR coverage.
