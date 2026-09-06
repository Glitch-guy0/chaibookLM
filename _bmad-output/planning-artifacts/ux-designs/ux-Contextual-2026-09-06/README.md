# Contextual Design System

> Precision-engineered Neo-Brutalism for a high-velocity, personal research workspace.

## Product overview

**Contextual** is a personal research workspace (Google NotebookLM-inspired) that supports multi-modal source ingestion (PDF, Web, YouTube, Transcript, Text) and cited AI chat answers. This design system extracts every token, component, and layout rule from the source prototype to provide a reusable, agent-friendly package.

### Product context

- **Product:** Contextual — personal research workspace with cited AI answers
- **Design language:** Precision-engineered Neo-Brutalism (bold ink borders, zero-blur offset shadows, uniform elevation flow)
- **Signature element:** Uniform elevation flow on all buttons (standard → hover → pressed)
- **Accent semantics:** Cyan = citation/verification; Yellow = primary CTA; Green = ready; Red = error

## Source and context references

| Reference | Path | Description |
|---|---|---|
| Source project | `a3947cf1-6b87-40e6-b9b6-aad9f648958d` | Original Web Prototype |
| Design system id | `neobrutalism` | Package identifier |
| Provenance | `context/provenance.md` | Token and asset provenance documentation |
| Source context | `context/source-context.md` | Source project metadata and extraction notes |
| Brand spec | `brand-spec.md` | OKLch brand tokens (source authority) |
| Agent skill | `SKILL.md` | Claude-style skill for applying this system |

## Package contents

```
├── DESIGN.md                  # Full design system specification (brand, tokens, components, anti-patterns)
├── README.md                  # This file — Claude Design package guide
├── SKILL.md                   # Agent skill with YAML frontmatter for discovery and invocation
├── colors_and_type.css        # Standalone CSS tokens + typography (paste into any project)
├── brand-spec.md              # OKLch brand tokens (source authority)
├── prototype-plan.md          # Original design plan with component specs (source context)
├── context/
│   ├── source-context.md      # Source project metadata and extraction notes
│   └── provenance.md          # Token and asset provenance documentation
├── preview/                   # Visual preview cards (open in browser)
│   ├── colors-primary.html    # Color swatch cards (light + dark)
│   ├── typography-specimens.html  # Type scale and pairing
│   ├── spacing-tokens.html    # Spacing scale and corner radii
│   ├── shadows.html           # Elevation system (4 levels)
│   ├── components-buttons.html # Live component demos
│   ├── brand.html             # Logo mark, accent semantics, visual language rules
│   └── surfaces.html          # Applied UI surface previews (landing, dashboard, chat, notices)
├── source-examples/           # Preserved original prototype HTML files
│   ├── component-library.html # Full component library page
│   ├── mockup-landing.html    # Landing page mockup
│   ├── mockup-dashboard.html  # Dashboard mockup
│   ├── mockup-workspace-desktop.html  # Desktop workspace mockup
│   └── mockup-workspace-mobile.html   # Mobile workspace mockup
└── ui_kits/
    └── app/
        ├── index.html         # UI kit overview (loads colors_and_type.css)
        ├── README.md          # Applied kit documentation
        ├── neobtn.html        # Button component (uniform elevation flow)
        ├── citation-pill.html # CitationPill component
        ├── source-card.html   # SourceCard component
        ├── credit-badge.html  # CreditBadge component
        ├── banner-refusal.html # Banner & Refusal components
        └── modal.html         # Modal component
```

## Preview card manifest

Open these in a browser to review the design system:

| Preview | What it shows |
|---|---|
| `preview/colors-primary.html` | All 9 color tokens as swatch cards with hex + oklch values |
| `preview/typography-specimens.html` | Space Mono + Inter type scale and pairing |
| `preview/spacing-tokens.html` | 5-step spacing scale and corner radii |
| `preview/shadows.html` | 4 elevation levels (card, elevated, standard, pressed) |
| `preview/components-buttons.html` | Button, CitationPill, badges, CreditBadge, SourceCard, Banner, RefusalCard |
| `preview/brand.html` | Logo mark, accent semantics, visual language rules |
| `preview/surfaces.html` | Miniaturized real screens (landing nav, dashboard card, chat, showcase, notices) |

## Preserved source examples

The `source-examples/` directory contains byte-for-byte copies of the original Contextual prototype HTML files. These are preserved as source context for agents and designers to reference the full-page implementations from which this design system was extracted.

| File | Screen type |
|---|---|
| `source-examples/component-library.html` | Full component library with all patterns |
| `source-examples/mockup-landing.html` | Marketing landing page |
| `source-examples/mockup-dashboard.html` | Dashboard with notebook grid |
| `source-examples/mockup-workspace-desktop.html` | Desktop workspace (split pane: sources + chat) |
| `source-examples/mockup-workspace-mobile.html` | Mobile workspace (stacked layout) |

## UI kit

The `ui_kits/app/` directory contains standalone component reference pages. Each file is a self-contained HTML page that demonstrates one component with live interactive controls, usage specification, and dark mode support. All component files load `colors_and_type.css` for token consistency.

See `ui_kits/app/README.md` for the full component manifest, usage workflow, and design notes.

## Reuse workflow

### Starting a new project

1. **Copy tokens** — paste the contents of `colors_and_type.css` into the first `<style>` block of your HTML file.
2. **Link Google Fonts** — add `Space+Mono:wght@400;700` and `Inter:wght@400;500;600` via the Google Fonts CDN.
3. **Follow `DESIGN.md`** — consult the full specification for component specs, layout rules, elevation system, and do's/don'ts.

### Building components

1. **Open `ui_kits/app/`** — browse standalone component pages for live demos and copy-paste CSS class patterns.
2. **Reference `preview/`** — check preview cards for visual examples of each token and component at a glance.
3. **Use the agent skill** — load `SKILL.md` to instruct agents to apply this system consistently across files.

### Reviewing existing code

1. **Audit against `DESIGN.md`** — verify tokens, typography, elevation, and component patterns match the spec.
2. **Compare with `source-examples/`** — check full-page implementations for reference.
3. **Run the package audit** — use `design-system-package-audit` to validate package integrity.

### Agent invocation

Load `SKILL.md` in any agent context to receive the full design system instructions. The skill includes YAML frontmatter (`name`, `description`, `user-invocable`) for automatic discovery and invocation by future agents.
