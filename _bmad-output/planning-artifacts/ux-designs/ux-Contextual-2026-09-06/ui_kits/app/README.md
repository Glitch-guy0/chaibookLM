# Contextual UI Kit — Applied Interface Kit

Component files extracted from the Contextual source prototype. Each file is a standalone reference page for one component or pattern, using the design system tokens from `colors_and_type.css`. This kit is designed for agents and designers who need to reuse or adapt individual components.

## Kit structure

```
ui_kits/app/
├── index.html            # Kit overview — links to all component pages
├── README.md             # This file
├── neobtn.html           # Button component page
├── citation-pill.html    # CitationPill component page
├── source-card.html      # SourceCard component page
├── credit-badge.html     # CreditBadge component page
├── banner-refusal.html   # Banner & Refusal component page
└── modal.html            # Modal component page
```

All component HTML files load `../../colors_and_type.css` for token consistency and include inline `<style>` blocks for component-specific CSS. Each page is self-contained and can be opened directly in a browser.

## Component files

| File | Component | What it covers |
|---|---|---|
| `index.html` | Overview | UI kit landing page with links to all components. Loads `colors_and_type.css` for token consistency. |
| `neobtn.html` | Button | Action button with uniform elevation flow, offset shadow, hover/active states, variants (primary/ghost/small/disabled) |
| `citation-pill.html` | CitationPill | Inline citation marker with cyan background, 1.5px ink border, hover shadow |
| `source-card.html` | SourceCard | Ingestion source item with type icon and four status states (queued/indexing/ready/failed) |
| `credit-badge.html` | CreditBadge | Daily credit counter with pill shape, warning (≤2), and locked (0) states |
| `banner-refusal.html` | Banner & Refusal | Expiration banner (full-width accent) and honest refusal card with web-search fallback |
| `modal.html` | Modal | Add-source modal with 5-tab switching (Text/Web/PDF/Transcript/YouTube), form controls, dropzone |

## Usage workflow

1. **Open `index.html`** to see all components listed on the kit landing page.
2. **Click any component card** to navigate to its standalone demo page.
3. **Each demo includes:**
   - Live interactive controls (click, hover, disabled states)
   - Usage specification with CSS class names and markup patterns
   - Dark mode support (toggle via `prefers-color-scheme`)
4. **Copy the CSS class patterns** into your project — all tokens come from `colors_and_type.css`.

### Adapting for a new project

1. Copy the relevant CSS class from the component page's `<style>` block.
2. Ensure `colors_and_type.css` tokens are available (paste or link).
3. Adjust spacing or sizing if needed — component-specific CSS uses the design token scale.

## Design notes

- All components use the neo-brutalist token set: **2px ink borders**, **zero-blur offset shadows**, **sharp 2–4px radii**.
- All buttons follow the same elevation flow: standard `4px 4px 0 0` → hover `6px 6px 0 0` + `translate(-2px,-2px)` → pressed `0 0 0 0` + `translate(4px,4px)`.
- **Citation cyan** (`--citation: #00E5FF`) is reserved exclusively for verification affordances (citation pills, verification badges).
- **Space Mono** is used for all component labels and headings; **Inter** for body text within components.
- Never use `skewX` or slanted buttons — all buttons are rectangular.
- At most one solid primary CTA (`--accent` bg) per viewport.

## Source basis

Extracted from the Contextual source prototype project (`a3947cf1-6b87-40e6-b9b6-aad9f648958d`). See `source-examples/` in the package root for the original full-page implementations (landing, dashboard, workspace desktop, workspace mobile, component library).

### Design system reference

- **Tokens:** `colors_and_type.css` (canonical definitions)
- **Full spec:** `DESIGN.md` (brand, layout, elevation, shapes, anti-patterns, interaction states)
- **Agent skill:** `SKILL.md` (YAML frontmatter, invocation triggers, reuse instructions)
