# Input Reconciliation — v0.1 PRD vs UX Spines

- **PRD:** `_bmad-output/planning-artifacts/prds/prd-chaibookLM-2026-08-04/prd.md`
- **PRD addendum:** `_bmad-output/planning-artifacts/prds/prd-chaibookLM-2026-08-04/addendum.md`
- **Spines under review:** `ux-designs/ux-chaibookLM-2026-08-05/EXPERIENCE.md`, `ux-designs/ux-chaibookLM-2026-08-05/DESIGN.md`
- Section references below use short names of EXPERIENCE.md sections (Foundation / IA / Voice / Components / States / Interaction / A11y / DevContract / Responsive / Inspiration / Flow 1-3 / OQ) and DESIGN.md sections (Brand / Colors / Type / Layout / Elevation / Shapes / Components / Do&Don'ts).

## 1. Functional Requirements — all 10 accounted for

| FR | Decision | Landed in spines |
|---|---|---|
| FR-1 | Create / rename / switch / delete notebooks (delete = confirmation); no source or chat loss on switch | IA "Notebook rail" + Components "Notebook rail item"; State "Stale sources"; Flow 2 |
| FR-2 | Paste-text Text Source; "ready" after ingestion; empty/whitespace rejected inline; pasted text renders markdown in Original View | Components "Add source trigger" (inline empty rejection), "Upload dialog", "Original View"; State "Ingestion"; Foundation (markdown via react-markdown — also tech-stack "Text sources + chat") |
| FR-3 | URL Web Source; fetch+extract; unfetchable and JS-only pages → "failed" with reason, never breaks other sources | States "Ingestion" / "Ingestion failed" (404, paywall, non-HTML, JS-only render); Flow 1 failure branch |
| FR-4 | List / inspect / remove sources (name, type, status, metadata incl. added time); removal confirmation; removal drops chunks + future citations; bulk remove; clear-all-failed | Components "Source card" (title, type+size, added time, status) + "Warning dialog"; States "Stale sources"; Interaction "Dialog confirmation required for destructive actions"; Flow 2 |
| FR-5 | Chunk with origin metadata + recorded span/offset so a cited passage highlights in the Original View | Components "Original View" (text: cited span highlighted, scrolled into view); State "Citation → Original View" ("recorded offset") |
| FR-6 | Answers grounded only in current notebook's chunks; per-sentence Citations; no cross-notebook citations; chat renders markdown | Foundation ("grounded only in the current notebook's sources… per-sentence citations"); Components "Citation chip" + "Assistant message" / "User message" (markdown); Flow 2 climax |
| FR-7 | Honest refusal ("not found in your sources", no fabricated citations) + approval-gated fetch-and-index of related web resources | IA "Chat"; State "Refusal"; Voice & Tone examples; Flow 3 (entire) |
| FR-8 | Citation → Original View: live webpage in right-hand showcase; full text with highlighted span for Text Sources | IA "Original View showcase" + Components "Showcase" / "Original View"; State "Citation → Original View"; Flow 1 climax |
| FR-9 | Clerk auth; per-user scoping; persistence; total source count tracked; 30-source cap enforced with pop-up warning | Foundation ("Accounts via Clerk"); State "Signed out"; Components "Warning dialog" (5MB/10/30); IA "Account" (source-limit overview); Voice "You've reached 30 sources" |
| FR-10 | First-run walkthrough of sources panel, showcase, chat; dismissible; replayable | Foundation (Driver.js); Components "First-run tour"; Flow 1 step 1 |

## 2. OQ-4 resolution

Per-sentence citation chips — **resolved as per-sentence chips**, landed in Foundation ("per-sentence citations") and Components "Citation chip" ("Inline, per-sentence, at the end of the sentence it supports"). Also DESIGN.md Components "Citation chip". ✅

## 3. PRD addendum design anchors (decided 2026-08-05) — all carried

| Anchor | Landed in spines |
|---|---|
| Sources panel left; Original View (showcase) right | IA + Responsive (desktop pane order: rail → sources → chat → showcase); Flow 1 step 6 |
| Upload opens pop-up/dialog; indexing state as color on the Source's card (queued → processing → ready/failed) | IA "Upload dialog"; Components "Upload dialog" ("Pop-up per addendum anchors"); Components "Source card" (status dot carries state color) + States "Ingestion"; DESIGN.md Components "Source card" |
| Limit violations surface as pop-up warning | Components "Warning dialog"; State "Limit violation"; DESIGN.md Components "Dialog" |
| First-run tour via tour library | Foundation + Components "First-run tour" (Driver.js); Flow 1 step 1 |

## 4. Other UX-relevant PRD decisions

- **MVP scope §6.1:** minimum viewport 320px → Foundation + Responsive. Multiple notebooks → IA. Text + Web sources → IA/Components. Citation → Original View → Components/States. Markdown for text sources + chat → Foundation/Components. Neo-brutalist zero-noise applied to all surfaces → DESIGN.md Brand. First-run tour → Components. Up to 10 sources/notebook, 30/user, 5MB, pop-up rejection → Components "Warning dialog".
- **SM-1 / SM-C1 counter-metric** (don't optimize citation density; keep factual): the anti-inflation stance is carried behaviorally — Voice & Tone "2 citations · 2 sources" (not "🔥 90% citation coverage!") and the requirement that citation chips are never decorative (DESIGN.md Components "Citation chip"). ✅
- **Non-goals** (no PDF/transcript/YouTube, no unprompted search, no offline, no credit gate in v0.1): correctly absent from the spines — reflected only as the approval-gated fetch-on-refusal (FR-7) and no credit UI anywhere. ✅

## 5. Not carried — each with justification (no silent drops)

- **DROPPED: none.**
- **SUPPORTED-BY-ASSUMPTION — Telemetry instrumentation for SM-1/SM-2 (citation attach + click-through), PRD §6.1.** The *behavior* (attach + click-through) is the core of Components "Citation chip" / State "Citation → Original View", but no instrumentation surface or metric readout appears in the spines. Not UX-qualitative: event firing is an engineering/telemetry concern, belongs in the architecture spine. Not a user-visible decision.
- **SUPPORTED-BY-ASSUMPTION — SM-3/SM-4 secondary metrics** (notebook count, sources growing, 80% fetch success). Metrics, not surfaces; the failure-facing design (State "Ingestion failed") is the UX half of SM-4.
- **SUPPORTED-BY-ASSUMPTION — FR-2 markdown Original View** is carried via Foundation's react-markdown line + tech-stack "Text sources + chat" rather than spelled out in the Original View row; treat as covered, could be made explicit in the design pass.

## 6. Verdict

All 10 FRs visible as a surface, component, state, or flow in EXPERIENCE.md. OQ-4 resolution present. All four addendum design anchors present. No qualitative PRD decision dropped.
