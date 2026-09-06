---
name: contextual
status: final
sources:
  - _bmad-output/planning-artifacts/prds/prd-contextual-v1-2026-09-05/prd.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/DESIGN.md
updated: 2026-09-06
---

# Contextual — Experience Spine

> Precision-engineered Neo-Brutalism for a high-velocity, personal research workspace. Paired with `DESIGN.md` (visual identity). This document owns **how Contextual behaves, interacts, and responds to users across all viewports**.

---

## Foundation

Contextual is a responsive web application designed for high-velocity research, synthesis, and fact verification. It is inspired by Google NotebookLM's grounded source model, elevated with an upgraded Neo-Brutalist design language and Contextual's signature **Deep Original View** verification loop.

- **Form Factor:** Responsive web application running across Desktop (`≥1280px`), Tablet (`768px–1279px`), and Mobile (`320px–767px`).
- **UI Architecture:** Built with Vanilla CSS design tokens and semantic HTML/React components adhering strictly to the Google Labs `DESIGN.md` specification.
- **Visual Identity Authority:** `DESIGN.md` owns all visual tokens (colors, typography, elevation, shapes, and borders). This spine cross-references those tokens using `{path.to.token}` syntax (e.g. `{colors.light.accent}`, `{colors.light.citation}`, `{components.Button}`).
- **Single-Tenant Workspace:** Single-user per notebook; users create isolated notebook workspaces containing up to 10 multi-modal sources (PDF, Web, YouTube, Transcripts, Text) and a dedicated grounded chat stream.

---

## Information Architecture

### Surface & Route Map

| Surface / Route | Primary Trigger | Primary Purpose | Composition Reference |
|---|---|---|---|
| **Marketing Landing** (`/`) | Direct URL | Product value proposition, interactive sample demo, sign-up CTA | `mockups/mockup-landing.html` |
| **Dashboard** (`/dashboard`) | Post-auth / Breadcrumb | Grid of user notebooks, daily credit balance, midnight auto-deletion countdowns, create notebook CTA | `mockups/mockup-dashboard.html` |
| **Desktop Tri-Pane Workspace** (`/notebook/[id]`, `≥1280px`) | Select notebook on desktop | Unified research workstation: 25% Sources Pane, 45% Grounded Chat Pane, 30% Original View Showcase Pane | `mockups/mockup-workspace-desktop.html` |
| **Tablet Workspace** (`/notebook/[id]`, `768px–1279px`) | Select notebook on tablet | 50% Chat + 50% Showcase split; Sources Pane accessible via slide-over Neo-Brutalist drawer | `mockups/mockup-workspace-desktop.html` |
| **Mobile Workspace** (`/notebook/[id]`, `320px–767px`) | Select notebook on mobile phone | Full-width single view with 3 top tabs: `[Sources (N)]`, `[Chat]`, `[Showcase]`; sticky floating `← Back to Chat` button | `mockups/mockup-workspace-mobile.html` |
| **Add Source Modal** | `+ Add Source` button | Multi-modal intake dialog with 5 tabbed upload options (Text, Web URL, PDF Dropzone, Transcript, YouTube URL) | `ui_kits/app/modal.html` |
| **Credit Details Popup** | Top bar `⚡ N/10` pill click | Explains daily credit allocation, reset timer (Midnight Asia/Kolkata), and upgrade pathway | `mockups/mockup-workspace-desktop.html` |

> [!NOTE]
> Composition references (`mockups/*.html` and `ui_kits/app/*.html`) demonstrate live layouts. In any case of ambiguity or discrepancy, **both `DESIGN.md` and `EXPERIENCE.md` win on conflict with any mock or wireframe**.

---

## Voice and Tone (Microcopy)

Contextual's voice is concise, honest, technical, and urgent. It treats the user as an intelligent researcher who values speed, evidence, and clear boundaries over conversational filler.

| Context | Do (Contextual Tone) | Don't (Generic SaaS Tone) |
|---|---|---|
| **Chat Refusal (Source Boundary)** | "The uploaded sources do not specify the requested information. Search the live web via Tavily? (Consumes 1 credit)" | "I'm sorry, I couldn't find that in your files! Maybe try asking something else? 😊" |
| **Credit Warning (≤ 2 credits)** | "⚠️ 2/10 credits remaining. Resets at 12:00 AM IST." | "You're running low on credits! Buy more now!" |
| **Credit Lockout (0 credits)** | "🔒 0/10 credits remaining. Composer disabled until midnight reset." | "Oops! You've used up all your fun tokens for today!" |
| **Ephemeral Auto-Deletion Notice** | "⏳ Auto-deletion Notice: This notebook will be auto-deleted tonight at 12:00 AM Asia/Kolkata (UTC+05:30)." | "Heads up! We might clean up your workspace soon." |
| **Ingestion Status: In-Flight** | "Indexing source... Chunks parsed and embedded." | "Hang tight! Magic is happening behind the scenes..." |
| **Ingestion Status: Error** | "Failed: No captions found for this video. Upload an .srt transcript instead." | "Something went wrong! Please try again later." |
| **Showcase Empty State** | "Click any citation pill in chat to verify proof in the original source." | "No document selected yet." |

---

## Component Patterns (Behavioral)

Visual styling details live in `DESIGN.md.Components`. This section defines their interactive behavior, state transitions, and client-side lifecycle rules.

### 1. `<Button>`
- **Elevation Flow:** Standard state has `{elevation.standard}` (`4px 4px 0 0` ink border shadow). On hover or focus, shadow expands to `{elevation.hover}` (`6px 6px 0 0`) while the element translates `(-2px, -2px)`. On active/pressed, shadow collapses to `0 0 0 0` and element translates `(4px, 4px)`.
- **Keyboard Activation:** Fires on `Enter` or `Space`. Triggers the exact same pressed transform during the keydown cycle.
- **Disabled State:** Opacity locked to `0.45`, cursor set to `not-allowed`. Elevation flow is disabled; pressing does not translate.
- **Motion Reduction:** When `prefers-reduced-motion` is detected, all translate transforms are suppressed and replaced by a 3px solid ink underline shift.

### 2. `<CitationPill>`
- **Affordance:** Rendered strictly in `{colors.light.citation}` (`#00E5FF`) with a non-slanted 1.5px ink border.
- **Hover Micro-interaction:** Hovering displays a tooltip indicating the source name and page number or timestamp (e.g. `"raft-paper.pdf • Page 14"`).
- **Click Event:**
  - On Desktop (`≥1280px`): Focuses the Showcase Pane (Pane 3), navigates the embedded document viewer to the targeted page or video timestamp, and flashes a high-contrast bounding-box highlight in `{colors.light.citation}` for 2.5 seconds.
  - On Tablet (`768px–1279px`): Focuses the right-hand Showcase column and applies the same scroll and highlight.
  - On Mobile (`320px–767px`): Automatically switches the active view tab from `[Chat]` to `[Showcase]`, renders the highlighted proof, and activates the sticky floating action button `[← Back to Chat]`.

### 3. `<SourceCard>`
- **Status Machine:**
  - `queued`: Muted gray border (`#555555`), static gray dot, label "Queued".
  - `indexing`: Ink border with yellow accent badge (`#FFE500`), animated orbital neo-brutalist shadow spin indicator, label "Indexing...".
  - `ready`: Solid 2px ink border, solid offset shadow, green pulse indicator (`#00E575`), label "Ready".
  - `failed`: Solid 2px red border (`#FF3333`), red alert icon, label "Failed", with a tooltip explaining root cause and an actionable `[Retry]` button.
- **Deletion:** Hovering reveals a secondary meatball icon with a single-step "Remove from notebook" action.

### 4. `<CreditBadge>`
- **Location:** Top-bar right aligned across all viewports.
- **States:**
  - Normal (> 2 credits): Displays `⚡ N/10 credits` in `{colors.light.surface}` pill with ink border.
  - Warning (1–2 credits): Background transitions to `{colors.light.accent}` (`#FFE500`) with text `⚡ N/10 credits`.
  - Zero credits (0 credits): Background transitions to `{colors.light.danger}` (`#FF3333`) with white text `🔒 0/10 credits`. Disables the chat composer textarea and `Send` button.
- **Click Behavior:** Clicking opens a Neo-Brutalist popup modal explaining the daily reset schedule (midnight Asia/Kolkata).

### 5. `<ExpirationBanner>`
- **Placement:** Persistent, full-width high-contrast banner docked immediately below the top navigation bar.
- **Behavior:** Background set to `{colors.light.accent}` (`#FFE500`). Dynamic countdown calculates remaining time until 12:00 AM Asia/Kolkata (UTC+05:30) and displays: `"⏳ Auto-deletion Notice: This notebook will be auto-deleted tonight at 12:00 AM Asia/Kolkata (in X hours, Y minutes)."`

### 6. `<RefusalCard>`
- **Trigger:** Rendered inline in the chat stream when the grounded retrieval score falls below threshold or when source chunks do not support the user's inquiry.
- **Content:**
  - Warning ink border with yellow accent corner tag.
  - Refusal statement: `"The uploaded sources do not specify the requested information."`
  - Fallback action: `"Search the live web via Tavily? (Consumes 1 credit)"`
  - Slanted action button: `<Button variant="primary">Search Web & Answer</Button>`.
- **User Acceptance:** Clicking the button deducts 1 credit, initiates an approval-gated Tavily query, and appends a verified web response with cyan citation tags linking to live external URLs.

---

## State Patterns

```
+-----------------------------------------------------------------------------+
|                               WORKSPACE STATES                              |
+-------------------+--------------------+--------------------+---------------+
| State             | Trigger / Condition| Visual Treatment   | User Action   |
+-------------------+--------------------+--------------------+---------------+
| Empty Workspace   | 0 sources in       | Large dashed card  | Click "+ Add  |
|                   | notebook           | with "+ Add First  | Source" to    |
|                   |                    | Source" CTA        | upload        |
+-------------------+--------------------+--------------------+---------------+
| Ingestion Active  | Inngest pipeline   | Orbital shadow spin| Can continue  |
|                   | running for source | on source card     | chatting with |
|                   |                    |                    | ready sources |
+-------------------+--------------------+--------------------+---------------+
| Grounded Chat     | User submits prompt| Token-by-token text| Click cyan    |
| Streaming         |                    | stream; cyan pills | pills anytime |
|                   |                    | stream in real-time| to inspect    |
+-------------------+--------------------+--------------------+---------------+
| Original View     | Citation pill      | PDF page jumper or | Read cited    |
| Verification      | clicked in chat    | YouTube seek to    | source proof  |
|                   |                    | exact timestamp    | in context    |
+-------------------+--------------------+--------------------+---------------+
| Out of Credits    | Daily balance = 0  | Lock icon on badge;| Wait for reset|
| Lockout           |                    | composer disabled; | or review past|
|                   |                    | banner active      | conversations |
+-------------------+--------------------+--------------------+---------------+
```

---

## Interaction Primitives

### Keyboard Navigation (Speed & Power Utility)
- `⌘K` or `Ctrl+K` — Open Notebook Switcher / Quick Search across existing notebooks.
- `/` — Focus the chat prompt composer input from anywhere on the workspace.
- `Enter` — Send chat message (when composer is focused and not empty).
- `Shift + Enter` — Insert newline in chat composer textarea.
- `Esc` — Close open modals, close slide-over drawers, or dismiss credit popups.
- `[ / ]` — Previous / Next page in the PDF Original View Showcase viewer.

### Mouse & Touch Primitives
- **Citation Inspection:** Single click/tap on `<CitationPill>` instantly updates the Showcase pane.
- **Mobile Navigation Loop:**
  - User taps citation pill in `[Chat]` tab.
  - View instantly flips to `[Showcase]` tab, centered on proof.
  - Sticky floating button `← Back to Chat` docks at bottom center (`z-index: 50`).
  - User taps `← Back to Chat` and returns to exact conversation scroll anchor.

### Anti-Patterns Explicitly Banned
- ❌ **Infinite Scrolling:** Chat lists maintain discrete session records; source lists are capped at 10 items per notebook.
- ❌ **Hover-Only Affordances on Touch:** Every action on desktop hover must be explicitly accessible via tap on mobile viewports.
- ❌ **Modal Stacking:** Never open a modal on top of an existing modal. All sub-flows close or replace the parent sheet.

---

## Accessibility Floor

- **WCAG Compliance:** Meets WCAG 2.2 Level AA across all light and dark mode surfaces.
- **Contrast Ratios:**
  - High-contrast text on canvas: `#111111` on `#F4F4F0` = `16.2:1` (exceeds AAA).
  - Surface cards: `#111111` on `#FFFFFF` = `18.5:1`.
  - Citation Cyan text: Black `#111111` on `#00E5FF` = `13.1:1` (exceeds AAA).
  - Brand Yellow text: Black `#111111` on `#FFE500` = `15.8:1` (exceeds AAA).
- **Focus Rings:** Every interactive element has an explicit `:focus-visible` ring: `3px solid #00E5FF; outline-offset: 2px; border-radius: 2px;`.
- **Live Regions (`aria-live="polite"`):**
  - Real-time ingestion status changes announce completion: `"Source [name] is ready for queries."`
  - Grounded chat completion streams into an ARIA live assertive container for assistive technologies.
- **Motion Reduction (`prefers-reduced-motion: reduce`):**
  - Disables button 3D translation jumps and orbital shadow animations.
  - Replaces hover transforms with solid 3px ink underline and direct background color shifts.

---

## Responsive & Platform Layouts

```
[ ≥1280px Desktop Tri-Pane ]
+-----------------------------------------------------------------------------+
| TOPBAR: Breadcrumb | Auto-Delete Banner | Credit ⚡ 8/10 | Theme | Avatar    |
+----------------------+-----------------------------+------------------------+
| SOURCES PANE (25%)   | CHAT PANE (45%)             | SHOWCASE PANE (30%)    |
|                      |                             |                        |
| • Sources (3/10)     | User: "What is Raft elec?"  | [PDF Viewer: Page 14]  |
| • raft-paper.pdf [R] | Assistant: "Raft elects a   | +--------------------+ |
| • mit-keynote.yt [R] | leader via randomized [1]   | | Bounding box       | |
| • + Add Source [BTN] | timeouts..."                | | cyan highlight     | |
|                      |                             | +--------------------+ |
|                      | [Textarea Composer] [Send]  | [Zoom] [Page Jumper]   |
+----------------------+-----------------------------+------------------------+

[ 768px - 1279px Tablet Split ]
+-----------------------------------------------------------------------------+
| TOPBAR: [≡ Sources (3)] | Auto-Delete Banner | Credit ⚡ 8/10 | Avatar       |
+--------------------------------------------+--------------------------------+
| CHAT COLUMN (50%)                          | SHOWCASE COLUMN (50%)          |
| (Sources open via slide-over drawer)       | (PDF Page or YouTube Player)   |
+--------------------------------------------+--------------------------------+

[ 320px - 767px Mobile Single-View ]
+-----------------------------------------------------------------------------+
| TOPBAR: Contextual | Credit ⚡ 8/10 | Avatar                                 |
+-----------------------------------------------------------------------------+
| TAB BAR: [ Sources (3) ] | [ Chat (Active) ] | [ Showcase ]                |
+-----------------------------------------------------------------------------+
| Assistant: "...randomized election timeouts [1] prevent split votes..."     |
|                                                                             |
| (Tapping [1] auto-switches to Showcase tab)                                 |
|                                                                             |
| +-------------------------------------------------------------------------+ |
| | [Composer Input]                                                 [Send] | |
| +-------------------------------------------------------------------------+ |
| [STICKY FLOATING BUTTON (when in Showcase): ← Back to Chat]                |
+-----------------------------------------------------------------------------+
```

---

## Inspiration & Deliberate Choices

- **Inspired by Google NotebookLM:** Notebook source grounding model, strict source boundary enforcement, multi-modal ingestion.
- **Differentiator (Contextual over NotebookLM):** True **Deep Original View** verification. Where NotebookLM renders an isolated text snippet, Contextual renders the actual multi-page PDF with geometric bounding box highlights, or seeks the embedded YouTube lecture straight to the cited second mark with synchronized autoscrolling transcript dialogue.
- **Inspired by Linear & Vim:** Snappy keyboard speed, visible focus states, zero-blur hard ink shadows, high-velocity developer ergonomics.
- **Brutalist Honesty:** No smooth gradients hiding system latency; real-time Inngest queue states are displayed honestly with high-contrast orbital indicators.

---

## Key Flows (Named-Protagonist Journeys)

### Journey 1: Elena Audits a Technical AI Architecture Paper
*Elena is a senior staff software engineer studying distributed consensus protocols on a 1440px desktop workstation.*

1. Elena navigates to `/dashboard` and clicks `+ New Notebook`, titling it `"Consensus Protocols"`.
2. Inside the tri-pane workspace, she clicks `+ Add Source` and drops a 28-page PDF (`raft-paper.pdf`) and pastes a YouTube keynote URL (`mit-lecture-youtube`).
3. The Sources Pane renders both cards: `raft-paper.pdf` transitions from `queued` to `indexing` with an orbital neo-brutalist shadow animation, reaching `ready` with a green pulse dot after 4 seconds.
4. Elena types in the chat composer: *"How does the leader election handle network partitions during round 3?"* and hits `Enter`.
5. The assistant streams a concise response grounded strictly in the uploaded files, ending with inline cyan citation pills: `[1]`, `[2]`.
6. **Climax:** Elena clicks `[1]`. The right-hand Showcase Pane instantly loads page 14 of `raft-paper.pdf` and animates a high-contrast cyan bounding box directly over the election timeout equation. She clicks `[2]`, and the Showcase dynamically switches to the embedded YouTube player, seeking straight to `18:42` with the exact sentence highlighted in the autoscrolling transcript.
7. Elena completes her verification in 8 seconds without ever leaving her keyboard or switching browser tabs.

*Failure Recovery:* If a YouTube video lacks captions, its SourceCard immediately transitions to `failed` with a red border and an explanatory badge: *"No captions found for this video. Please upload an .srt transcript instead."* Other sources remain completely intact and searchable.

---

### Journey 2: Dev Handles Source Gaps with Approval-Gated Web Search
*Dev is a product manager evaluating competitor pricing sheets on desktop Chrome.*

1. Dev opens his `"Competitor Research"` notebook with 4 PDF price sheets indexed.
2. Dev asks: *"What is Competitor X's enterprise tier SLA guarantee?"*
3. The RAG pipeline queries Qdrant; retrieved chunks discuss pricing and seat minimums, but no SLA metrics exist.
4. **Climax:** The assistant refuses to hallucinate. Instead, it renders a high-contrast `<RefusalCard>` in the chat stream:
   - *"The uploaded sources do not specify Competitor X's enterprise SLA guarantee."*
   - Prompt: *"Search the live web via Tavily? (Consumes 1 credit)"*
5. Dev clicks the slanted neo-brutalist button: `[Search Web & Answer]`.
6. The daily credit counter decrements from `⚡ 8/10` to `⚡ 7/10`. A live Tavily web search executes in the background.
7. Within 2.2 seconds, the assistant streams an updated answer citing live web sources with external link pills. Dev receives verifiable information with explicit, consent-gated credit expenditure.

*Failure Recovery:* If Dev's daily credit balance was `0/10`, the button renders disabled with a locked tooltip: *"Daily credit quota reached. Resets at 12:00 AM IST."*

---

### Journey 3: Marcus Verifies Market Data on Mobile
*Marcus is an equity research associate commuting on a train, reviewing uploaded quarterly filings on an iPhone (390px viewport).*

1. Marcus logs in on mobile Safari. The workspace renders the single-surface tabbed interface: `[Sources (4)] | [Chat] | [Showcase]`.
2. Marcus taps the `[Chat]` tab and submits: *"What was the reported cloud gross margin guidance for Q4?"*
3. The assistant streams the answer, concluding with citation pill `[1]`.
4. Marcus taps `[1]`.
5. **Climax:** The mobile view automatically switches from `[Chat]` to the `[Showcase]` tab. The PDF viewer renders page 6, centered and highlighted on the financial summary table. A sticky neo-brutalist floating action button docks at the bottom center: `← Back to Chat`.
6. Marcus inspects the audited table, then taps `← Back to Chat`. The interface flips back to the Chat tab, perfectly preserving his previous scroll position.
7. Marcus completes his mobile verification without pinching, zooming, or losing his place in the dialogue.

---

## Deliverables & Promotion Manifest

The complete UX package is structured as follows:

```
_bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/
├── DESIGN.md                      # Visual identity contract (Google Labs spec, tokens, components, anti-patterns)
├── EXPERIENCE.md                  # Behavioral contract (IA, voice, states, interaction primitives, key journeys)
├── README.md                      # Claude Design system guide and token manifest
├── colors_and_type.css            # Standalone CSS tokens + typography
├── brand-spec.md                  # OKLch color space specifications
├── prototype-plan.md              # Original component and architectural plan
├── mockups/                       # Production-ready interactive HTML screen mockups
│   ├── mockup-landing.html        # Marketing landing page
│   ├── mockup-dashboard.html      # Dashboard & notebooks grid
│   ├── mockup-workspace-desktop.html  # Tri-pane desktop workstation (25% / 45% / 30%)
│   ├── mockup-workspace-mobile.html   # 3-tab mobile workspace with floating back button
│   └── component-library.html     # Live interactive component library
├── preview/                       # Token & component visual specimen preview cards
│   ├── colors-primary.html        # Color swatch cards
│   ├── typography-specimens.html  # Space Mono + Inter typography scale
│   ├── spacing-tokens.html        # 5-step spacing scale & corner radii
│   ├── shadows.html               # Solid offset zero-blur elevation levels
│   ├── components-buttons.html    # Interactive button states & elevation flow
│   ├── brand.html                 # Logo mark & accent semantics
│   └── surfaces.html              # Miniaturized real screen previews
└── ui_kits/app/                   # Standalone component reference HTML files
    ├── neobtn.html                # NeoButton component
    ├── citation-pill.html         # CitationPill component
    ├── source-card.html           # SourceCard component
    ├── credit-badge.html          # CreditBadge component
    ├── banner-refusal.html        # ExpirationBanner & RefusalCard components
    └── modal.html                 # AddSourceModal component
```
