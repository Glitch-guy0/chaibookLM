# chaibookLM — Design System Reference

Condensed from `_bmad-output/planning-artifacts/ux-designs/ux-chaibookLM-2026-08-05/{DESIGN,EXPERIENCE}.md` and the UX-DR requirements in `epics.md`. The tokens themselves live in `app/globals.css` (source of truth) — this doc is the *intent* behind them, for consistent styling on new components.

## Visual language

**Neo-brutalist, zero-noise.** Thick 2px hard borders in ink, solid offset shadows (zero blur/spread: 4px 4px cards, 8px 8px dialogs, 6px -6px primary buttons), hard corners (radius 0), saturated palette, no gradients/glassmorphism/pastels. Max two loud chromas per screen. "Lots of personality, zero noise."

**Slanted buttons only.** Interactive buttons lean right via `skewX(-6deg)` with a more-slanted offset shadow (`skewX(-12deg)`, `6px -6px 0 0`, lit from bottom-left). Hover deepens to `skewX(-10deg)`; press collapses the offset to 0. Cards, dialogs, and chips stay orthogonal — only buttons slant. Under Reduced Motion, hover lifts become a border/underline change instead.

## Typography — three voices

| Font | Role |
|------|------|
| Archivo Black (display) | Brand, empty states, notebook names, statement moments. Tight 1.1–1.2 line-height. Never for body text. |
| Space Grotesk (working) | Body, chat answers, source titles, UI labels. |
| Space Mono (verifier/"receipt") | Citations, metadata, status labels. |

`typography` frontmatter in the original DESIGN.md is the single source of truth feeding Tailwind's `font-display`/`font-sans`/`font-mono`. Fluid scaling down to 320px without truncation.

## Focus rule

3px ring in `{colors.focus-ring}` + 2px offset in `{colors.surface}`, via `:focus-visible` only. Inverted to surface color on ink/brand fills (and to dark surface in dark mode). Never shadow-based, never a glow.

## Dark mode

Every token has a validated `-dark` pair holding the same AA floor against `surface-dark` (#16130D) and `surface-elevated-dark` (#201C14). Class strategy: `dark` class on `<html>`, set from `prefers-color-scheme`, overridable via a consented cookie. `color-scheme` set on both roots. Light-on-dark inversions preserved (e.g. the yellow user chat chip keeps dark ink text in both themes).

**Known open contrast gaps** (deferred by design, tracked in [deferred-work.md](deferred-work.md)): `--color-ink-muted-dark` on `--color-surface-dark` computes 3.90:1 (below 4.5:1 floor); `--color-ink-dark` on `--color-brand-dark` computes 2.11:1 (below 4.5:1 floor, affects the active-notebook chip and `NotebookCard`'s selected state). Fixing either requires a token hex change — a design decision, not a code fix.

## Component patterns

- **Citation chip** — blue (`{colors.cite}`) fill, white Space Mono text, 1px border, 2px radius, **not** slanted, rendered inline at the end of the sentence it supports. Hover/tooltip reveals the source title. Keyboard-focusable, Enter opens. Known gap: renders at 20×20px, below the 24/44px touch-target floors.
- **Source card** — status dot + label always present; color is never the only channel.
- **User message** — contained yellow block, right-aligned.
- **Assistant message** — open, unbordered document text (react-markdown).
- **Composer** — Enter sends, Shift+Enter newline, auto-grows, disabled while generating.
- **Dialog** — heaviest object: 3px border + 8px 8px shadow, dimmed overlay backdrop. Focus trap, initial focus inside, returns to trigger on close. Modal stacks one level deep only.
- **Notebook card** — active/open state is brand fill + bold weight + filled glyph (never color-only signal).
- **Indexing-state motion** — while `queued → processing`, the card body stays static and its offset shadow orbits 360° around the card center (wider radius than the resting 3px). On `ready`, the shadow snaps back and the card glows `{colors.success}` for 1s then fades. This glow is the only sanctioned glow. Reduced-motion: rotation skipped, completion is a flat color change.

## Layout / IA

- Notebook workspace: exactly three sections — **Sources | Chat | Showcase** — switched via tabs on top at every breakpoint, real tablist semantics (`role="tablist"`/`tab`, `aria-selected`, arrow-key nav). No notebook rail, no side panel.
- Dashboard is the only notebook-management surface (create/open/rename/delete/bulk-delete).
- Chat reading width capped at `max-w-2xl`.
- Breakpoints: ≥1024px tabbed panels + 3-card dashboard grid; 768–1023px sections stack/scroll + 2-card grid; ≤767px single stacked surface, Showcase opens full-screen from a citation tap with a labeled ≥44px back button + Esc-to-close. Minimum supported viewport: 320px.

## Accessibility floor

Every interactive element labeled with role + state. Ingestion status announces via `aria-live` only on transitions to `ready`/`failed` (never intermediate states). Streaming answers render inside a stable `aria-live="polite"` region (never assertive). Status dots ≥3:1 contrast; meta/citation ink-muted text ≥4.5:1; active-notebook brand-ink-on-brand ≥4.5:1 (re-verify per theme — see the dark-mode gaps above). `prefers-color-scheme`, `prefers-reduced-motion`, `forced-colors` all auto-detected and honored. Transitions ≤150ms, skipped under Reduced Motion.

## Developer contract

Every component instance carries a unique, stable debug name (e.g. `source-card-2`, `citation-chip-3`, `tab-chat`, `composer`). In dev/`UX_DEBUG` mode, a zero-impact overlay label renders it (absolute, pointer-events none, no layout space); production strips it at build time.

Full original design docs (token frontmatter, flows, mockups) remain archived under `_bmad-output/planning-artifacts/ux-designs/`.
