---
name: chaibookLM
status: final
updated: 2026-08-05
description: Research workspace where answers are grounded in your own sources and every claim cites the original. Neo-brutalist + minimalistic-maximalist: bold, funky, deliberately unlike Google — personality in the structure, zero noise in the details.
colors:
  surface: '#FAF4E9'
  surface-elevated: '#FFFFFF'
  ink: '#17130E'
  ink-secondary: '#5A5146'
  ink-muted: '#766E63'
  border: '#17130E'
  brand: '#FF5C1A'
  brand-ink: '#1A0A00'
  cite: '#1E5EFF'
  cite-ink: '#FFFFFF'
  accent-yellow: '#FFD60A'
  accent-pink: '#FF3D8B'
  success: '#0B8A4B'
  warning: '#B88200'
  error: '#D62828'
  on-error: '#FFFFFF'
  focus-ring: '#17130E'
  overlay-dim: '#17130E8C'
typography:
  display-lg:
    fontFamily: 'Archivo Black'
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.1'
  display:
    fontFamily: 'Archivo Black'
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.15'
  display-sm:
    fontFamily: 'Archivo Black'
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.2'
  title:
    fontFamily: 'Space Grotesk'
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: 'Space Grotesk'
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body:
    fontFamily: 'Space Grotesk'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-medium:
    fontFamily: 'Space Grotesk'
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.6'
  meta:
    fontFamily: 'Space Mono'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  caption:
    fontFamily: 'Space Mono'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  citation:
    fontFamily: 'Space Mono'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  DEFAULT: 0
  sm: 0
  md: 2px
  lg: 4px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
  '8': 64px
  panel-pad: 20px
  gutter: 24px
components:
  button-primary:
    background: '{colors.brand}'
    foreground: '{colors.brand-ink}'
    border: '2px solid {colors.border}'
    radius: '{rounded.DEFAULT}'
    shadow: '4px 4px 0 0 {colors.border}'
  button-secondary:
    background: '{colors.surface-elevated}'
    foreground: '{colors.ink}'
    border: '2px solid {colors.border}'
    radius: '{rounded.DEFAULT}'
    shadow: '2px 2px 0 0 {colors.border}'
  button-danger:
    background: '{colors.error}'
    foreground: '{colors.on-error}'
    border: '2px solid {colors.border}'
    radius: '{rounded.DEFAULT}'
    shadow: '4px 4px 0 0 {colors.border}'
  citation-chip:
    background: '{colors.cite}'
    foreground: '{colors.cite-ink}'
    border: '1px solid {colors.border}'
    radius: '{rounded.md}'
  source-card:
    background: '{colors.surface-elevated}'
    border: '2px solid {colors.border}'
    radius: '{rounded.DEFAULT}'
    shadow: '3px 3px 0 0 {colors.border}'
  chat-user:
    background: '{colors.accent-yellow}'
    foreground: '{colors.ink}'
    border: '2px solid {colors.border}'
    radius: '{rounded.DEFAULT}'
  chat-assistant:
    background: 'transparent'
    foreground: '{colors.ink}'
  composer:
    background: '{colors.surface-elevated}'
    border: '2px solid {colors.border}'
    radius: '{rounded.sm}'
  dialog:
    background: '{colors.surface-elevated}'
    border: '3px solid {colors.border}'
    radius: '{rounded.DEFAULT}'
    shadow: '8px 8px 0 0 {colors.border}'
  showcase:
    background: '{colors.surface-elevated}'
    border: '2px solid {colors.border}'
  notebook-rail:
    background: '{colors.ink}'
    foreground: '{colors.surface}'
  notebook-rail-active:
    background: '{colors.brand}'
    foreground: '{colors.brand-ink}'
    border: '2px solid {colors.ink}'
---

## Brand & Style

chaibookLM is the everyday person's research workspace — the place where an AI answers *only* from what you brought, and every claim points back to the exact source you can check. Where NotebookLM is clean, Google-bound, and feature-first, chaibookLM is **funky, bold, and deliberately unique** — the lead differentiator on first impression.

The visual language is **neo-brutalism + minimalistic maximalism**: thick hard borders, bold offset shadows, a saturated confident palette, chunky playful typography, and visible structure over airy whitespace. The discipline is everything — *lots of personality, zero noise*. Every loud element must earn its volume; when the surface is calm it is because nothing was left to shout about. The aesthetic must survive small screens, so structure is carried by borders and blocks, never by subtle tints that vanish on a phone.

This is not premium, not quiet, not Google. It is *impossible to mistake for anything else* — and it must be executed with taste, because a brutalist system done sloppily is just noise.

## Colors

- **Cream Canvas (`{colors.surface}`)** is the primary background. Warm enough to soften long research sessions, confident enough to carry the brutalist frame. It is the "paper" every panel sits on.
- **Ink (`{colors.ink}`)** is the frame: text, borders, and hard shadows all share it. The signature neo-brutalist move is a `2px` ink border with a solid offset ink shadow — structure made visible.
- **Brand Orange (`{colors.brand}`)** is the primary action color: primary buttons, active notebook, brand moments. It is the energy of the product — a saturated, confident signal that means "this does the thing."
- **Citation Blue (`{colors.cite}`)** is the trust color — reserved for citations and links. Citations are the product's core promise (every claim points back to a source you can check), so they get their own semantic color, never borrowed for chrome.
- **Chroma yellow (`{colors.accent-yellow}`)** and **pink (`{colors.accent-pink}`)** are structural play — used sparingly for contained user messages, status flourishes, and the one funky highlight per screen. Two chromas maximum on any screen.
- **Ink Secondary (`{colors.ink-secondary}`)** is secondary text — descriptions and less-emphasized labels. **Ink Muted (`{colors.ink-muted}`)** is the quietest ink, reserved for evidence text: timestamps, "added time", metadata — set only in `meta`/`caption`/`citation` sizes, never on body.
- **Semantic states** — `{colors.success}` (ready), `{colors.warning}` (queued/processing attention), `{colors.error}` (failed) — always paired with a text label; color is never the only channel. Dot values are darkened to hold ≥3:1 against white source cards.
- **Elevated White (`{colors.surface-elevated}`)** for panels, cards, dialogs, and the showcase — objects that "lift off" the canvas.
- **Overlay Dim (`{colors.overlay-dim}`)** is the dialog backdrop — `#17130E` at 55% alpha. Dims the canvas so the heavy-bordered dialog reads as the top object.

Avoid: gradients, glassmorphism, pastel fills, more than two loud chromas per screen, and any use of `{colors.cite}` that isn't a citation or link.

## Typography

Three voices, each with a job:

- **Archivo Black** is the display voice — chunky, heavy, playful. It appears in the brand, empty states, notebook names, and the rare statement moment. Set tight (`1.1`–`1.2`), never cramped, never used for body.
- **Space Grotesk** is the working voice — modern, friendly, highly legible at length. All body copy, chat answers, source titles, and UI labels live here.
- **Space Mono** is the verifier's voice — the "receipt" type. Citations, source metadata (type, size, added time), status labels, and microcopy that reads like evidence. It grounds the promise that everything here is checkable.

Type hierarchy does the structure work: `{typography.display}` for statements, `{typography.title}` for surface headers, `{typography.body}` for reading, `{typography.meta}`/`{typography.citation}` for evidence. Meta and citation sizes render in `{colors.ink-muted}` — darkened to hold AA against both the cream canvas and white panels. All sizes honor fluid scaling down to the 320px viewport; text must remain legible without truncation at every supported size.

## Layout & Spacing

Scale is the 4-based system: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64` px. `{spacing.gutter}` (24px) separates the three work surfaces; `{spacing.panel-pad}` (20px) pads panel interiors; the smallest steps (`4–8px`) sit between tightly-related elements inside a card.

Desktop is a three-pane workspace on the cream canvas: a thin **notebook rail** (far left), the **sources panel**, the **chat column**, and the **original-view showcase** on the right. Each pane is its own bordered, shadowed object on the canvas — visible structure, explicit edges, no ambiguity about what belongs to what. Panes collapse per breakpoint (see EXPERIENCE.md Responsive & Platform); the rail becomes an icon strip and then a drawer, and on the smallest screens the workspace is a single stacked surface.

Maximum content width for chat reading is `max-w-2xl` within its column — answers are for reading, not spreadsheeting.

→ Composition references: `mockups/key-workspace.html`, `mockups/key-upload-dialog.html`, `mockups/key-mobile.html`. Spine wins on conflict.

## Elevation & Depth

Elevation is **hard, not ambient**. Depth comes exclusively from solid offset shadows in ink (`4px 4px 0 0` for primary actions and cards, `8px 8px 0 0` for dialogs) — zero blur, zero spread, no soft glow. Objects don't float, they *stamp*.

Interaction follows the metaphor: an interactive object on hover shifts `-1px` on both axes and its shadow grows to `6px`/`10px` — the object visibly lifts. On press, the offset collapses to `0` — the object is *pushed down into the surface*. Tonal layering (cream → white) adds a second, quieter depth axis: elevated panels are white on cream.

**Focus is a rule, not a shadow.** The focus indicator is a `3px` ring in `{colors.focus-ring}` with a `2px` offset in `{colors.surface}`, applied via `:focus-visible` only — never the lift/press shadow, never a glow. On ink fills (notebook rail) and brand fills, the ring **inverts** to `{colors.surface}` so it never vanishes into its own background. Focus must stay legible independently of hover and press states.

## Shapes

Neo-brutalism means **hard corners by default**: `{rounded.DEFAULT}` = `0`, used for every panel, button, card, dialog, and source card. The signature object is a sharp-cornered, thick-bordered, offset-shadowed block. `{rounded.md}` (2px) appears only on the smallest inline elements (citation chips, status pills) so chips don't read as teeth; `{rounded.full}` is reserved exclusively for status dots. No soft, large-radius panels, no pill buttons.

## Components

- **Primary button** — `{colors.brand}` fill, ink text, `2px` ink border, `4px 4px 0 0` ink shadow, hard corners. The loudest interactive object; appears once per action group.
- **Secondary button** — white fill, ink text, `2px` ink border, `2px` shadow. For less-committed actions (cancel, inspect). The **add-source trigger** is a `button-secondary` — no bespoke trigger style.
- **Danger button** — `{colors.error}` fill, white text, ink border + shadow. Reserved for destructive confirmations (delete notebook, remove sources).
- **Citation chip** — the product's signature: `{colors.cite}` fill, white Space Mono text, `1px` ink border, `2px` radius, small. Rendered inline at the end of the answer sentence it supports. Clicking opens the Original View; hover reveals the source title. Never decorative, never "prettified" into a superscript footnote.
- **Source card** — white, `2px` ink border, `3px` offset shadow. Shows icon, title, type + size, added time, and a status dot that carries the ingestion state's color. Status text is always present, never color-only.
- **User message** — `{colors.accent-yellow}` contained block, ink text, `2px` ink border, hard corners, right-aligned. The reader's voice is a contained chip; the system's is open.
- **Assistant message** — open, unbordered document-style text on the canvas — "you're reading a document that responds to you." Citations appear inline. No bubble, no avatar, no reply glow.
- **Composer** — white, `2px` ink border, bottom of the chat column. Focus = `2px` brand border + visible hard focus ring; Enter sends, Shift+Enter newline.
- **Dialog** — white, `3px` ink border, `8px 8px 0 0` shadow — the heaviest object on screen, sitting on the `{colors.overlay-dim}` backdrop. Used for uploads, confirmations, and limit warnings.
- **Showcase** — the right-hand original-view panel: white, `2px` ink border, renders the live webpage (web source) or the full text with the cited passage highlighted (text source). The first-run tour is a Driver.js overlay with no custom visual spec beyond its default chrome.
- **Notebook rail** — ink-colored strip on the far left, cream text; active notebook sits on the brand orange with `brand-ink` labels (`{components.notebook-rail-active}`), plus a non-color indicator (bold weight and a filled glyph) so the active state is never color-only. The one dark block per screen.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Thick `2px` ink borders + solid offset shadows — structure made visible | Hairlines, soft glows, glassmorphism, floating panels |
| Two loud chromas max per screen, each with a job | Rainbows, gradients, pastel fills, decorative chroma |
| `{colors.cite}` only for citations and links | Using blue for chrome, states, or hover affordances |
| Hard corners everywhere; `2px` only on tiny chips; full-radius only on dots | Pills, large soft radii, rounded cards |
| Assistants as open text, users as contained chips | Chat bubbles, avatars, typing-dot drama |
| Color + text label for every state | State communicated by color alone |
| `3px` focus ring + `2px` offset, inverted on ink/brand fills, `:focus-visible` only | Glow, shadow-based focus, or focus that vanishes on dark fills |
| Keep debug overlays zero-impact (see EXPERIENCE.md Developer Contract) | Let debug labels reflow, cover, or restyle components |

`[ASSUMPTION]` — Fonts via free Google Fonts (Archivo Black, Space Grotesk, Space Mono); zero licensing cost. Palette hex values are a first pass to be taste-checked on the first real build; the *roles* (cream canvas / ink frame / brand / cite / chroma discipline) are fixed.
