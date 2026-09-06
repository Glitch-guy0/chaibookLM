# Contextual — Brand Spec

> Source: design handoff prompt package (Sally → Prajwal), 2026-09-06. User-provided tokens take precedence over any design-system defaults.

## Summary

Precision-engineered Neo-Brutalism: bold ink borders, solid zero-blur offset shadows, sharp monospaced accents, and electric yellow + cyan highlights on a warm off-white industrial canvas.

## Light Mode Tokens (OKLch)

| Role | Hex | OKLch | Usage |
|---|---|---|---|
| `--bg` | `#F4F4F0` | `oklch(0.982 0.003 90)` | Canvas background, warm off-white |
| `--surface` | `#FFFFFF` | `oklch(1 0 0)` | Cards, panes |
| `--fg` | `#111111` | `oklch(0.21 0 0)` | Deep ink: borders, high-contrast text, shadows |
| `--muted` | `#555555` | `oklch(0.44 0 0)` | Secondary text, metadata, subtle borders |
| `--border` | `#111111` | `oklch(0.21 0 0)` | Hard 2px ink borders / shadows |
| `--accent` | `#FFE500` | `oklch(0.93 0.17 95)` | Brand yellow: primary CTA, active user bubble |
| `--citation` | `#00E5FF` | `oklch(0.84 0.19 215)` | Citation cyan: pills, bounding-box highlights |
| `--danger` | `#FF3333` | `oklch(0.65 0.22 27)` | Zero-credit, deletion, errors |
| `--success` | `#00E575` | `oklch(0.82 0.20 155)` | Ingestion ready / valid |

## Dark Mode Tokens (OKLch)

| Role | Hex | OKLch |
|---|---|---|
| `--bg` | `#0D0D0D` | `oklch(0.15 0 0)` |
| `--surface` | `#18181B` | `oklch(0.21 0.005 280)` |
| `--fg` | `#FFFFFF` | `oklch(1 0 0)` |
| `--muted` | `#A1A1AA` | `oklch(0.68 0.01 285)` |
| `--border` | `#E4E4E7` | `oklch(0.9 0.01 285)` |
| `--accent` | `#FACC15` | `oklch(0.86 0.17 95)` |
| `--citation` | `#22D3EE` | `oklch(0.78 0.14 220)` |
| `--danger` | `#FF3333` | `oklch(0.65 0.22 27)` |
| `--success` | `#00E575` | `oklch(0.82 0.20 155)` |

## Fonts

- **Display / headings / badges / metrics / code / tags:** `"Space Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` — weight 700, uppercase for tags.
- **Body / paragraphs / chat responses:** `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` — weights 400/500/600, line-height 1.6.

## Observed Rules (Visual Language)

1. **Zero-blur offset shadows** carry depth: card `4px 4px 0 0` ink; elevated/focus `6px 6px 0 0`; pressed collapses to `0 0 0 0` + `translate(4px,4px)`.
2. **Hard 2px ink borders + sharp 2–4px radii**; the only fully-round (`9999px`) element is the credit badge pill.
3. **Uniform button elevation** — all buttons follow the same flow: standard `4px 4px 0 0`, hover `6px 6px 0 0` + `translate(-2px,-2px)`, pressed `0 0 0 0` + `translate(4px,4px)`; `prefers-reduced-motion` keeps transforms at 0 and uses a thick bottom border.
4. **Reserved accent semantics:** citation cyan appears only on citation pills / PDF highlight boxes / quote anchors; brand yellow on primary CTAs, active user bubbles, and warnings.
5. **Monospaced uppercase labels + Inter body** create the sharp, technical, utilitarian voice; status is always shown via color-coded source badges (queued/indexing/ready/failed).
