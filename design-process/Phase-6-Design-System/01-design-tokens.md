# Design Tokens: chaibookLM

Read this first. Every component assumes these tokens exist and are wired up exactly as described here.

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

### The Palette

Anchored at **38° (warm gold/champagne)**, paired with cool **256° periwinkle** for signature gradient and **340° dusty rose** for tertiary accents.

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

---

## 2. Typography

| Role | Typeface | Use |
|---|---|---|
| **Display** | **Fraunces** | Headings, hero display |
| **Body/UI** | **Inter** | Default UI, body, chat responses |
| **Mono** | **JetBrains Mono** | Citations, source snippets, file badges |

---

## 3. Motion & Spacing

- `rounded-lg` (12px), `rounded-2xl` (20px), `rounded-full`
- Glassmorphism backdrop blur on navbar, side panels, and modals.
