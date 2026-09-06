------
name: contextual
colors:
  light:
    bg: "#F4F4F0"
    surface: "#FFFFFF"
    fg: "#111111"
    muted: "#555555"
    border: "#111111"
    accent: "#FFE500"
    citation: "#00E5FF"
    danger: "#FF3333"
    success: "#00E575"
  dark:
    bg: "#0D0D0D"
    surface: "#18181B"
    fg: "#FFFFFF"
    muted: "#A1A1AA"
    border: "#E4E4E7"
    accent: "#FACC15"
    citation: "#22D3EE"
    danger: "#FF3333"
    success: "#00E575"
typography:
  display: "Space Mono, ui-monospace, Menlo, Consolas, monospace"
  body: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
  mono: "Space Mono, ui-monospace, Menlo, Consolas, monospace"
rounded:
  sm: "2px"
  md: "4px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  Button:
    - "2px ink border, hard offset shadow, uniform elevation flow"
    - "primary bg accent, secondary bg surface, ghost transparent"
    - "standard 4px 4px → hover/focus 6px 6px → pressed translate(4px,4px)"
  CitationPill:
    - "non-slanted, 1.5px ink border, 2px radius"
    - "citation bg, Space Mono 11px bold"
  SourceCard:
    - "2px ink border, 4px solid shadow, type icon"
    - "status states: queued / indexing / ready / failed"
  CreditBadge:
    - "mono pill ⚡ N/10, yellow warning ≤2, red lock at 0"
  ExpirationBanner:
    - "full-width accent banner above workspace"
  RefusalCard:
    - "warning border, live-web fallback with Button"
---

# Contextual — DESIGN.md

Precision-engineered Neo-Brutalism for a high-velocity, personal research workspace. Bold ink borders, solid zero-blur offset shadows, sharp monospaced accents, and electric yellow + cyan highlights on a warm off-white industrial canvas.

## 1. Brand & Style

Contextual is a grounded research tool: you ingest sources (PDF, Web, YouTube, Transcript, Text) and ask questions that return **cited, verifiable answers**. The visual language is high-energy, crisp, tactile, and utilitarian — precision-engineered modern neo-brutalism, not messy or nostalgic. Every element feels stamped and hard-edged, like a technical schematic that has been printed and cut.

- **Reserved accent semantics** keep meaning unambiguous: cyan = citation/verification; yellow = primary action/warning; green = ready/valid; red = destructive/error.
- **"Original View" is the core differentiator** — the UI makes verification tactile: cyan pills in chat, high-contrast bounding-box highlights over the original PDF page or timestamped transcript.

## 2. Colors

Light theme (default):

| Token | Hex | OKLch | Role |
|---|---|---|---|
| `--bg` | `#F4F4F0` | `oklch(0.982 0.003 90)` | Canvas background |
| `--surface` | `#FFFFFF` | `oklch(1 0 0)` | Cards, panes |
| `--fg` | `#111111` | `oklch(0.21 0 0)` | High-contrast text, ink, borders, shadows |
| `--muted` | `#555555` | `oklch(0.44 0 0)` | Secondary text, metadata |
| `--border` | `#111111` | `oklch(0.21 0 0)` | Hard 2px ink borders / offset shadows |
| `--accent` | `#FFE500` | `oklch(0.93 0.17 95)` | Brand yellow: primary CTA, active user bubble |
| `--citation` | `#00E5FF` | `oklch(0.84 0.19 215)` | Citation cyan: pills, PDF highlight, quote anchors |
| `--danger` | `#FF3333` | `oklch(0.65 0.22 27)` | Zero-credit, deletion, errors |
| `--success` | `#00E575` | `oklch(0.82 0.20 155)` | Ingestion ready / valid |

Dark theme:

| Token | Hex | OKLch | Role |
|---|---|---|---|
| `--bg` | `#0D0D0D` | `oklch(0.15 0 0)` | Canvas |
| `--surface` | `#18181B` | `oklch(0.21 0.005 280)` | Cards, panes |
| `--fg` | `#FFFFFF` | `oklch(1 0 0)` | High-contrast text |
| `--muted` | `#A1A1AA` | `oklch(0.68 0.01 285)` | Secondary text |
| `--border` | `#E4E4E7` | `oklch(0.9 0.01 285)` | Ink & borders |
| `--accent` | `#FACC15` | `oklch(0.86 0.17 95)` | Primary CTA |
| `--citation` | `#22D3EE` | `oklch(0.78 0.14 220)` | Citation pills, highlights |

Contrast rules: normal text ≥4.5:1, large text/icons ≥3:1. Hover moves background by ±0.06–0.12 on the OKLch L channel (or shifts border/shadow) — foreground is **never** lowered toward muted. Disabled is the only reduced-contrast state.

## 3. Typography

- **Display / Headings / Badges / Metrics / Code / Tags:** `Space Mono`, weight 700, uppercase for tags.
- **Body / Paragraphs / Chat responses:** `Inter`, weights 400/500/600, generous line-height `1.6`.
- Mono numerics back the technical, data-dense feel; Inter body keeps long-form answers readable.

### Type Scale

| Role | Font | Weight | Size | Notes |
|---|---|---|---|---|
| Display XL | Space Mono | 700 | clamp(2.2rem, 5.4vw, 3.9rem) | Hero headlines |
| Display LG | Space Mono | 700 | clamp(1.5rem, 3vw, 2.1rem) | Section headings |
| Display MD | Space Mono | 700 | 1rem | Card titles |
| Tag | Space Mono | 700 | .68rem, uppercase, letter-spacing .05em | Labels and tags |
| Body | Inter | 400 | .86–.95rem, line-height 1.6 | Paragraphs, chat |
| Body SM | Inter | 400 | .78–.82rem | Captions, metadata |

## 4. Layout & Spacing

Spacing scale: `4px / 8px / 16px / 24px / 40px`. Radii: `sm 2px` / `md 4px`; only the credit badge uses `pill 9999px`.

- **Dashboard:** header + Notebooks grid — 3 cols desktop, 2 tablet, 1 mobile.
- **Workspace (≥1280px):** tri-pane 25% / 45% / 30% — Sources | Grounded Chat | Original View Showcase.
- **Tablet (768–1279px):** 2-col split (Chat 50% + Showcase 50%), Sources in a slide-over drawer.
- **Mobile (320–767px):** single-column with tabs `[Sources] | [Chat] | [Showcase]` (all ≥44px touch targets).

## 5. Elevation & Depth

Zero-blur solid offset shadows. All interactive elements (buttons, cards, controls) follow a unified elevation flow:

| State | Shadow | Transform |
|---|---|---|
| Standard | `4px 4px 0 0` ink | none |
| Hover / Focus | `6px 6px 0 0` ink | `translate(-2px, -2px)` |
| Pressed / Active | `0 0 0 0` | `translate(4px, 4px)` |

## 6. Shapes

Hard 2px ink borders everywhere the default is a card/control. Corner radius 2–4px (sharp, avoiding bubbly radii). Exceptions: the credit badge pill (`9999px`). `prefers-reduced-motion` collapses transforms and swaps hover to a thick bottom border.

## 7. Components

1. **`<Button>`** — 2px ink border, hard offset shadow, uniform elevation flow. Standard: `4px 4px 0 0` shadow. Hover/Focus: `6px 6px 0 0` + `translate(-2px,-2px)`. Pressed: `0 0 0 0` + `translate(4px,4px)`. Variants: primary (accent bg), secondary (surface bg), ghost (transparent). Small size available. Disabled: opacity 0.45, no shadow change.
2. **`<CitationPill>`** — rectangular, `padding 2px 6px`, `1.5px solid` border, 2px radius, citation bg, Space Mono 11px bold. Hover tooltip = source + page/timestamp; click → deep inspect in Showcase.
3. **`<SourceCard>`** — 2px ink border, 4px solid shadow, type icon (PDF/Globe/YouTube/File/Subtitle). Status: `queued` (gray), `indexing` (accent + orbital spin), `ready` (ink + green pulse), `failed` (danger + retry tooltip).
4. **`<CreditBadge>`** — mono pill `⚡ N/10`; yellow warning ≤2; red lock `🔒 0/10` disables composer with upgrade notice.
5. **`<ExpirationBanner>`** — full-width accent band above workspace: auto-deletion notice with timezone.
6. **`<RefusalCard>`** — warning-bordered honesty card + `[Search Web & Answer]` Button (warns "Consumes 1 credit").

## 8. Do's and Don'ts

**Do**
- Do use the hard offset shadow to carry depth; keep borders 2px ink.
- Do reserve citation cyan exclusively for verification affordances.
- Do use Space Mono for headings/badges/metrics and Inter for body.
- Do show ingestion status clearly (queued/indexing/ready/failed).
- Do make every focusable element show a visible `:focus-visible` ring.
- Do keep at most one solid primary CTA per viewport.
- Do use `oklch()` for all color derivations.

**Don't**
- Don't soften the brutalist edges — no drop blurs or bubbly radii (except the credit pill).
- Don't layer gradients over backgrounds or woodgrain textures.
- Don't use emoji as functional icons; use mono glyphs or inline SVG.
- Don't invent metrics — use honest, labeled values/placeholders.
- Don't place light text on light backgrounds or dark on dark.
- Don't fabricate answers — the refusal card must appear when sources don't contain the answer.

## 9. Interaction States

- **Hover:** shadow elevates from 4px to 6px, element translates -2px up-left. Foreground NEVER lowered toward muted.
- **Focus:** `:focus-visible` ring 3px solid citation, 2px offset, 2px radius on every focusable element.
- **Active/Pressed:** shadow collapses to 0, element translates 4px down-right.
- **Disabled:** opacity 0.45, cursor not-allowed. Only state allowed to reduce contrast.

## 10. Product Context

- **Product:** Personal research/note-taking workspace with grounded, cited AI chat answers.
- **Users:** Researchers and students aggregating PDFs, web pages, and transcripts.
- **Core flow:** Ingest sources → ask questions → get cited answers → verify against originals.
- **Credits:** Daily pool of 10; queries and web-search fallbacks consume credits.
- **Auto-deletion:** Notebooks auto-delete at midnight Asia/Kolkata (UTC+05:30).

## 11. Anti-Patterns

These patterns are explicitly rejected by the Contextual design system:

- **Gradient washes:** No purple gradient overlays, gradient backgrounds, or layered color washes. The canvas is flat off-white (light) or near-black (dark).
- **Emoji as icons:** Never use emoji as functional UI icons. Use inline SVG or mono glyphs instead.
- **Soft/bubbly radii:** No border-radius above 4px except the credit badge pill (9999px). No drop-shadow blurs.
- **Generic callout pattern:** Avoid the "colored vertical bar on left + rounded card" callout. Use the 2px ink border + offset shadow pattern instead.
- **Multiple primary CTAs:** Never show more than one solid primary button per viewport. Other actions use ghost, secondary, or text styles.
- **Inter/Roboto/Arial as display:** Space Mono is the only display typeface. Inter is reserved for body text.
- **Fabricated metrics:** Never invent data, metrics, or filler copy. Use honest, labeled placeholders.
- **Light-on-light / dark-on-dark text:** Never place light text on light backgrounds or dark text on dark backgrounds. Maintain ≥4.5:1 contrast for normal text.
- **Hover to muted:** Never change text to --muted on hover. Move background or border/shadow instead.
- **Woodgrain textures / warm beige:** The canvas is industrial off-white (#F4F4F0), not warm or organic.

## 12. Source Files

The complete source prototype is preserved in `source-examples/`:
- `component-library.html` — live component library with all interactive controls
- `mockup-landing.html` — marketing landing page
- `mockup-dashboard.html` — dashboard / notebooks grid
- `mockup-workspace-desktop.html` — desktop tri-pane workspace
- `mockup-workspace-mobile.html` — mobile responsive workspace
