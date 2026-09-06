# Contextual — Design System & Prototype Plan

> **Status:** Draft for review — edit this file, then hand off to Design mode.
> **Source:** Design handoff prompt package from Sally (UX Designer) for Prajwal, 2026-09-06.

## 1. Intent Summary

Design a complete Neo-Brutalist design system and responsive UI mockups for **Contextual** — a high-velocity, personal research workspace inspired by Google NotebookLM. The product supports multi-modal source ingestion (PDF, Web URL, YouTube, Transcript, Text) and a "Deep Original View" that lets users verify chat answers against their original sources via inline citation pills.

The **primary acquisition flow**: visitor lands on the marketing/landing page → clicks the signup CTA → is routed to **Clerk** auth's own hosted UI → on successful signup/in, lands on **Screen A (Dashboard)**.

The output of the generation step is a set of self-contained HTML files plus a `DESIGN.md` spec:

- `DESIGN.md` — Google Labs-style design spec (YAML frontmatter + canonical sections).
- `mockup-landing.html` — Marketing/landing page (entry point, one primary signup CTA).
- `mockup-dashboard.html` — Dashboard / Notebooks grid.
- `mockup-workspace-desktop.html` — Desktop 3-column workspace (Sources / Chat / Showcase).
- `mockup-workspace-mobile.html` — Mobile 3-tab workspace with citation jump + floating return button.

## 2. Product & Audience

- **Product:** Personal research/note-taking workspace with grounded, cited AI chat answers.
- **Users:** Product evaluators (per plugin input); primary persona is a researcher/student aggregating PDFs, web pages, and transcripts into an answerable corpus.
- **Core job:** "Ask a question across my uploaded sources, get a cited answer, and tap the citation to verify the exact original passage."
- **Credits model:** Daily credit counter (10/day); queries/operations consume credits; web search fallback consumes 1 credit.
- **Auto-deletion:** Notebooks auto-delete at midnight Asia/Kolkata (UTC+05:30); persistent warning banner.

## 3. Visual Direction — "Precision Neo-Brutalism"

High-energy, crisp, tactile, utilitarian. **Not** messy or nostalgic brutalism — precision-engineered: bold ink borders, solid zero-blur offset shadows, sharp monospaced accents, electric yellow/cyan highlights.

### Light Mode Palette
| Token | Hex | Role |
|---|---|---|
| Brand Accent Yellow | `#FFE500` | Primary CTA, active user bubble, warning highlight |
| Citation Cyan | `#00E5FF` | Citation pills `[1]`, PDF bounding-box, quote anchors |
| Deep Ink | `#111111` | Borders, high-contrast text, hard shadows |
| Muted Ink | `#555555` | Secondary text, metadata, subtle borders |
| Crisp Surface | `#FFFFFF` | Cards, panes |
| Canvas BG | `#F4F4F0` | Warm off-white industrial canvas |
| Alert Red | `#FF3333` | Zero-credit, deletion warnings, errors |
| Success Green | `#00E575` | Ingestion ready, valid status |

### Dark Mode Palette
- Dark Canvas `#0D0D0D` · Dark Surface `#18181B` · Dark Border/Ink `#FFFFFF`/`#E4E4E7`
- Brand Dark Yellow `#FACC15` · Citation Cyan Dark `#22D3EE` · Muted Dark `#A1A1AA`

### Typography
- **Display / badges / metrics / code / tags:** `Space Mono`, bold 700, uppercase for tags.
- **Body / paragraphs / chat responses:** `Inter`, 400/500/600, line-height `1.6`.

### Elevation (zero blur)
- Card: `4px 4px 0 0 #111`
- Elevated/focus: `6px 6px 0 0 #111`
- Slanted button: `6px -6px 0 0 #111` + `skewX(-12deg)`
- Pressed: shadow `0 0 0 0`, `translate(4px,4px)`

### Borders & Radii
- `2px solid #111` (white in dark) · radius 2–4px (sharp) · only pill `9999px` is the credit badge.

## 4. Core Components

1. **Slanted Action Button** — `skewX(-6deg)`, 2px ink border, yellow/white bg, solid offset shadow `6px -6px`. Hover: `skewX(-10deg)` + `translate(-2px,2px)`. Active: skew 0, shadow 0. `prefers-reduced-motion`: skew stays 0, hover uses thick bottom border.
2. **Citation Pill** — `padding 2px 6px`, `1.5px solid #111`, radius 2px, cyan bg, Space Mono 11px bold. Hover tooltip = source title + page/timestamp. Click → deep inspect in Showcase.
3. **Source Card** — 2px ink border, 4px shadow, type icon (PDF/Globe/YouTube/File/Subtitle). Status: `queued` (gray), `indexing` (yellow + orbital spin), `ready` (ink + green pulse), `failed` (red + retry tooltip).
4. **Credit Badge** — mono pill `⚡ 8/10`. Yellow warning ≤2. Red locked at 0 (`🔒 0/10`), disabled composer + upgrade notice.
5. **Expiration Banner** — full-width yellow: `⏳ Auto-deletion Notice: This notebook will be auto-deleted tonight at 12:00 AM Asia/Kolkata (UTC+05:30).`
6. **Honest Refusal Card** — warning border: *"The uploaded sources do not specify the requested information."* + `[Search Web & Answer]` slanted button (weighing "Consumes 1 credit").

## 5. Onboarding Flow & Screens

### Acquisition Flow (Landing → Signup → Dashboard)

```
Marketing Landing (mockup-landing.html)
  └─ Signup CTA ──▶ Clerk hosted auth UI (Clerk's own UI, external)
        └─ signup / sign-in success ──▶ Dashboard (Screen A, /dashboard)
```

- **Landing → Clerk:** The landing page's **one primary CTA** (e.g. "Start Free" or "Sign Up") triggers Clerk's hosted sign-in/sign-up page. The CTA target is a Clerk URL (e.g. `https://<app>.clerk.accounts/sign-up` or the configured Clerk route); in the mockup it is a real clickable anchor pointing to the Clerk endpoint.
- **Clerk handles auth UI:** Styling, forms, social/email OTP, and post-signup redirect are entirely Clerk's responsibility — **no custom auth UI in our mockup**. Clerk theme tokens may be mapped to match the neo-brutalist brand if the integration customizes its appearance.
- **Post-auth redirect:** `afterSignUpUrl` / `afterSignInUrl` point to the Dashboard (`/dashboard`). The Dashboard therefore only renders for an authenticated user (brand, credits, notebook data).

### Screen L — Landing / Marketing (`/` , entry point)
Single-primary-CTA marketing page in the neo-brutalist brand. Structure is conversion-focused:
- **Navbar:** brand "CONTEXTUAL", nav links, theme toggle, secondary **"Sign In"** ghost CTA + primary **"Start Free"**.
- **Hero:** sharp value prop ("Ask your sources. Verify every answer."), one-line subcopy, one primary signup CTA, open-source-type credibility line.
- **How it works / features:** 3-step or 3-feature section (ingest → ask → verify) using the source/citation components to demo the product visually.
- **Screens or single CTA band:** product preview (real screenshot-style mock of the tri-pane workspace) + a repeated primary CTA once at the end (allowed on a long scroll page).
- **Footer:** minimal ink rule.
- CTA economy: only **"Start Free"** is solid-primary; all other entries are ghost/text/secondary.

### Screen A — Dashboard (`/dashboard`)
Header (brand "CONTEXTUAL", credit counter, theme toggle, avatar) + Notebooks grid (3/2/1 columns). "Create Notebook" dashed card with slanted `+ New Notebook`. Notebook cards: title, created date, source-count badge, auto-delete countdown, meatball menu (Rename/Delete).

### Screen B — Desktop Tri-Pane (`/notebook/[id]`, ≥1280px)
- **Top bar:** breadcrumb, expiration banner, credit counter, Share (disabled), profile.
- **Pane 1 (25%) — Sources:** `Sources (3/10)` + `+ Add Source`; source list with status badges; "Add Source" modal with 5 tabs (Text | Web URL | PDF Dropzone | Transcript | YouTube URL).
- **Pane 2 (45%) — Chat:** yellow speech-box user prompts; assistant markdown w/ cyan citation pills; honest-refusal card; auto-expanding composer with credit check + slanted Send.
- **Pane 3 (30%) — Original View Showcase:** empty state ("Click any citation pill…"); PDF view (header, `Page 14 of 28`, bounding-box highlight); YouTube/Transcript view (video @ 18:42 + synchronized autoscrolling highlighted transcript).

### Screen C — Responsive
- **Tablet (768–1279):** 2-col split (Chat 50% + Showcase 50%), Sources in slide-over drawer with toggle.
- **Mobile (320–767):** single-column tabs `[Sources (3)] | [Chat] | [Showcase]`. Tapping citation auto-navigates to Showcase. Sticky bottom-center FAB `← Back to Chat` (z-50) returns to exact scroll position.

## 6. Interactions / States / Rules

- Hover: bg ±0.06–0.12 OKLch L or border/shadow shift; foreground never lowered toward muted.
- `:focus-visible` ring on every focusable element.
- Text contrast ≥4.5:1 normal, ≥3:1 large/icons. Disabled is the only reduced-contrast state.
- Buttons: at most one solid primary per viewport; other entries secondary/ghost/text. Avoid duplicate CTAs word-for-word.
- Touch targets ≥44px.
- Mobile redesigns, never squeezes; no horizontal scroll at 360→1920.
- Theme toggle persists (localStorage). No `scrollIntoView`.

## 7. Imagery / Content Notes

- Skill uses **real imagery**; the seed display font is serif. **Conflict to resolve:** this brief mandates Space Mono (display) + Inter (body) — user-provided tokens take precedence over seed defaults.
- This is a UI/systems brief — no named real-world people/places/products. Any decorative imagery should be real photography if used; otherwise pure CSS components suffice. Demo content (source titles, `raft-paper.pdf`, real conversation) must stay honest, not fabricated filler.

## 8. Deliverables & Acceptance Checks

- [ ] `DESIGN.md` — YAML frontmatter (`colors`, `typography`, `rounded`, `spacing`, `components`) + sections in canonical order: Brand & Style, Colors, Typography, Layout & Spacing, Elevation & Depth, Shapes, Components, Do's and Don'ts.
- [ ] `mockup-landing.html` — marketing entry point; navbar + hero + how-it-works + product preview + single primary "Start Free" CTA wired to Clerk signup URL; secondary Sign In as ghost link. Live-craft: one primary CTA per viewport, no fabricated metrics.
- [ ] `mockup-dashboard.html` — responsive grid, create card, credit badge, theme toggle.
- [ ] `mockup-workspace-desktop.html` — 3-pane, add-source modal, active PDF + active YouTube showcase, refusal card.
- [ ] `mockup-workspace-mobile.html` — 3 tabs, citation→Showcase jump, floating return FAB.
- [ ] Clerk handoff documented: CTA targets Clerk hosted auth (`/sign-up`, `afterSignUpUrl` → `/dashboard`); no custom auth UI.
- [ ] All neo-brutalist transforms fully realized (skews, hard shadows, ink borders, cyan pills).
- [ ] Theme toggle (light/dark) with correct token swappage.
- [ ] No fabricated metrics; honest labeled data.

## 9. Decisions (locked from review)

> All open questions resolved by manager review. Clerk integration remains the only item to wire later.

- **Clerk signup URL:** **not hard-coded yet** — "complete except clerk." Landing CTA uses a placeholder target (`/sign-up`) and Clerk wiring is noted separately for later integration.
- **Clerk UI branding:** leave Clerk's default theme untouched — only the post-auth dashboard carries the Contextual brand.
- **Display font:** **Space Mono (display) + Inter (body), locked** — overrides the seed's default serif.
- **Mockup format:** each file is a **standalone responsive page** (not framed at a fixed viewport).
- **Dark mode:** deliver a **working light/dark toggle** in each mockup.
- **Add-source modal:** **fully interactive tab switching** (not a static mock).
- **Landing page:** ships as its own **`mockup-landing.html`** with a custom branded flow (does not reuse the seed's default marketing hero).

## TODO (open)

- [ ] **Clerk wiring (only remaining item):** choose a real Clerk-hosted signup URL and set it as the landing CTA target; configure `afterSignUpUrl`/`afterSignInUrl` → `/dashboard`. Until then the mockup uses `/sign-up`.

## Next step

The plan is **approved** for generation. Handing off to **Design mode** to generate `DESIGN.md` + the four mockup HTML files (landing, dashboard, workspace-desktop, workspace-mobile). Clerk URL wiring stays as a follow-up integration step.
