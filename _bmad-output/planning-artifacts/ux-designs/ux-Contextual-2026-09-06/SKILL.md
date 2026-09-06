---
name: contextual-neobrutalism
version: 1.0.0
description: >-
  Precision-engineered neo-brutalist design system for the Contextual research
  workspace. Covers tokens, typography, elevation, components, and anti-patterns.
user-invocable: true
triggers:
  - contextual
  - neobrutalism
  - neo-brutalism
  - research workspace
  - cited answers
---

# Contextual Design System — Agent Skill

Use this skill when building UI that follows the Contextual neo-brutalist visual language.

## What is inside

| Path | Purpose |
|---|---|
| `colors_and_type.css` | Complete token set (light + dark) with hex fallbacks, typography stacks, spacing scale, radii, elevation shadows, reset, and focus styles |
| `DESIGN.md` | Full design system specification: brand, colors, typography, layout, elevation, shapes, components, anti-patterns, interaction states, product context |
| `preview/` | Focused preview cards for colors, typography, spacing, shadows, components, brand, and applied UI surfaces |
| `ui_kits/app/` | Applied interface kit with standalone component reference pages (Button, CitationPill, SourceCard, CreditBadge, Banner/Refusal, Modal) |
| `source-examples/` | Preserved original prototype HTML files (landing, dashboard, workspace desktop, workspace mobile, component library) |
| `context/provenance.md` | Token and asset provenance documentation |

## Source context

- **Source project:** `a3947cf1-6b87-40e6-b9b6-aad9f648958d` (Web Prototype)
- **Design system id:** `neobrutalism`
- **Product:** Contextual — personal research workspace with cited AI chat answers
- **Design language:** Precision-engineered Neo-Brutalism (bold ink borders, zero-blur offset shadows, uniform elevation flow)

## When to use this skill

- Building new UI screens for the Contextual product
- Creating components that follow the neo-brutalist visual language
- Designing dashboards, workspaces, or marketing pages in this style
- Reviewing or auditing code against the Contextual design system
- Any task that requires consistent application of these tokens and patterns

## How to use

1. **Copy tokens** — paste `colors_and_type.css` contents into the first `<style>` block of any new HTML project.
2. **Link Google Fonts** — add `Space+Mono:wght@400;700` and `Inter:wght@400;500;600` via Google Fonts CDN.
3. **Follow `DESIGN.md`** for component specs, layout rules, and do's/don'ts.
4. **Reference `preview/`** cards for visual examples of each token and component.
5. **Use `ui_kits/app/`** component files as standalone reference pages for individual controls.
6. **Browse `source-examples/`** for full-page implementations of each screen type.

## Design system highlights

### Tokens (use exactly, never invent)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#F4F4F0` (light) / `#0D0D0D` (dark) | Page background |
| `--accent` | `#FFE500` | Primary CTAs only |
| `--citation` | `#00E5FF` | Verification affordances only |
| `--border` | `#111111` | 2px ink borders, zero-blur offset shadows |
| `--surface` | `#FFFFFF` (light) / `#1A1A1A` (dark) | Card and panel backgrounds |
| `--fg` | `#111111` (light) / `#F4F4F0` (dark) | Primary text |

### Components

- **Button** — 2px ink border, uniform elevation flow (standard 4px→hover 6px→pressed translate), accent bg for primary variant
- **CitationPill** — cyan bg, 1.5px border, Space Mono 11px bold, click opens Original View
- **SourceCard** — 4 status states (queued/indexing/ready/failed) with color-coded dots
- **CreditBadge** — pill shape, yellow warning ≤2, red locked at 0
- **Banner/Refusal** — full-width accent expiration banner; honest refusal card with web-search fallback
- **Modal** — add-source modal with 5-tab switching (Text/Web/PDF/Transcript/YouTube)

### Elevation flow (all buttons)

Every button follows the same transition:

1. **Standard:** `4px 4px 0 0` shadow, no transform
2. **Hover/Focus:** `6px 6px 0 0` shadow, `translate(-2px, -2px)`
3. **Pressed/Active:** `0 0 0 0` shadow, `translate(4px, 4px)`
4. **Disabled:** opacity 0.45, no shadow change, no transform

### Rules

- At most one solid primary CTA per viewport
- Citation cyan only on verification affordances
- Space Mono for headings and component labels, Inter for body text
- Never use emoji as functional icons
- Hover never lowers foreground toward muted
- Never use `skewX` or slanted buttons — all buttons are rectangular
