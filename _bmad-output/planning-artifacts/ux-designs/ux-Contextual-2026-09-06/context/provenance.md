# Provenance — Contextual Design System

> Generated from source project `a3947cf1-6b87-40e6-b9b6-aad9f648958d` (Web Prototype) on 2026-09-06.

## Source Artifacts

| File | Role | Status |
|---|---|---|
| `component-library.html` | Live component library with all interactive controls | Preserved as `source-examples/component-library.html` |
| `mockup-landing.html` | Marketing landing page | Preserved as `source-examples/mockup-landing.html` |
| `mockup-dashboard.html` | Dashboard / Notebooks grid | Preserved as `source-examples/mockup-dashboard.html` |
| `mockup-workspace-desktop.html` | Desktop tri-pane workspace | Preserved as `source-examples/mockup-workspace-desktop.html` |
| `mockup-workspace-mobile.html` | Mobile responsive workspace | Preserved as `source-examples/mockup-workspace-mobile.html` |
| `DESIGN.md` | Source design spec (YAML frontmatter + canonical sections) | Read and extracted into this design system |
| `brand-spec.md` | Brand tokens with OKLch values | Read and used as token authority |
| `prototype-plan.md` | Design plan and decisions | Read for product context |

## Token Provenance

All color, typography, spacing, and radius tokens were extracted directly from `brand-spec.md` OKLch values. No colors were invented. The OKLch values were verified against the source HTML hex values in the mockup CSS `:root` blocks.

## Font Provenance

- **Space Mono** (display/mono): loaded from Google Fonts (`Space+Mono:wght@400;700`)
- **Inter** (body): loaded from Google Fonts (`Inter:wght@400;500;600`)

Both are system-loaded via Google Fonts CDN links found in all source HTML files.

## Design System ID

`user:web-prototype-design-system` (project ID `1f4c638f-f294-412c-9271-45d2c9127820`)
