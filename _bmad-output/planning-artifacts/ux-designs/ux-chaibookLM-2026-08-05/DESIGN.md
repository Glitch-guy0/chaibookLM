---
name: chaibookLM
status: final
updated: 2026-08-06
description: Research workspace where answers are grounded in your own sources and every claim cites the original. Purely neo-brutalist: bold, funky, deliberately unlike Google — personality in the structure, zero noise in the details.
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
  surface-dark: '#16130D'
  surface-elevated-dark: '#201C14'
  ink-dark: '#F2E9DC'
  ink-secondary-dark: '#C9BEB0'
  ink-muted-dark: '#A79B8B'
  border-dark: '#F2E9DC'
  brand-dark: '#FF7A3D'
  brand-ink-dark: '#1A0A00'
  cite-dark: '#6FA8FF'
  cite-ink-dark: '#0A1A3D'
  accent-yellow-dark: '#FFE14D'
  accent-pink-dark: '#FF6FA8'
  success-dark: '#3ECB7B'
  warning-dark: '#E8B100'
  error-dark: '#FF6B6B'
  on-error-dark: '#3A0606'
  focus-ring-dark: '#F2E9DC'
  overlay-dim-dark: '#0D0B078C'
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
    shadow: '6px -6px 0 0 {colors.border}'
    slant: '-6deg'
    shadow-slant: '-12deg'
  button-secondary:
    background: '{colors.surface-elevated}'
    foreground: '{colors.ink}'
    border: '2px solid {colors.border}'
    radius: '{rounded.DEFAULT}'
    shadow: '4px -4px 0 0 {colors.border}'
    slant: '-6deg'
    shadow-slant: '-12deg'
  button-danger:
    background: '{colors.error}'
    foreground: '{colors.on-error}'
    border: '2px solid {colors.border}'
    radius: '{rounded.DEFAULT}'
    shadow: '6px -6px 0 0 {colors.border}'
    slant: '-6deg'
    shadow-slant: '-12deg'
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
  notebook-card:
    background: '{colors.surface-elevated}'
    border: '2px solid {colors.border}'
    radius: '{rounded.DEFAULT}'
    shadow: '3px 3px 0 0 {colors.border}'
  notebook-card-active:
    background: '{colors.brand}'
    foreground: '{colors.brand-ink}'
    border: '3px solid {colors.border}'
    radius: '{rounded.DEFAULT}'
    shadow: '5px 5px 0 0 {colors.border}'
---

## Brand & Style

chaibookLM is the everyday person's research workspace — the place where an AI answers *only* from what you brought, and every claim points back to the exact source you can check. Where NotebookLM is clean, Google-bound, and feature-first, chaibookLM is **funky, bold, and deliberately unique** — the lead differentiator on first impression.

The visual language is **purely neo-brutalist**: thick hard borders, bold offset shadows, a saturated confident palette, chunky playful typography, and visible structure over airy whitespace. The discipline is everything — *lots of personality, zero noise*. Every loud element must earn its volume; when the surface is calm it is because nothing was left to shout about. The aesthetic must survive small screens, so structure is carried by borders and blocks, never by subtle tints that vanish on a phone.

This is not premium, not quiet, not Google. It is *impossible to mistake for anything else* — and it must be executed with taste, because a brutalist system done sloppily is just noise.

**Design stack (decided 2026-08-06):** the tokens in this file map **1:1 to the Tailwind CSS theme config** (`colors`, `fontFamily`, `fontSize`, `lineHeight`, `borderRadius`, `boxShadow`, `spacing`). Dark mode uses Tailwind's class strategy: a `dark` class on `<html>` driven by `prefers-color-scheme` by default, overridable by a manual choice persisted via a consented cookie (FR-12). Components are styled with utility classes only; the only custom CSS lives in `globals.css` for the CSS custom properties that back the theme.

## Colors

- **Cream Canvas (`{colors.surface}`)** is the primary background. Warm enough to soften long research sessions, confident enough to carry the brutalist frame. It is the "paper" every panel sits on.
- **Ink (`{colors.ink}`)** is the frame: text, borders, and hard shadows all share it. The signature neo-brutalist move is a `2px` ink border with a solid offset ink shadow — structure made visible.
- **Brand Orange (`{colors.brand}`)** is the primary action color: primary buttons, active notebook card, brand moments. It is the energy of the product — a saturated, confident signal that means "this does the thing."
- **Citation Blue (`{colors.cite}`)** is the trust color — reserved for citations and links. Citations are the product's core promise (every claim points back to a source you can check), so they get their own semantic color, never borrowed for chrome.
- **Chroma yellow (`{colors.accent-yellow}`)** and **pink (`{colors.accent-pink}`)** are structural play — used sparingly for contained user messages, status flourishes, and the one funky highlight per screen. Two chromas maximum on any screen.
- **Ink Secondary (`{colors.ink-secondary}`)** is secondary text — descriptions and less-emphasized labels. **Ink Muted (`{colors.ink-muted}`)** is the quietest ink, reserved for evidence text: timestamps, "added time", metadata — set only in `meta`/`caption`/`citation` sizes, never on body.
- **Semantic states** — `{colors.success}` (ready), `{colors.warning}` (queued/processing attention), `{colors.error}` (failed) — always paired with a text label; color is never the only channel. Dot values are darkened to hold ≥3:1 against their card.
- **Elevated White (`{colors.surface-elevated}`)** for panels, cards, dialogs, and the showcase — objects that "lift off" the canvas.
- **Overlay Dim (`{colors.overlay-dim}`)** is the dialog backdrop — `#17130E` at ~55% alpha. Dims the canvas so the heavy-bordered dialog reads as the top object.

**Dark mode (required, FR-14):** every token above has a `-dark` pair, validated to hold the same AA floor against the dark surfaces (`{colors.surface-dark}` `#16130D`, `{colors.surface-elevated-dark}` `#201C14`). The same structure carries over — hard borders become `{colors.border-dark}`, ink shadows become `border-dark` shadows, and `{colors.brand-dark}` / `{colors.cite-dark}` brighten so they hold contrast on dark fills. Light-on-dark inverts where needed: yellow `chat-user` keeps **dark** ink text on `accent-yellow-dark`; citation chips use `{colors.cite-ink-dark}` on `{colors.cite-dark}`. Set `color-scheme` on both roots so native controls match.

Avoid: gradients, glassmorphism, pastel fills, more than two loud chromas per screen, and any use of `{colors.cite}` that isn't a citation or link. The same avoids hold in dark mode.

## Typography

Three voices, each with a job:

- **Archivo Black** is the display voice — chunky, heavy, playful. It appears in the brand, empty states, notebook names, and the rare statement moment. Set tight (`1.1`–`1.2`), never cramped, never used for body.
- **Space Grotesk** is the working voice — modern, friendly, highly legible at length. All body copy, chat answers, source titles, and UI labels live here.
- **Space Mono** is the verifier's voice — the "receipt" type. Citations, source metadata (type, size, added time), status labels, and microcopy that reads like evidence. It grounds the promise that everything here is checkable.

Type hierarchy does the structure work: `{typography.display}` for statements, `{typography.title}` for surface headers, `{typography.body}` for reading, `{typography.meta}`/`{typography.citation}` for evidence. Meta and citation sizes render in `{colors.ink-muted}` — darkened to hold AA against both the cream canvas and white panels. All sizes honor fluid scaling down to the 320px viewport; text must remain legible without truncation at every supported size.

**One-line updates (A5):** the `typography` frontmatter block in this file is the *single source of truth* — it feeds `fontFamily`, `fontSize`, `lineHeight`, and `fontWeight` in the Tailwind theme config. To swap a family or rescale, change one token map and the whole app follows; no per-component font overrides are permitted (Tailwind `font-display`, `font-sans`, `font-mono` map from these keys).

## Layout & Spacing

Scale is the 4-based system: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64` px. `{spacing.gutter}` (24px) separates work surfaces; `{spacing.panel-pad}` (20px) pads panel interiors; the smallest steps (`4–8px`) sit between tightly-related elements inside a card.

**Notebook dashboard** is the only notebook-management surface: a grid of `notebook-card` objects on the cream canvas (create card, notebook cards, bulk-select toolbar, per-card expire/delete affordances). **Inside a notebook there is no rail and no side panel** — exactly **three sections, `Sources | Chat | Showcase`, switched via tabs on top** (desktop and mobile). Each section is its own bordered, shadowed object on the canvas — visible structure, explicit edges, no ambiguity about what belongs to what. A "Back to notebooks" affordance returns to the dashboard; switching notebooks happens there, never inside a notebook.

Maximum content width for chat reading is `max-w-2xl` within its column — answers are for reading, not spreadsheeting.

→ Composition references: `mockups/key-workspace.html`, `mockups/key-upload-dialog.html`, `mockups/key-dashboard.html`, `mockups/key-mobile.html`. Spine wins on conflict.

## Elevation & Depth

Elevation is **hard, not ambient**. Depth comes exclusively from solid offset shadows in ink (`4px 4px 0 0` for cards, `8px 8px 0 0` for dialogs) — zero blur, zero spread, no soft glow. Objects don't float, they *stamp*.

**Buttons are the slanted exception (decided 2026-08-06):** interactive buttons are **slightly slanted to the right** — the top edge leans right by `skewX(-6deg)` (a little, always noticeable, never more than ~20°). Their offset shadow is **more slanted than the button** (`skewX(-12deg)`) and displaced **up-right** (`6px -6px 0 0`) — the look of a hard block **illuminated from the bottom-left**. This is a neo-brutalist signature, not a gimmick: cards, dialogs, and chips keep the orthogonal stamp; only buttons lean.

Interaction follows the metaphor: a slanted button on hover deepens its lean slightly (to `skewX(-10deg)`) with the shadow stretched further up-right — the object visibly lifts. On press, the offset collapses to `0` and the lean returns — the object is *pushed down into the surface*. Tonal layering (cream → white) adds a second, quieter depth axis: elevated panels are white on cream. **Motion (landing-page scroll-in, hover lifts) always honors `prefers-reduced-motion`: scroll-based animations degrade to static reveals, hover lifts become a border/underline change.**

**Focus is a rule, not a shadow.** The focus indicator is a `3px` ring in `{colors.focus-ring}` with a `2px` offset in `{colors.surface}`, applied via `:focus-visible` only — never the lift/press shadow, never a glow. On ink and brand fills, the ring **inverts** to `{colors.surface}` (and to `{colors.surface-dark}` in dark mode) so it never vanishes into its own background. Focus must stay legible independently of hover and press states.

## Shapes

Neo-brutalism means **hard corners by default**: `{rounded.DEFAULT}` = `0`, used for every panel, button, card, dialog, and source card. The signature object is a sharp-cornered, thick-bordered, offset-shadowed block. `{rounded.md}` (2px) appears only on the smallest inline elements (citation chips, status pills) so chips don't read as teeth; `{rounded.full}` is reserved exclusively for status dots. No soft, large-radius panels, no pill buttons. The button *lean* is a skew, never a curve.

## Components

- **Primary button** — `{colors.brand}` fill, ink text, `2px` ink border, slanted (`skewX(-6deg)`) with the more-slanted `6px -6px` shadow. The loudest interactive object; appears once per action group. In dark mode: `{colors.brand-dark}` fill, `{colors.brand-ink-dark}` text, `{colors.border-dark}` border + shadow.
- **Secondary button** — white fill, ink text, `2px` ink border, slanted with a `4px -4px` more-slanted shadow. For less-committed actions (cancel, inspect). The **add-source trigger** is a `button-secondary` — no bespoke trigger style.
- **Danger button** — `{colors.error}` fill, white text, slanted like the primary. Reserved for destructive confirmations (delete notebook, remove sources).
- **Citation chip** — the product's signature: `{colors.cite}` fill, white Space Mono text, `1px` ink border, `2px` radius, small, **not slanted**. Rendered inline at the end of the answer sentence it supports. Clicking opens the Showcase section on the cited source; hover reveals the source title. Never decorative, never "prettified" into a superscript footnote.
- **Source card** — white, `2px` ink border, `3px` offset shadow, **not slanted**. Shows icon, title, type + size, added time, and a status dot that carries the ingestion state's color. Status text is always present, never color-only.
- **User message** — `{colors.accent-yellow}` contained block, ink text, `2px` ink border, hard corners, right-aligned. The reader's voice is a contained chip; the system's is open. Dark mode: `{colors.accent-yellow-dark}` fill with **dark** ink text so the pair stays legible.
- **Assistant message** — open, unbordered document-style text on the canvas — "you're reading a document that responds to you." Citations appear inline. No bubble, no avatar, no reply glow.
- **Composer** — white, `2px` ink border, bottom of the Chat section. Focus = `2px` brand border + visible hard focus ring; Enter sends, Shift+Enter newline.
- **Dialog** — white, `3px` ink border, `8px 8px 0 0` shadow — the heaviest object on screen, sitting on the `{colors.overlay-dim}` backdrop. Used for uploads, confirmations, and limit warnings.
- **Showcase** — the Original View section: white, `2px` ink border, renders the live webpage (web source) or the full text with the cited passage highlighted (text source). The first-run tour is a Driver.js overlay with no custom visual spec beyond its default chrome.
- **Notebook card** — dashboard object: white, `2px` ink border, `3px` offset shadow, with title, source count, created/expiry meta, and per-card actions. **Active/open state** is `{colors.brand}` fill with `brand-ink` labels plus a non-color indicator (bold weight and a filled glyph) so the active state is never color-only. There is **no notebook rail** — the dashboard grid is the only place notebooks are listed.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Thick `2px` ink borders + solid offset shadows — structure made visible | Hairlines, soft glows, glassmorphism, floating panels |
| Two loud chromas max per screen, each with a job | Rainbows, gradients, pastel fills, decorative chroma |
| `{colors.cite}` only for citations and links | Using blue for chrome, states, or hover affordances |
| Hard corners everywhere; `2px` only on tiny chips; full-radius only on dots | Pills, large soft radii, rounded cards |
| Buttons slanted right with a more-slanted, up-right shadow (light from bottom-left) | Slanted cards, slanted dialogs, orthogonal button shadows |
| Assistants as open text, users as contained chips | Chat bubbles, avatars, typing-dot drama |
| Color + text label for every state | State communicated by color alone |
| `3px` focus ring + `2px` offset, inverted on ink/brand fills, `:focus-visible` only | Glow, shadow-based focus, or focus that vanishes on dark fills |
| Dark mode everywhere the light theme exists, same AA floor | Dark mode as a skin that breaks contrast or borders |
| `prefers-reduced-motion`: static reveals, no scroll-triggered lift | Motion as decoration that ignores user settings |
| Keep debug overlays zero-impact (see EXPERIENCE.md Developer Contract) | Let debug labels reflow, cover, or restyle components |

`[ASSUMPTION]` — Fonts via free Google Fonts (Archivo Black, Space Grotesk, Space Mono); zero licensing cost. Palette hex values are a first pass to be taste-checked on the first real build; the *roles* (cream canvas / ink frame / brand / cite / chroma discipline) are fixed. The button slant is a signature: cap the lean at ~20° and never apply the lean to non-interactive objects.
