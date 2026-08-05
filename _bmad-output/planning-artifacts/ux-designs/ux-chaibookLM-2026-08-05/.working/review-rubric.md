# Spine Pair Review — chaibookLM

## Overall verdict

A strong, mechanically tight pair: all 23 DESIGN.md token references resolve, every UJ has a key flow with named protagonist and climax, canonical section order holds, and the pair commits hard decisions (per-sentence citation chips, brutalist discipline, approval-gated fetch, debug-naming contract). It is not yet a clean source-extract contract for three load-bearing reasons: the active-notebook nav state is sub-AA and outside the stated contrast guarantee; the PRD addendum is cited as authority ("addendum Design anchors") but missing from `sources`; and the pair carries zero visual references and never states "Spine wins on conflict." No critical misses; downstream consumers can build from it, but they will inherit a contrast failure and one unresolved source citation.

## 1. Flow coverage — strong

Checked EXPERIENCE.md Key Flows against UJ-1/UJ-2 in prd.md §2.2. Both UJs have flows with named protagonists (Meera, Sam), numbered steps, and labeled climax beats. Flow 3 correctly covers UJ-1's refusal turn, which the PRD lists as a sub-beat of UJ-1. FR-1..FR-10 all map to IA surfaces or state rows.

### Findings
- **[medium]** Flow 3 has no failure path for the fetch-on-refusal — the post-approval fetch is an external network op (FR-7) and its failure mode is unspecified; State Patterns "Network / LLM error" is scoped to chat answers, not the approval-gated fetch. (EXPERIENCE.md:157-162). *Fix:* add a failure beat — fetch fails → refusal state restored with a retry button, no new sources.
- **[low]** Flow 2 lacks a failure path (removal failure, notebook-switch failure). The stale-sources state covers the consequence but the flow never exercises it. (EXPERIENCE.md:149-155). *Fix:* one failure beat referencing the stale-sources row.

## 2. Token completeness — adequate

Every `{path.token}` reference in both files resolves to a defined token; every component-token reference inside `components:` resolves; no undefined-token references found. Contrast targets are stated for ink-on-orange and white-on-blue. Two load-bearing gaps below.

### Findings
- **[high]** Active-notebook label is cream (`{colors.surface}` #FAF4E9) on brand orange (#FF5C1A) — computed ≈2.8:1, fails WCAG AA at every text size. The contrast guarantee (EXPERIENCE.md:101) covers ink-on-orange buttons and white-on-blue citation chips only; this nav-state combination is load-bearing and uncovered. (DESIGN.md:205; EXPERIENCE.md:101). *Fix:* state a target for the active rail item and change one side — e.g., ink text on brand, or a darker brand variant for this context.
- **[medium]** `overlay-dim` is `rgba(23,19,14,0.55)`, not a hex string — the spec requires hex values for color tokens (design-md-spec.md:15). It is also never referenced by any prose or component. (DESIGN.md:22). *Fix:* use `'#17130E8C'` or drop the orphan.
- **[medium]** Load-bearing tokens are explicitly provisional: "Palette hex values are a first pass to be taste-checked" (DESIGN.md:219) + OQ-U2 (EXPERIENCE.md:167). Roles are committed, values are not — a consumer cannot treat the palette as final. *Fix:* acceptable as a committed deferral, but say what gates promotion (first build) and keep OQ-U2 as the single tracking point.
- **[low]** Orphan tokens never referenced in prose or components: `ink-secondary`, `ink-muted`, `focus-ring` (focus-ring duplicates `ink`'s value). (DESIGN.md:8-9,21). *Fix:* reference or drop; otherwise they read as dead palette entries.

## 3. Component coverage — adequate

All 11 DESIGN components have prose visual specs that map 1:1 to the `components:` frontmatter keys. Cross-file pairing is semantically complete but name-drifted and incomplete at the edges.

### Findings
- **[medium]** Buttons (primary/secondary/danger) have visual specs (DESIGN.md:92-109, 195-197) but no behavioral rows in EXPERIENCE Component Patterns — despite appearing in behavior everywhere (empty-state primary action, upload confirm, "Find related web pages", warning-dialog dismiss). (EXPERIENCE.md:55-67). *Fix:* add a Button row (or three) with send/dismiss/confirm rules.
- **[medium]** Cross-file name drift breaks "identical across both files": Notebook rail ↔ Notebook rail item, Showcase ↔ Original View, Dialog ↔ Upload/Warning dialog. A consumer source-extracting "Original View" finds no DESIGN component by that name. (EXPERIENCE.md:57,64-66). *Fix:* unify names or add explicit aliases in both tables.
- **[low]** "Add source trigger" (EXPERIENCE.md:59) and "First-run tour" (EXPERIENCE.md:67) have no visual counterpart in DESIGN Components. *Fix:* state that the trigger is a `button-secondary` and the tour is a Driver.js overlay with no custom visual spec.

## 4. State coverage — strong

Every applicable state is covered: signed-out wall, cold-load skeletons, empty notebook, ingestion lifecycle, ingestion failed, answer generating, refusal, citation→Original View (loading + failure fallback), limit violation, network/LLM error, stale sources. Offline and permission-denied are correctly N/A (PRD §5 "No offline mode"; single-user Clerk).

### Findings
- **[low]** Upload dialog only specifies empty/whitespace rejection for the text path; invalid-URL handling in the URL field (pre-submit) is unspecified — FR-3 covers post-fetch failure, not field validation. (EXPERIENCE.md:59). *Fix:* one line: inline error on malformed URL, submit still allowed for the text path.

## 5. Visual reference coverage — thin

`imports/` exists and is empty; there is no `mockups/` or `wireframes/`. No "→ Composition reference" lines appear in either spine, and "Spine wins on conflict" is never stated. No orphans exist (nothing to orphan), but the pair is composition-unanchored.

### Findings
- **[medium]** No visual references and no "Spine wins on conflict" contract line. The mobile tabbed framing (Sources | Chat | Showcase) is load-bearing but unvalidated — OQ-U4 itself calls for "a mobile mock" that does not exist. (EXPERIENCE.md:168). *Fix:* resolve OQ-U4 with a mock and add the example-spine pattern "→ Composition reference: `imports/…`. Spine wins on conflict." once visuals land.

## 6. Bloat & overspecification — strong

Prose is lean and decision-bearing; no source restatement beyond what Foundation requires; token values restated in prose match the calibrated example format. No decorative narrative untied to a decision.

### Findings
- **[low]** The Developer Contract section (EXPERIENCE.md:104-114) is engineering content in a UX spine. It earns its place (cross-ref from DESIGN.md:217, STRICT RULE in memlog) but is architecture's to own. *Fix:* keep as-is for v0.1; move to architecture when it exists.

## 7. Inheritance discipline — adequate

All five `sources` paths resolve on disk. EXPERIENCE token references (`{colors.brand}`, `{colors.cite}`) resolve to DESIGN.md tokens. Limit numbers consistent (5MB/10/30) across EXPERIENCE, PRD §6.1, and addendum.

### Findings
- **[medium]** "pop-up per addendum Design anchors" (EXPERIENCE.md:33,65) cites the PRD addendum's "Design anchors (decided 2026-08-05)" section, but `prds/prd-chaibookLM-2026-08-04/addendum.md` is not listed in `sources` — only the brief addendum is, and it contains "Design direction," not "Design anchors." (EXPERIENCE.md:4-9). *Fix:* add the PRD addendum to `sources`.
- **[medium]** UJ names are paraphrased and flows carry no UJ IDs: "builds a research notebook for a topic and verifies an answer" → "builds a notebook and verifies an answer"; "curates his sources over time" → "curates his sources across sessions." (EXPERIENCE.md:137,149 vs prd.md:29,37). *Fix:* tag flows UJ-1/UJ-2 or keep verbatim.

## 8. Shape fit — strong

DESIGN.md: all eight canonical sections present in locked order (Brand & Style → Do's and Don'ts). EXPERIENCE.md: all required defaults present (Foundation, IA, Voice, Components, States, Primitives, A11y, Key Flows); Responsive & Platform and Inspiration & Anti-patterns present where applicable. Invented sections (Open Questions, Developer Contract) earn their place via committed assumptions and cross-refs.

### Findings
- **[low]** DESIGN.md frontmatter lacks `status`/`updated` while EXPERIENCE.md carries `status: draft` and `updated` — the pair's revision state reads inconsistently. (DESIGN.md:1-3). *Fix:* add `status: draft` and `updated: 2026-08-05`.

## Mechanical notes

- **Name inconsistencies:** Notebook rail / Notebook rail item; Showcase / Original View; Dialog / Upload dialog / Warning dialog. Flow headings differ from UJ verbatim (see §7).
- **Broken cross-refs:** "addendum Design anchors" → PRD addendum not in `sources` (see §7). DESIGN→EXPERIENCE section refs (Responsive & Platform, Developer Contract) resolve. EXPERIENCE→PRD §6.1 resolves. No undefined `{token}` refs anywhere.
- **Frontmatter:** EXPERIENCE complete (name/status/sources×5/updated); DESIGN has name+description only.
- **Visuals:** `imports/` empty, no mockups/wireframes, no composition-reference lines, "Spine wins on conflict" never stated.
- **Consistency:** 5MB/10/30 limits, per-sentence citation chips, and 3-surface IA are stable across DESIGN, EXPERIENCE, PRD, and addendum.
