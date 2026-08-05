# Accessibility Review — chaibookLM

Reviewer: accessibility lens (ad-hoc, consumer stakes). Target: WCAG 2.2 AA, responsive web surface, min 320px, neo-brutalist design language. Sources: `DESIGN.md`, `EXPERIENCE.md`, `prd.md`.

## Overall verdict

The spine is unusually strong on paper — status color is always paired with a text label, citation chips have a full keyboard path, touch targets are dimensioned, and Reduced Motion is named. But three load-bearing token failures (ink-muted for meta text, warning status dot, cream-on-brand for the active notebook) break the WCAG 2.2 AA claim as written, and the focus system has a real blind spot on the ink notebook rail. These are token-level, not taste-level: fixable in the palette and the focus rule before build. The remaining gaps (dialog focus management, showcase close path, mobile tab semantics, tour accessibility, ingestion announcements) are underspecified behaviors that will silently fail AA if left to default implementation.

## Findings

- **[critical]** `ink-muted #8A8175` fails AA normal-text contrast on both load-bearing surfaces — 3.50:1 on surface, 3.83:1 on surface-elevated (needs 4.5:1). It is assigned to `typography.meta` (13px) and `typography.citation` (12px) — source metadata, timestamps, "added time", status labels — i.e. small text, so the large-text (3:1) pass does not apply. (DESIGN.md Colors, Typography; source cards.) *Fix:* darken token to `#766E63` (4.59:1 on cream, ~4.7:1 on white) or `#6E6659`.
- **[high]** Active notebook on the ink rail sits on `brand #FF5C1A` but no active-label color is specified; rail foreground is `surface`. Cream on brand = 2.82:1 — fails AA for every text class. (DESIGN.md Components → notebook-rail.) *Fix:* active notebook label in `brand-ink #1A0A00` (6.25:1); add a non-color active indicator (bold weight or icon) for CVD.
- **[high]** Focus ring `ink #17130E` on the ink `#17130E` notebook rail is **invisible** — 0 contrast against its own background. The 2px cream offset becomes the only indicator, and it is a thin 2px ring, not the nominal focus token. (DESIGN.md Colors → focus-ring; Components → notebook-rail.) *Fix:* rule — on ink/`brand` fills, invert the ring to `surface` (cream, 16.89:1 on ink) and drop the ink component; use `3px` ring + `2px` offset everywhere (a 2px ink ring visually merges with the `2px` ink borders around cards), applied via `:focus-visible` only.
- **[high]** `warning #F5A800` status dot on white source cards = 2.00:1 — fails the 3:1 UI-component threshold (1.83:1 on cream). `success #0FA958` on white = 3.07:1 passes but with razor-thin margin. (DESIGN.md Colors → semantic states; source-card.) *Fix:* darken warning to `#B88200` (~3.08:1 on cream, >3.1 on white); darken success to ~`#0D9A50` for ≥3.5:1 margin. Keep the paired text label (already required).
- **[medium]** Dialogs (upload, confirmations, limit warnings) specify Esc-to-close but not focus trap, initial focus, or focus return. (EXPERIENCE.md Interaction Primitives.) *Fix:* trap Tab inside open dialog, focus the first control on open (or the confirm button), return focus to the invoking control on close.
- **[medium]** Original View showcase has no specified close path for keyboard. Desktop has no Esc-to-close; mobile full-screen "back affordance" is visual-only in spec. (EXPERIENCE.md Responsive & Platform; Key Flows.) *Fix:* Esc closes the showcase and returns focus to the citation chip; the mobile back control is a labeled button ≥44px; on open, focus moves into the showcase container (announced per the floor) and returns to the chip on close.
- **[medium]** No skip link specified for the four-pane desktop layout — Tab order follows reading order (rail → sources → chat → showcase), so reaching chat requires tabbing past two panes. (EXPERIENCE.md Interaction Primitives.) *Fix:* "Skip to chat" link (or skip-to-main) as first tab stop.
- **[medium]** Mobile tabbed surface (`Sources | Chat | Showcase`) has no tab semantics specified — no `role="tablist"/tab`, `aria-selected`, or arrow-key behavior. (EXPERIENCE.md Responsive & Platform, OQ-U4.) *Fix:* real tablist pattern with arrow-key navigation; the tab that owns the focusable content is the mobile navigation affordance for SR users.
- **[medium]** Driver.js tour: no reduced-motion or focus handling specified for the walkthrough overlay. (EXPERIENCE.md Foundation, Accessibility Floor.) *Fix:* configure Driver.js with `prefers-reduced-motion` (disable its animations), `role="dialog"` `aria-modal`, focus containment, and Esc-to-dismiss matching the app dialog convention.
- **[medium]** Ingestion `aria-live` is underspecified: the live region location (per-card vs a single status region), and whether failure reasons ("Couldn't fetch this page." + reason) are announced, are not defined. (EXPERIENCE.md Accessibility Floor; State Patterns → ingestion.) *Fix:* one polite live region announcing final states (`ready`/`failed`) including reason; intermediate `queued → processing` need not announce.
- **[medium]** Fetch-on-refusal completion: after approval, newly indexed sources appear in the Sources panel — on mobile that is a *different tab* from chat. No announcement specified. (EXPERIENCE.md State Patterns → refusal.) *Fix:* announce "Added N sources" in the chat live region regardless of the active tab.
- **[low]** Streaming answer text has no SR treatment specified. (EXPERIENCE.md State Patterns → answer generating.) *Fix:* render the answer inside a `aria-live="polite"` region (or commit per-stream-chunk with a stable region); never `assertive`.
- **[low]** Text-source cited-passage highlight is visual color-only — no non-color cue or SR hook besides the announced title. (EXPERIENCE.md Component Patterns → Original View.) *Fix:* announce the passage (already implied), and ensure the highlight uses a second cue (e.g. `mark` semantics / bold) not color alone.
- **[low]** cite-blue vs brand-orange is CVD-safe today only because chips and buttons differ by shape, border weight, and text color (white vs ink), not by hue — preserve that. Guard the one color-only risk: rail active state (covered above) and the `focus` vs `pressed` states of the lift/press interaction, which must not rely on shadow-position alone. (DESIGN.md Elevation & Depth.) *Fix:* keep `:focus-visible` outline independent of the `:active` press (offset collapse).

## Contrast table

Computed with WCAG relative-luminance formula (sRGB). Normal text AA = 4.5:1; large text/UI component = 3:1.

| Token pair | Ratio | AA verdict |
|---|---|---|
| ink `#17130E` / surface `#FAF4E9` | 16.89:1 | PASS (normal / large / UI) |
| ink `#17130E` / surface-elevated `#FFFFFF` | 18.49:1 | PASS (all) |
| brand `#FF5C1A` / brand-ink `#1A0A00` | 6.25:1 | PASS (normal) |
| cite `#1E5EFF` / white `#FFFFFF` | 5.12:1 | PASS (normal) |
| accent-yellow `#FFD60A` / ink `#17130E` | 13.10:1 | PASS (all) |
| ink-secondary `#5A5146` / surface `#FAF4E9` | 7.10:1 | PASS (all) |
| error `#D62828` / white `#FFFFFF` | 5.01:1 | PASS (normal) |
| **ink-muted `#8A8175` / surface `#FAF4E9`** | **3.50:1** | **FAIL normal text** (passes large/UI only; used at 12–13px) |
| **ink-muted `#8A8175` / surface-elevated `#FFFFFF`** | **3.83:1** | **FAIL normal text** |
| **surface `#FAF4E9` / brand `#FF5C1A` (active notebook label)** | **2.82:1** | **FAIL all** |
| **warning `#F5A800` / white `#FFFFFF` (status dot)** | **2.00:1** | **FAIL UI (3:1)** |
| warning `#F5A800` / surface `#FAF4E9` (status dot) | 1.83:1 | FAIL UI |
| success `#0FA958` / white `#FFFFFF` (status dot) | 3.07:1 | PASS UI (razor-thin margin) |
| success `#0FA958` / surface `#FAF4E9` (status dot) | 2.81:1 | FAIL UI |
| ink `#17130E` / cite `#1E5EFF` (focus ring on chip) | 3.61:1 | PASS UI |
| ink `#17130E` / brand `#FF5C1A` (focus ring on brand) | 5.98:1 | PASS UI |
| ink `#17130E` / error `#D62828` (focus ring on danger) | 3.69:1 | PASS UI |
| surface `#FAF4E9` / ink `#17130E` (inverted ring on rail) | 16.89:1 | PASS UI |
| ink-secondary `#5A5146` / white `#FFFFFF` | 7.78:1 | PASS (all) |
| cite `#1E5EFF` / surface `#FAF4E9` | 4.68:1 | PASS (normal) |
| brand `#FF5C1A` / white `#FFFFFF` | 3.09:1 | PASS UI (component only — never for text) |
| error `#D62828` / surface `#FAF4E9` | 4.57:1 | PASS (normal) |

Suggested fixes verified to hit target: ink-muted → `#766E63` (4.59:1 on cream); warning dot → `#B88200` (~3.1:1 on both); active-notebook label → `brand-ink #1A0A00` (6.25:1).

(End of file)
