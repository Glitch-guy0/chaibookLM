# Design Tokens

Read this first. Every other spec file assumes these tokens exist and are wired up exactly as described here.

---

## 1. Color System — Single Source of Truth

**The rule: nobody ever writes a hex code in a component.** Every color used anywhere in the app is one of a small set of Tailwind classes (`bg-primary`, `text-primary-shade`, `border-secondary-tint`, etc). Those classes resolve to CSS custom properties. The custom properties are the *only* place color values live.

### How it works

Each color role (`primary`, `secondary`, `accent`, `bg`, `surface`, `text`, `success`, `warning`, `error`) is defined as **one HSL triplet** in `globals.css`:

```css
--primary-h: 38;
--primary-s: 55%;
--primary-l: 62%;
```

Tailwind then exposes `tint` (+20% lightness) and `shade` (−20% lightness) variants of that *same* color using `calc()` — computed live in the browser, never precomputed, never duplicated:

```css
/* tailwind.config.ts */
primary: {
  tint:    'hsl(var(--primary-h) var(--primary-s) calc(var(--primary-l) + 20%))',
  DEFAULT: 'hsl(var(--primary-h) var(--primary-s) var(--primary-l))',
  shade:   'hsl(var(--primary-h) var(--primary-s) calc(var(--primary-l) - 20%))',
}
```

**To change a brand color app-wide:** edit the 3 numbers (`h`, `s`, `l`) once in `globals.css`. Every tint, shade, hover state, gradient, and dark-mode variant that derives from it updates automatically. This is the single lever.

**To change light vs dark mode:** the same variable names are redefined inside `.dark { }`. Components never branch on mode — `bg-primary` just resolves differently depending on which scope it's in.

Full implementation is in `tokens/globals.css` and `tokens/tailwind.config.ts`.

### The palette (pastel, warm-but-not-orange, calibrated for both modes)

We anchored the brand hue at **38° (warm gold/champagne)** — warm enough to feel human and inviting (this is a *notebook*, not a spreadsheet), but shifted away from the 10–30° band where orange/red/terracotta live, so it never reads as alert-colored or like a generic "AI orange" default. It's paired with a cool **256° periwinkle** for the signature gradient (warm + cool is what gives the NotebookLM-style hero its depth) and a quiet **340° dusty rose** as a tertiary accent for tags/highlights, kept pastel enough that it doesn't compete with true error-red.

| Role | Light mode HSL | Dark mode HSL | Used for |
|---|---|---|---|
| `primary` (gold) | `38 55% 62%` | `40 60% 68%` | Primary buttons, active states, brand marks |
| `secondary` (periwinkle) | `256 45% 78%` | `256 50% 75%` | Gradient partner, secondary buttons, links |
| `accent` (dusty rose) | `340 40% 80%` | `340 45% 75%` | Tags, highlights, indexed-source glow |
| `bg` (canvas) | `35 30% 97%` | `30 14% 9%` | Page background |
| `surface` (cards/panels) | `35 20% 99%` | `30 12% 14%` | Cards, modals, sidebar, input fields |
| `text` | `30 20% 15%` | `35 15% 92%` | Primary text |
| `text-muted` | `30 10% 42%` | `30 8% 62%` | Secondary text, captions |
| `success` | `150 40% 50%` | `150 40% 60%` | Indexed (green dot), success toasts |
| `warning` | `45 75% 58%` | `45 70% 62%` | Indexing (yellow dot), pending states |
| `error` | `355 55% 60%` | `355 50% 65%` | Destructive actions, failed indexing |

> Note: `warning` sits at 45° and `primary` at 38° — close enough to feel part of one warm family, distinct enough (saturation + role) that a yellow "indexing" dot never gets mistaken for a primary button. `error` is the one deliberately-red value in the system, kept desaturated (55%) so it stays pastel rather than alarming.

### Signature gradient
`bg-gradient-to-br from-primary via-primary/60 to-secondary` — this warm→cool diagonal is the app's one recurring visual signature. Use it exactly once per screen (hero background, or the active-notebook card border), never as decoration on every card — see restraint note in section 5.

---

## 2. Typography

Two-role system, set at build time via `next/font`:

| Role | Typeface | Why |
|---|---|---|
| **Display** (headings, hero) | **Fraunces** (variable, optical size enabled) | A warm, slightly editorial serif with soft ink-trap curves — it echoes the "notebook" metaphor (handwriting a thought down) without going twee, and it's distinctive against the sea of Inter/Söhne headlines on most AI products. |
| **Body/UI** | **Inter** | Neutral, extremely legible at small sizes for dense UI (source lists, chat text), variable weight so we don't load multiple font files. |
| **Mono** (citations, timestamps, VTT snippets) | **JetBrains Mono** | Used sparingly for anything that represents raw source data — timestamps, file types, transcript excerpts — to visually separate "what the source said" from "what the app says." |

### Type scale (Tailwind `fontSize` extension)

| Token | Size / Line height | Weight | Use |
|---|---|---|---|
| `text-display-xl` | 64px / 1.05 | Fraunces 500 | Landing hero headline |
| `text-display-lg` | 44px / 1.1 | Fraunces 500 | Section headers, empty-state headlines |
| `text-display-md` | 28px / 1.2 | Fraunces 500 | Notebook title, modal titles |
| `text-body-lg` | 18px / 1.5 | Inter 400 | Landing subhead, chat responses |
| `text-body` | 15px / 1.5 | Inter 400 | Default UI text |
| `text-body-sm` | 13px / 1.4 | Inter 400 | Captions, timestamps, metadata |
| `text-mono-sm` | 12px / 1.4 | JetBrains Mono 400 | Source snippets, file badges |

---

## 3. Spacing, Radius, Elevation

- **Spacing scale:** Tailwind default (4px base unit) — no custom scale needed, keep it predictable for the agent.
- **Radius:**
  - `rounded-lg` (12px) — buttons, inputs, small cards
  - `rounded-2xl` (20px) — panels, modals, notebook cards
  - `rounded-full` — avatars, status dots, pills
- **Elevation (glassmorphism, used sparingly — see section 5):**
  ```css
  --glass-bg: hsl(var(--surface-h) var(--surface-s) var(--surface-l) / 0.6);
  --glass-border: hsl(0 0% 100% / 0.12);
  backdrop-filter: blur(20px);
  ```
  Applied only to: the top nav bar on scroll, the source-preview side panel, and modals. Not applied to ordinary cards — glass on everything reads as noise, not polish.

---

## 4. Motion Tokens

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default for anything entering the screen |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Panel slides, tab switches |
| `duration-fast` | 120ms | Hover, press, focus rings |
| `duration-base` | 220ms | Modal/panel open-close, dropdowns |
| `duration-slow` | 400ms | Page-level transitions, hero load-in |
| `--pulse-indexing` | 1.6s ease-in-out infinite | The yellow "indexing" dot (see spec 3) |

All motion respects `prefers-reduced-motion: reduce` — wrap non-essential transitions (hero parallax, hover lifts) in `@media (prefers-reduced-motion: no-preference)`, keep functional feedback (button press, loading state) always on but instant.

---

## 5. Restraint rule (read before building anything)

Spend the gradient + glass treatment in **one place per screen** — the hero on landing, the empty-state on dashboard, the active-panel border in the notebook workspace. Everywhere else: flat `surface` cards, `text-muted` for secondary content, and let the warm/cool palette do the work through small accents (a status dot, a tag, a button) rather than backgrounds. This is what keeps "bold & modern" from tipping into "generic AI gradient soup."
