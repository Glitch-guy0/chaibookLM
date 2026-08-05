# Extract — design-style.md

## CRITICAL FRAMING
This doc ("Research Copilot UI Style") describes a soft, airy, editorial system — the OPPOSITE of chaibookLM's neo-brutalist direction on several axes. Treat as: layout grammar + component inventory + state logic reference, and an explicit "what NOT to do visually" counterpoint. Visual tokens for neo-brutalism must be authored fresh.

## Contradictions table (design-style vs chaibookLM brief)
| Axis | design-style.md | chaibookLM brief |
|---|---|---|
| Borders | Hairlines only; "let whitespace separate, not borders" | Thick hard borders |
| Shadows | None; active = colored glow ring | Bold offset shadows |
| Radius | Large (20-28px), uniformly rounded | Neo-brutalism: angular/hard |
| Color | ~95% monochrome + one gradient | Saturated/confident, high contrast |
| Typography | System-UI geometric sans, semi-bold, no display | Chunky playful typography |
| Emphasis | "Contrast through darkness, not color" | Saturated blocks |

## Compatible elements to CARRY (survive brutalist restyle)
- Three-pane workspace structure (icon rail → source/list → chat → insights panel) = "visible structure over airy whitespace."
- "Numbers are heroes" stat convention: small+gray label above, value large+bold below.
- "Conversational asymmetry": user = contained chip; AI = open document-like text → "you're reading a document that responds to you."
- One dark/hero contrast block per screen ("contrast through darkness" → hard-edged brutalist hero block).
- State legible in a static frame (in-progress = color, not motion-only).
- Composer anchored bottom, full-width; active = focus ring; inline icon affordances on right.
- Iconography: small, always paired with text labels — never icon-only for primary actions.

## Explicit do-nots
- "Apply the logic, not the specific labels/copy shown in the source images"; do not reuse specific icons, copy, chart data, or branding.

## Gap analysis (what design-style.md does NOT specify)
- No exact palette (only #FAFAFA-#FFFFFF range); no accent/text/status hex values.
- No type scale (no families, sizes, line-heights, weights beyond semi-bold/regular).
- No spacing system (only 24-32px panel padding).
- No radius tokens beyond 20-28px (brutalist brief overrides).
- No shadow/border/stroke tokens; no dark-mode, focus-visible, or contrast guidance.
- No icon set, grid system, breakpoints, motion, component-state spec.
- No responsive/mobile (min 320px) guidance.
- Conclusion: chaibookLM's brutalist token set must be written from scratch.
