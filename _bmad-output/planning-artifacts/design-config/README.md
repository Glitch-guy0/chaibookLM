# Design System — Implementation Package

Give these files to the coding agent in this order:

1. **`01-design-tokens.md`** — the color system (single source of truth + how to change it), typography, spacing, radius, elevation, and motion tokens. Read this before writing any component.
2. **`tokens/globals.css`** — the actual CSS custom properties for light/dark mode, drop into `app/globals.css`.
3. **`tokens/tailwind.config.ts`** — Tailwind config wiring those variables into utility classes (`bg-primary`, `text-primary-shade`, `bg-primary-tint`, etc), with automatic ±20% lightness via `calc()`. Drop into project root.
4. **`02-page-specs.md`** — page-by-page layout, component anatomy, states, and micro-interactions for: Landing, Signup/Login, Notebooks Dashboard, and the Notebook Workspace (source sidebar + chat + preview panel, per your wireframes).

## The one thing to enforce in code review
No component should ever contain a raw hex/rgb/hsl value. If a new color is needed, it gets added as a new `--role-h/s/l` triplet in `globals.css` and wired into `tailwind.config.ts` via `colorRole('role')` — never inlined. This is what makes the whole palette (light + dark, all tints/shades) editable from one place.

## Stack assumed
Next.js (App Router) + Tailwind CSS + shadcn/ui. Fonts loaded via `next/font`: Fraunces (display), Inter (body/UI), JetBrains Mono (source snippets/citations). shadcn components should be re-themed to consume the token classes above rather than their default palette — no shadcn component should ship with its default zinc/slate colors.
