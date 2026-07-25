# Page Specifications

Reference `01-design-tokens.md` for all color/type/motion tokens used below. Nothing here should introduce a new raw value — if a spec needs a color not listed in the token table, add it as a new role in `globals.css`, don't inline it.

---

## 0. Signature element (app-wide)

The one recurring motif: a **thin animated gradient border** (`gradient-signature`, 1.5px, slowly rotating conic gradient) used on exactly one "hero" surface per screen — the primary CTA on landing, the "New Notebook" card on dashboard, the active source-preview panel in the workspace. It signals "this is the important/active thing" consistently across the whole app, and it's the one place motion + gradient + glass ever combine. Everywhere else stays flat and quiet.

---

## 1. Landing Page

**Job of the page:** convert a visitor who has a document/video/webpage and a question into a signup, in one scroll.

### Layout (desktop, ASCII)
```
┌────────────────────────────────────────────────────┐
│  Logo            Product  Pricing  Docs   [Sign in] │ ← sticky, glass on scroll
├────────────────────────────────────────────────────┤
│                                                      │
│   Turn any source into                              │
│   an answer.  ← display-xl, Fraunces               │
│   Upload a PDF, paste a link, drop a transcript —   │
│   ask it anything.                                  │
│                                                      │
│   [ Try it free → ]   [ Watch 60s demo ]            │
│                                                      │
│   ┌──────────────────────────────────┐              │
│   │  live interactive demo (see below) │  ← signature│
│   └──────────────────────────────────┘              │
├────────────────────────────────────────────────────┤
│  "Works with what you already have"                 │
│  [PDF] [YouTube] [Web] [Text] [VTT]  ← icon row      │
├────────────────────────────────────────────────────┤
│  Three feature blocks, alternating image/text        │
│  1. Add any source                                   │
│  2. Watch it index in real time (yellow→green dot)   │
│  3. Ask, get cited answers, jump to the source        │
├────────────────────────────────────────────────────┤
│  Quiet CTA band + footer                              │
└────────────────────────────────────────────────────┘
```

### Hero detail
- Background: `bg` flat, **not** full-bleed gradient — the gradient lives *inside* the demo card only, per the restraint rule.
- Headline: `text-display-xl`, Fraunces 500, `text-text`. Line-break the headline manually at the phrase boundary shown — don't let it wrap arbitrarily.
- The hero's centerpiece is a **live interactive mini-demo**, not a static screenshot: a small card showing the source-add grid (PDF/YT/Text/VTT/Web from the wireframe) where hovering a source type triggers a quick preview animation of it "indexing" (yellow dot → pulses → green dot, ~1.5s loop). This is the single most characteristic interaction in the product, so it *is* the hero — more honest than a generic stat block.
- CTA buttons: primary = solid `bg-primary` pill, `shadow-glow` on hover. Secondary = ghost with `border-border`.

### Feature blocks
- Alternating left/right layout, generous vertical rhythm (128px between blocks).
- Each block's visual is a simplified, static illustration of that step (not a full app screenshot) — keeps the page feeling designed rather than like a feature-tour screenshot dump.

### Micro-interactions
| Element | Interaction |
|---|---|
| Nav bar | Transparent at top; on scroll past 40px, animates to `glass` background + `shadow-sm` over `duration-base` |
| Hero demo card | Source-type buttons: on hover, icon lifts 2px (`translateY(-2px)`) and the status dot begins its indexing-pulse loop; on mouse-leave, resets after completing current cycle (never cuts mid-pulse) |
| Primary CTA | `scale(1.02)` + `shadow-glow` on hover, `scale(0.98)` on press, `duration-fast` |
| Feature blocks | Scroll-triggered `fade-up` (IntersectionObserver, trigger once at 20% visible), staggered 80ms between the image and its text |
| Footer links | Underline draws in from left on hover, `duration-fast` |

### Copy tone
Second person, active voice, no jargon: "Upload a PDF, paste a link" not "Ingest heterogeneous document sources." Buttons say exactly what happens: "Try it free," not "Get started."

---

## 2. Signup / Login

**Job of the page:** get a returning user in with zero friction, and a new user signed up in under 20 seconds.

### Layout
Single centered card (`max-w-sm`, `surface`, `rounded-2xl`, `shadow-lg`) on a quiet `bg` background — optionally with a very faint, slow-drifting version of the gradient signature in the corner (low opacity, `blur-3xl`, purely ambient, never distracting from the form). No split-screen marketing panel — keep it minimal per the "bold but simple" brief.

```
┌───────────────────────────┐
│         Logo               │
│   Welcome back              │  ← display-md
│                             │
│  [ Continue with Google ]   │  ← outline button, provider icon
│  [ Continue with GitHub ]   │
│  ── or ──                   │
│  Email     [____________]   │
│  Password  [____________]   │
│            Forgot password? │
│  [        Sign in        ]  │  ← primary, full width
│                             │
│  New here? Create an account│
└───────────────────────────┘
```

### States to spec explicitly
- **Empty/default** — as above.
- **Field focus** — border transitions from `border-border` to `border-primary`, label (if floating-label style) shrinks and moves up, `duration-fast`.
- **Validation error** — border → `border-error`, a `text-error text-body-sm` message fades in below the field (`fade-up`, 150ms), field gets a single 180ms horizontal shake (2px amplitude) capped so it never feels janky — respects reduced-motion (skip shake, keep color+message).
- **Loading (submit)** — button label swaps to a small spinner, button width does *not* change (prevents layout jump), button becomes non-interactive, `duration-fast` cross-fade between label and spinner.
- **Success** — brief `success`-colored check animates in the button before redirect (250ms), then route to dashboard.
- **OAuth in progress** — provider button shows its own inline spinner, other buttons dim to 50% opacity and become inert.

### Signup-specific
Same shell, add a password-strength meter: a thin 3-segment bar under the password field, segments fill left→right in `error → warning → success` color as strength increases, filling animated over `duration-fast` on each keystroke (debounced).

---

## 3. Notebooks Dashboard

**Job of the page:** let a user see every notebook they own, its state, and get into one (or start a new one) in one click.

### Layout
```
┌──────────────────────────────────────────────────┐
│  Logo        [Search notebooks...]      [Avatar] │
├──────────────────────────────────────────────────┤
│  Your notebooks                    [+ New]        │  ← gradient-signature on New button
│                                                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ NB card│ │ NB card│ │ NB card│ │ + New  │      │
│  └────────┘ └────────┘ └────────┘ └────────┘      │
│  ┌────────┐ ┌────────┐ ...                        │
└──────────────────────────────────────────────────┘
```
Grid: `grid-cols-4` desktop / `grid-cols-2` tablet / `grid-cols-1` mobile, `gap-6`.

### Notebook card anatomy
- `surface` background, `rounded-2xl`, `shadow-sm` at rest → `shadow-md` on hover, `translateY(-2px)` on hover, `duration-base`.
- Top: a small colored swatch or auto-generated abstract gradient thumbnail (derived deterministically from the notebook's id, so each notebook gets a stable, distinct identity at a glance — reads as "different notebooks," not visual noise).
- Title: `text-body-lg` semibold, truncate at 2 lines.
- Metadata row: source count + last-edited relative time, `text-body-sm text-muted`.
- **Status summary**: small stacked dots (max 3 shown + "…") reflecting source indexing state — reuses the yellow/green dot language from the workspace, so the dashboard doubles as an at-a-glance "is anything still processing" view.
- Overflow menu (⋯) appears on hover only, top-right, for rename/duplicate/delete.

### Empty state (first-time user)
Full-width illustrated empty state, not just an empty grid: a friendly illustration echoing the source-type icons (PDF/YT/Text/VTT/Web arranged loosely), headline "Nothing here yet," subtext "Create your first notebook and add a source to start asking questions," single primary CTA. This is the one place besides the landing hero where the gradient signature reappears — reinforces "this is a fresh, important starting point."

### Micro-interactions
| Element | Interaction |
|---|---|
| New Notebook card | Dashed `border-border` at rest; on hover, border solidifies to `primary`, plus icon rotates 90°→0° (a "+" that gently un-rotates in), `duration-base` |
| Notebook card | Hover lift as above; click triggers a quick `scale(0.98)` press-down before navigating (feels tactile, not instant-teleport) |
| Card grid on load | Cards stagger in with `fade-up`, 40ms delay between each, capped at first 12 (avoid long waterfall on large libraries) |
| Search | Filters grid live, non-matching cards fade+shrink out over `duration-fast` rather than instantly disappearing |
| Delete (from ⋯ menu) | Confirmation happens in a small popover, not a modal — keep destructive-but-recoverable actions lightweight; card fades+collapses height on confirm |
| Indexing status dots on card | If any source is still indexing, one dot uses `animate-indexing` pulse so "something's happening" is visible without opening the notebook |

---

## 4. Notebook Workspace

This is the screen from your wireframes — source management + chat + optional preview panel. Three-column layout that collapses responsively.

### Layout (desktop, all 3 panels)
```
┌────────┬─────────────────────────┬──────────────────┐
│Sources │  Chat                   │ Source Preview    │
│        │                         │ (opens on demand)  │
│[+ Add] │  ┌───────────────────┐  │ ┌────────────────┐│
│──────  │  │ AI response with   │  │ │                ││
│● doc.pdf│  │ inline citations  │  │ │  PDF viewer /  ││
│● video  │  │ [1] [2] [3]  ← chips│ │  YT embed       ││
│○ notes  │  └───────────────────┘  │ │  scrolled/     ││
│○ tr.vtt │                         │ │  seeked to the  ││
│        │  [Type a query here...] │ │  cited moment    ││
└────────┴─────────────────────────┴──────────────────┘
● = indexed (success)   ○ = indexing (warning, pulsing)
```

- **Left sidebar** (`w-72`, `surface`, fixed): "Add source" button at top (opens the 5-option modal below), then the source list.
- **Center** (`flex-1`, `bg`): chat thread, scrollable, input pinned to bottom.
- **Right panel** (`w-96`, slides in with `slide-in-right`, `glass` background, `shadow-lg`): only rendered when a citation is clicked. Closing it (X button or Esc) slides back out and the center panel reclaims the width smoothly (`duration-base` on the flex-basis transition).

### Source list item
- Status dot (`success`/`warning` per token, `animate-indexing` while pending) + filename/title, truncated + `text-body-sm`.
- File-type icon (mono-style, matches the Add Source icon set) at the left of the dot for quick scanning.
- Hover reveals a small ⋯ for remove/re-index; click opens that source directly in the right preview panel (same slide-in as a citation click).
- **Indexing → Indexed transition**: dot doesn't just snap yellow→green. It does a quick `scale(1.3)→scale(1)` "settle" pulse in `success` color at the moment indexing completes, plus the row background flashes `success/10` for 400ms and fades — gives positive, noticeable feedback for a state change that otherwise happens silently in the background.

### Add Source modal
Reuses the 5-card grid from your wireframe (PDF / YT Link / Text / VTT / Web Link) exactly as laid out, with the Web Link card as the tall spanning card. On selecting a type, the modal morphs in place (height animates, `duration-base`) to show that type's specific input (file dropzone for PDF, URL field for YT/Web, textarea for Text, dropzone for VTT) rather than navigating to a new screen.

- **File dropzone**: dashed `border-border`, on drag-over border → `primary` + background tints to `primary/5`, `duration-fast`.
- **On submit**: modal closes, new row appears at the top of the source list *already in the indexing (warning) state*, with `animate-indexing`, so the user gets immediate confirmation their upload was received before processing finishes.

### Chat panel
- User messages: right-aligned, `surface-raised` bubble, `rounded-2xl`.
- AI responses: left-aligned, no bubble (full-width, flat on `bg`) with a small avatar mark — differentiates "the app talking" from "you talking" without boxing the AI's answer, which tends to look cramped for longer responses.
- **Citations**: inline numbered chips (`[1]`, `[2]`) styled as small `accent`-tinted pills, baseline-aligned with text. Clicking one opens/updates the right preview panel and **scrolls the PDF to the cited page or seeks the video to the cited timestamp** — this is the payoff moment from your second wireframe, make it feel instant (panel already open → content swaps with a 150ms crossfade; panel closed → slides in then loads).
- **Streaming response**: text appears token-by-token (or word-by-word chunked for perf), with a subtle blinking `primary` cursor block at the writing edge; citation chips pop in with a small `scale(0.8)→1` bounce right when they appear in the stream, so the "grounding" moment is visually punctuated.
- **Query input**: bottom-pinned, `surface`, `rounded-full`, expands vertically (up to ~5 lines) as the user types multi-line queries, `duration-fast` height transition. Send button disabled/dim until there's input; on send, input clears and the new user message animates in as chat scrolls to bottom (`ease-out`).

### Empty states within the workspace
- **No sources yet**: center panel shows a focused prompt — "Add a source to start asking questions" with a shortcut straight into the Add Source modal — chat input is disabled/greyed until at least one source exists, with a tooltip explaining why on hover.
- **Sources indexing, none ready yet**: chat input stays enabled but shows a subtle inline note ("Some sources are still indexing — answers may be based on what's ready so far") rather than blocking the user.

### Responsive behavior
- **Tablet**: right preview panel becomes an overlay (covers chat rather than sitting beside it), sidebar collapses to icon-only rail, expandable on tap.
- **Mobile**: single column. Sources list, chat, and preview become three separate full-screen views navigated via a bottom tab bar or swipe; citation taps push the preview view onto a navigation stack (native back gesture returns to chat) rather than a side panel.

### Micro-interactions summary (workspace-specific)
| Element | Interaction |
|---|---|
| Indexing dot | `animate-indexing` pulse (warning color) while pending; one-time scale-settle pulse (success color) + row flash on completion |
| Add Source modal | Height auto-animates between "pick type" and "type-specific form" states |
| Preview panel | `slide-in-right` on open, reverse on close; content crossfades (not reloads) when switching cited source while already open |
| Citation chip | `scale(0.8→1)` bounce-in as it streams into the response; `bg-accent/20 → bg-accent/40` on hover to signal clickability |
| Query input | Auto-grow height; send button icon morphs from paper-plane to a small spinner while awaiting the first streamed token |
| Source row remove | Row height collapses + fades over `duration-base` rather than an abrupt disappearance |
