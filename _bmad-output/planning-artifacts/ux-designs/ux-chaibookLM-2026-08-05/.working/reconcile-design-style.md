# Input Reconciliation — Design Style (Research Copilot) vs UX Spines

- **Input:** `_bmad-output/planning-artifacts/design-style.md`
- **Spines:** `ux-designs/ux-chaibookLM-2026-08-05/EXPERIENCE.md`, `DESIGN.md`
- Nature of the input: a reference style grammar, not a binding spec ("apply the *logic*, not the literal content"). Reconciliation therefore separates *compatible elements* (structure/behavior carried) from *contradictory visual tokens* (explicitly rejected, because the brief mandates neo-brutalist, not soft/low-chrome).

## 1. Compatible elements — carried

| Element | Landed in spines |
|---|---|
| **Three-pane workspace** (icon rail → source list → conversational → insight sidebar; columns as separate cards, not edge-to-edge) | EXPERIENCE IA + Responsive: four explicit panes on the canvas (notebook rail → sources → chat → showcase), each its own bordered/shadowed object; DESIGN.md Layout & Spacing |
| **Numbers are heroes** (small gray label above, large bold value below; stat-card convention) | EXPERIENCE Inspiration ("the 'numbers are heroes' stat convention" lifted); Voice ("2 citations · 2 sources"); IA "Account" (source-limit overview is the natural stat home) |
| **Conversational asymmetry** (user = contained chip, right-aligned; assistant = open, document-like text, no bubble) | EXPERIENCE Components "User message" / "Assistant message"; DESIGN.md Components + Do&Don'ts ("Assistants as open text, users as contained chips") |
| **Composer anchored at bottom of chat column, full-width, focus affordance, inline send** | EXPERIENCE Components "Composer" (Enter/Shift+Enter, disabled while generating); DESIGN.md Components "Composer" (focus = brand border + hard ring) |
| **Status/accent dots, small and functional** | DESIGN.md semantic states (success/warning/error dots) — but always paired with a text label, never color-only (see §3.3) |
| **Loading/progress as quiet, textual, non-blocking** (ingestion row in list) | EXPERIENCE States "Ingestion" (queued → processing → ready/failed, dot + label on card) |
| **Top-right identity cluster (avatar + name/email)** | EXPERIENCE IA "Account" (header avatar) |
| **Collapsible list rows (leading icon, truncated label)** | Structural carry: EXPERIENCE Components "Source card" (icon, title, type+size, added time) |

## 2. Contradictory visual tokens — explicitly rejected (recorded, not silently dropped)

| Style token | Spine disposition |
|---|---|
| Large corner radii 20–28px; "rounded everything"; pill buttons/inputs | REJECTED — DESIGN.md Shapes: hard corners default (0px), `2px` only on tiny chips, full-radius only on dots; "No soft, large-radius panels, no pill buttons" |
| Soft airy whitespace doing the work of borders; low-chrome | REJECTED for the brutalist frame — DESIGN.md Brand & Style ("visible structure over airy whitespace"; thick ink borders + offset shadows carry structure) |
| Muted gray/lavender page background; pastel fills | REJECTED — cream canvas (`surface #FAF4E9`); DESIGN.md Colors "Avoid… pastel fills" |
| Warm coral→blue/purple **gradient** accent | REJECTED — flat brand orange; DESIGN.md Colors "Avoid: gradients"; Elevation "zero blur" |
| Pale-blue soft-tint tags/pills | REJECTED — hard chips; citation blue reserved exclusively for citations/links |
| Selected rows = light gray fill + rounded corners; focus = colored gradient border glow | REJECTED — hard ink focus ring (EXPERIENCE A11y: `2px` ink ring + `2px` cream offset); active notebook sits on brand orange (DESIGN.md "Notebook rail") |
| "Whitespace separates, not borders" + "one accent used rarely" principles | Partially REJECTED (borders carry structure); the *one-focal-element* restraint is KEPT — DESIGN.md Colors ("spend… on exactly one focal element per screen"; two chromas max) |

The rejection is explicit in the spines themselves, so it is a deliberate decision, not a drop: EXPERIENCE Inspiration ("The *visual* tokens are rejected in favor of the brutalist language — structure and behavior carry, the soft aesthetic does not") and DESIGN.md Brand & Style ("This is not premium, not quiet, not Google").

## 3. Not carried — each with justification (no silent drops)

- **DROPPED: none.**
- **SUPPORTED-BY-ASSUMPTION — concrete stat-card / stat-trio token.** Adopted as a convention (Inspiration) but no DESIGN.md component token defines it; the first-pass token set is under OQ-U2 `[ASSUMPTION]` (taste-check before promotion) and the Account source-limit overview is its home. To be formalized in the design pass, not lost.
- **SUPPORTED-BY-ASSUMPTION — byte-progress + time-remaining on ingestion rows.** Simplified to the addendum's authoritative anchor (indexing state = color + label on the card; queued → processing → ready/failed), which supersedes the reference's progress-row detail. The "quiet, non-blocking" behavior is preserved.
- **Not adopted (reference tokens, consistent with "apply the logic, not the literal"):** media-player card (video/audio is out of v0.1 scope), comparison table, FAB (primary actions are buttons/dialogs in v0.1), two-voice iconography pairing. None is a binding decision from the input.
- **Calm keyword:** the *calm, glanceable* behavior survives (EXPERIENCE Voice); the *soft/low-chrome* reading of it is the rejected token.

## 4. Verdict

Compatible elements (three-pane, numbers-are-heroes, conversational asymmetry) are carried; contradictory tokens (rounding, soft palette, gradient accent, whitespace-over-borders) are explicitly rejected in both spines. No qualitative element dropped.
