# Page Specifications: chaibookLM

Reference `01-design-tokens.md` for all color/type/motion tokens used below. Nothing here should introduce a new raw value.

---

## 0. Signature Element (App-Wide)

The one recurring motif: a **thin animated gradient border** (`gradient-signature`, 1.5px, slowly rotating conic gradient) used on exactly one "hero" surface per screen — the primary CTA on landing, the "New Notebook" card on dashboard, the active source-preview panel in the workspace. It signals "this is the important/active thing" consistently across the whole app.

---

## 1. Landing Page

- Sticky navbar with glass blur on scroll.
- Hero with headline: "Turn any source into an answer." (Fraunces 500 display-xl).
- Live interactive mini-demo card showing real-time source indexing (yellow → green dot).
- Feature blocks: Alternating image/text with scroll-triggered fade-up.

---

## 2. Signup / Login (Clerk-Managed)

- Auth flows are handled by **Clerk** using `<SignIn />` and `<SignUp />` embedded components.
- Clerk components are re-themed via `appearance` prop to use `primary`, `surface`, `text`, and `border` token classes from the design system (no default Clerk zinc palette).
- Routes: `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]` — catch-all Clerk routes.
- After successful auth, Clerk redirects to `/dashboard` (`NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`).
- `<UserButton />` appears in the navbar for logged-in users (avatar + sign-out dropdown).
- `middleware.ts` protects all routes except `/`, `/sign-in`, `/sign-up`.

---

## 3. Notebooks Dashboard

- Grid layout: 4 columns desktop, responsive.
- Notebook card: Colored swatch / thumbnail, title, metadata (source count, last edited), status summary dots.
- Empty state: Friendly illustration, clear CTA, gradient signature border.

---

## 4. Notebook Workspace (Core 3-Column Interface)

1. **Left Sidebar (`w-72`)**: "Add Source" modal trigger + source list (PDF, YouTube, Text, VTT, Web URL).
   - Status indicators: `warning` yellow pulse while indexing → `success` green pulse settle on completion.
2. **Center Panel (`flex-1`)**: Chat thread with streaming grounded responses and inline clickable citation pills (`[1]`, `[2]`).
3. **Right Panel (`w-96` preview)**: Opens on citation click. Slides in smoothly and displays:
   - PDF viewer scrolled to exact section.
   - YouTube embed seeked to timestamp.
   - Text/VTT with highlighted chunk.
