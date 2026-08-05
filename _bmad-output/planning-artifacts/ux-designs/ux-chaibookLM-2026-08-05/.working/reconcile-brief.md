# Input Reconciliation — Product Brief (+ addendum) vs UX Spines

- **Brief:** `_bmad-output/planning-artifacts/briefs/brief-chaibookLM-2026-08-04/brief.md`
- **Brief addendum:** `_bmad-output/planning-artifacts/briefs/brief-chaibookLM-2026-08-04/addendum.md`
- **Spines:** `ux-designs/ux-chaibookLM-2026-08-05/EXPERIENCE.md`, `DESIGN.md`
- Scope note: the brief is the full vision (PDF, subtitles, YouTube, credits, websearch-ingest, collaboration). Only v0.1-relevant qualitative decisions are reconciled; items the PRD/v0.1 explicitly defer are noted as deferred, not dropped.

## 1. UX-relevant decisions and where they landed

| Decision | Landed in spines |
|---|---|
| **Three surfaces** — Sources, Chat, Original View | EXPERIENCE Foundation ("three surfaces that together close the trust loop", items 1–3); IA table |
| **"Citation → original view = the gap"** — clicking a citation shows the *source itself*, not NotebookLM's highlighted quote preview; the differentiating bet | Foundation item 3 ("Not a parsed extract, not a quote preview — the source itself."); Inspiration "The signature gap"; Flow 1 step 6 ("the *live* webpage she added, not a parsed extract") |
| **Answers grounded only in your sources; never general knowledge** | Foundation; State "Refusal"; Flow 3; Voice ("The product never pretends") |
| **Per-source / visible citations** | Components "Citation chip"; Flow 1 step 5 |
| **Engagement criteria** — multiple notebooks; sources grow beyond first upload | IA "Notebook rail" + Flow 2 (notebook switching/curation). "Sources grow" is a metric, not a surface — see §3 |
| **Citation trust** — meaningful share of citations clicked, click leads to Original View | Core behavior carried (Components "Citation chip" → "Original View"); the embed-block fallback is handled explicitly as OQ-U1 `[ASSUMPTION]`, not silently |
| **Design as lead differentiator** — neo-brutalist + minimalistic-maximalist, "impossible to mistake for anything else", executed with taste | DESIGN.md Brand & Style ("not premium, not quiet, not Google. It is *impossible to mistake for anything else*"); zero-noise discipline |
| **Calm for the flow** ("lighter, calmer" gap vs NotebookLM) | EXPERIENCE Voice ("Calm for the research flow… zero-noise") |
| **Responsive web app, mobile-optimized** (PWA-vs-responsive assumption) | EXPERIENCE Foundation (320px) + Responsive & Platform ("responsive web, not a native app") |
| **No Google-account dependency** (via Clerk) | Foundation ("Accounts via Clerk") |
| **Websearch-ingest reframed as parity with a simpler UX** (addendum) | Carried as approval-gated fetch-on-refusal only (FR-7 path): State "Refusal", Flow 3 — the "simpler UX" parity form, no proactive search |
| **Upload dialog / indexing color state / limit pop-up / tour** (design anchors restated in brief addendum) | See reconcile-prd.md §3 — all carried |

## 2. Contradictory / rejected tokens from the brief addendum

- **"minimalistic-maximalist: lots of personality, zero noise"** — carried in full: DESIGN.md Brand & Style ("The discipline is everything — lots of personality, zero noise").
- **Credit system (10/day, 1 per agent call, uploads ungated)** — **correctly deferred, not dropped**: PRD §5 Non-Goals removes credit gating from v0.1 (single-builder cost assumption); the spines therefore carry no credit UI. Consistent with the brief's own roadmap (freemium live at v1).
- **Pillar breadth (PDF/YouTube/subtitles) as differentiator** — rejected/reframed in the addendum itself; v0.1 spines correctly surface only text + web.

## 3. Not carried — each with justification (no silent drops)

- **DROPPED: none.**
- **SUPPORTED-BY-ASSUMPTION — "sources per notebook grow beyond the first upload" (engagement criterion).** The behavior that enables it (add more sources, watch them index, keep the notebook) is the whole Sources panel + Ingestion states; the *measurement* itself is a telemetry/metric item (PRD SM-3 family) for the engineering spine, not a user-facing surface.
- **SUPPORTED-BY-ASSUMPTION — "the click leads to the original view, not a fallback."** OQ-U1 records a `[ASSUMPTION]` that embed-blocking sites fall back to the stored HTML snapshot — an engineering fallback, with the live-page default preserved in Components "Original View" / State "Citation → Original View".
- **Deferred (out of v0.1, per PRD scope — not spine gaps):** PDF pages, subtitle/video timestamp-as-primary-citation, standalone websearch-to-ingest, credit/billing, audio, collaboration, native apps.

## 4. Verdict

The brief's core positioning ("citation → original view = the gap") and engagement/trust criteria are carried at the behavior level in EXPERIENCE.md and the brand level in DESIGN.md. No qualitative v0.1 decision dropped.
