---
name: chaibookLM
status: final
sources:
  - {planning_artifacts}/prds/prd-chaibookLM-2026-08-04/prd.md
  - {planning_artifacts}/prds/prd-chaibookLM-2026-08-04/addendum.md
  - {planning_artifacts}/briefs/brief-chaibookLM-2026-08-04/brief.md
  - {planning_artifacts}/briefs/brief-chaibookLM-2026-08-04/addendum.md
  - {planning_artifacts}/design-style.md
  - {planning_artifacts}/tech-stack.md
updated: 2026-08-05
---

# chaibookLM — Experience Spine

## Foundation

Responsive web app, web-first with mobile optimization (minimum supported viewport **320px**). No UI system named — the design system is authored fresh in `DESIGN.md`, which is the visual identity reference; this spine is the experience. Accounts via Clerk. Client data fetching via TanStack Query (no raw fetch in components); markdown rendering via react-markdown + remark-gfm; first-run tour via Driver.js.

The product is three surfaces that together close the trust loop:

1. **Sources** — bring your own text and webpages into the current notebook; watch them index.
2. **Chat** — ask questions; answers are grounded *only* in the current notebook's sources and carry per-sentence citations.
3. **Original View** — the payoff: a citation click opens the actual source — the live webpage on the right-hand showcase, or the pasted text with the cited passage highlighted. *Not a parsed extract, not a quote preview — the source itself.*

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Notebook rail | Always visible (collapsed on mobile) | Create, switch, rename, delete notebooks |
| Sources panel | Workspace (left pane) | Add (paste text / submit URL), list, inspect, remove sources; ingestion status |
| Chat | Workspace (center pane) | Grounded Q&A with inline citations; refusal + approval-gated fetch-on-refusal |
| Original View showcase | Citation click (right pane) | Live webpage (web source) / full text with highlighted span (text source) |
| Upload dialog | Sources panel "+" actions | Add text source or web source (pop-up per addendum Design anchors) |
| Account | Header avatar | Clerk account, source-limit overview, replay first-run tour |

Desktop: notebook rail → sources → chat → showcase, four explicit bordered panes on the cream canvas. Modal stacks one level deep (a dialog never opens on top of another dialog).

→ Composition references: `mockups/key-workspace.html`, `mockups/key-upload-dialog.html`, `mockups/key-mobile.html`. Spine wins on conflict.

## Voice and Tone

Calm for the research flow, confident/funky for the brand. Short, complete sentences. The product never pretends — if it can't answer, it says so plainly. Microcopy echoes the brand promise: *grounded, verifiable, from your sources*. Brand voice and aesthetic posture live in `DESIGN.md`.

| Do | Don't |
|---|---|
| "Ask anything about your sources." | "Let's get started! 🚀" |
| "Not in your sources — want me to find and add related web pages?" | "I don't know. Maybe try a different question." |
| "Ready." / "Processing…" / "Couldn't fetch this page." | "✓ Indexed successfully" / "Error 502" |
| "2 citations · 2 sources" | "🔥 90% citation coverage!" |
| "Removing this removes its 3 chunks from answers." | "Delete?" |
| "You've reached 30 sources — the v0.1 limit." | "Limit exceeded." |

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| Notebook rail item | Notebook rail (alias: Notebook rail) | Click switches notebooks; active state on brand orange with a non-color indicator (bold + glyph). Rename/delete via row menu, delete requires confirmation dialog. Create new notebook starts empty. |
| Source card | Sources panel | Shows icon, title, type + size, added time, status dot + label. Click inspects metadata; remove via row action (bulk remove supported, one-click "clear failed"). |
| Add source trigger | Sources panel | A `button-secondary`. Opens upload dialog. Two paths: textarea paste, or URL field. Empty/whitespace-only text rejected inline; malformed URL rejected inline before submit. |
| Button (primary) | Empty states, approval, confirm | The loudest action on screen. Sends/submits; one per action group. Enter activates in dialogs. |
| Button (secondary) | Cancel, inspect, replay tour | Dismisses without committing; neutral. |
| Button (danger) | Destructive confirms | Delete notebook, remove sources, clear failed. Always inside a confirmation dialog. |
| Citation chip | Assistant message | Inline, per-sentence, at the end of the sentence it supports. Click → Original View (alias: Showcase). Hover/tooltip → source title. Keyboard: Tab to focus, Enter to open. |
| Assistant message | Chat | Open document-style text (react-markdown). Per-sentence citation chips inline. No bubble/avatar. |
| User message | Chat | Contained right-aligned block. Rendered as markdown. |
| Composer | Chat bottom | Enter sends, Shift+Enter newline. Disabled while an answer is generating. Textarea auto-grows. |
| Original View (alias: Showcase) | Right pane | Web source → live page in showcase frame. Text source → full text with cited span highlighted (mark semantics + highlight color), scrolled into view. Esc closes; focus returns to the invoking citation chip. |
| Upload dialog (alias: Dialog) | Sources panel | Pop-up per addendum anchors. Focus trap + initial focus inside; focus returns to the trigger on close. Shows ingestion state as color on the source's card after close. |
| Warning dialog (alias: Dialog) | Anywhere | Limit violations (5MB/source, 10/notebook, 30/user) surface as pop-up warning (PRD §6.1). One button: dismiss. |
| First-run tour | First run | Driver.js walkthrough of sources panel, showcase, chat. Dismissible, replayable from Account. No custom visual spec. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Signed out | All | Clerk sign-in wall. No workspace access until authenticated. |
| Cold load | Workspace | Skeletons matching the pane layout (notebook rail, sources, chat). Resolves on data. |
| Empty notebook | Workspace | "This notebook has no sources yet." Primary action: add your first source. Chat shows "Ask anything about your sources." |
| Ingestion | Source card | `queued → processing → ready/failed`, surfaced as status dot + label on the card (color per DESIGN.md). Source is **not** queryable until `ready`. One polite live region announces only final states — `ready`/`failed` including the failure reason; intermediate `queued → processing` is not announced. |
| Ingestion failed | Source card | `Couldn't fetch this page.` with reason (404, paywall, non-HTML, JS-only render). Failure is expected for some URLs, never breaks other sources. One-click "clear failed". |
| Answer generating | Chat | Sending state on composer; answer streams in as document text. |
| Refusal | Chat | "Not in your sources." + button: "Find related web pages." Fetch executes **only** after explicit user approval. While fetching: pending state; when done, new sources appear in Sources panel (announced: "Added N sources") and are queryable. |
| Fetch-on-refusal failed | Chat | Fetch fails → refusal state restored with the button reset to a retryable "Try again". No sources added. Never leaves the notebook half-fetched. |
| Citation → Original View | Showcase | Web: live page loads (loading state while the frame resolves; failure → fallback snapshot per assumption). Text: scrolls to and highlights the cited span via its recorded offset. |
| Limit violation | Dialog | Pop-up warning listing the limit and current count. Upload rejected. |
| Network / LLM error | Chat + toast | Inline retry on the failed message. No silent failures. |
| Stale sources | Sources panel | After a source is removed, future answers cite only what remains (FR-4 consequence). |

## Interaction Primitives

- Click to act. Enter to send; Shift+Enter newline. Esc closes the topmost dialog **and** the Original View showcase, returning focus to the invoking control. Tab order follows reading order; a "Skip to chat" link is the first tab stop on desktop.
- Dialogs trap focus: Tab/Shift+Tab stay inside; initial focus lands on the first control (or the confirm button); focus returns to the trigger on close.
- Citation chips are first-class interactive targets: keyboard-focusable, Enter to open, tooltip on hover/focus.
- Mobile tabs (Sources | Chat | Showcase) use real tablist semantics: `role="tablist"`/`tab`, `aria-selected`, arrow-key navigation.
- Dialog confirmation required for destructive actions: delete notebook, remove sources, bulk remove, clear failed.
- **Banned:** infinite scroll (pagination if needed), drag-to-reorder in v1, hover-only affordances on `sm` viewports, modal stacks > 1 level deep, autoplay, celebratory animations, typing-dot theatre.

## Accessibility Floor

Behavioral. Visual contrast lives in `DESIGN.md`. Consumer stakes → WCAG 2.2 AA across the responsive web surface.

- Every interactive element labeled with role + state (screen reader). Ingestion status announces on transition (`aria-live`): "Source ready." / "Couldn't fetch this page." with reason. Intermediate states are not announced.
- Focus visible everywhere per DESIGN.md: `3px` ring + `2px` offset, inverted to cream on ink/brand fills, `:focus-visible` only — never shadow-based. Load-bearing contrast targets: `{colors.ink-muted}` meta/citation text ≥ 4.5:1, active notebook label `{colors.brand-ink}` on `{colors.brand}` ≥ 4.5:1, status dots ≥ 3:1.
- Citation chips: full keyboard path (Tab focus, Enter open), and the opened Original View announces the source title + highlighted passage.
- Touch targets ≥ 44px on mobile, ≥ 24px on desktop for interactive elements.
- Reduce Motion honored: hard shadows are static (no motion cost); any transitions are ≤ 150ms and skipped under Reduced Motion. The Driver.js tour is configured with `prefers-reduced-motion`, `role="dialog"` `aria-modal`, focus containment, and Esc-to-dismiss matching the app dialog convention.
- Streaming answers render inside a stable `aria-live="polite"` region (never `assertive`).
- Text-source cited-passage highlight uses `mark` semantics plus the highlight color — never color alone.
- Contrast for `{colors.brand}` ink-on-orange and `{colors.cite}` white-on-blue verified at AA for text sizes used; label text always paired with status color.
- Screen reader announces surface on navigation: "Sources panel, 3 sources" / "Chat" / "Original View: {title}".

## Developer Contract: Debug Component Naming (Strict Rule)

> **STRICT RULE** — this contract is non-negotiable and applies to every component on every surface.

1. **Every component instance has a unique, stable debug name.** A component instance = any element a reviewer might point at: panes, cards, chips, buttons, messages, dialogs, the showcase, the rail. Names are unique per instance (e.g. `source-card-2`, `citation-chip-3`, `notebook-switcher`, `composer`) and stable across renders — the same instance always carries the same name.
2. **Debug environment shows the name; production never does.** In debug builds (dev mode / explicit `UX_DEBUG` flag), each component renders a small overlay label showing its unique name. In production builds the label is stripped at build time — never rendered, never shipped.
3. **The overlay is zero-impact by construction.** The label is `position: absolute` relative to its component (anchored top-left), `pointer-events: none`, drawn at a high `z-index`, and consumes no layout space. It must never reflow, cover, or restyle the component — **the naming convention never affects the actual design or style**. This is part of the rule, not a preference.
4. **Enforcement is the implementation's responsibility.** A shared wrapper/mechanism applies the label uniformly; any component that cannot host the overlay (e.g. inside a third-party frame like the live-page showcase) must expose a named placeholder anchor instead of being skipped silently.
5. **Acceptance:** a reviewer in debug mode can point at any element, read its name from the overlay, and give feedback that references that name — and the identical build in production shows no trace of it.

This contract lives in `DESIGN.md` as a Do/Don't row; the behavior lives here.

## Responsive & Platform

| Breakpoint | Behavior |
|---|---|
| `≥ lg` (1024px+) | Four-pane desktop: notebook rail, sources, chat, showcase. |
| `md` (768–1023px) | Notebook rail collapses to icon strip. Sources panel collapses to a drawer toggled from the chat header. Chat + showcase remain. |
| `< md` (≤ 767px) | Single stacked surface. Tabbed switch: Sources | Chat | Showcase. Showcase opens full-screen from a citation tap with a labeled back button (≥44px) and Esc-to-close. Minimum 320px supported. |

chaibookLM is responsive web, not a native app. Reading + asking + citation-verification work on phones; the heavy desktop pane arrangement is the primary surface.

## Inspiration & Anti-patterns

- **Lifted from NotebookLM:** the notebook-as-container mental model, sources → grounded chat → citations. The mental model is proven; the execution is ours.
- **Lifted from the Research Copilot style grammar:** the three-pane workspace structure, the "numbers are heroes" stat convention, and conversational asymmetry (user = contained chip, assistant = open document text). The *visual* tokens are rejected in favor of the brutalist language — structure and behavior carry, the soft aesthetic does not.
- **The signature gap:** NotebookLM shows a highlighted *quote preview*; chaibookLM renders the *source itself*. The Original View is the differentiator and every flow must protect it.
- **Rejected — Google's clean minimalism:** the brand posture is the opposite; chaibookLM is the funky, honest, deliberately-unique alternative.
- **Rejected — "AI chatbot" theatre:** bubbles, avatars, typing dots, glow. The assistant reads as a document that responds to you.
- **Rejected — feature-first density:** one job per screen, zero-noise discipline, no dashboard chrome.

## Key Flows

### Flow 1 — UJ-1 · Meera builds a notebook and verifies an answer (Tuesday night, indoor-plant research)

1. Meera signs in with Clerk. First run: the Driver.js tour walks her through the sources panel, the showcase, and chat.
2. She clicks "+" → "Paste text" and drops in an article on watering plants; the upload dialog confirms and the source card begins its `queued → processing` dance.
3. She adds a webpage URL as a second source; the card moves through `processing` to **Ready.**
4. She types in chat: *"What's the best way to avoid overwatering?"*
5. The answer streams in as document text — and each sentence closes with a blue citation chip.
6. **Climax:** she clicks the second chip and the Original View slides open on the right — the *live* webpage she added, not a parsed extract. She checks the sentence against the page.
7. She trusts the answer, keeps asking, and the loop — ask, cite, verify in one click, without leaving the flow — holds.

Failure: the webpage fetch returns a JS-only render → the card flips to **Couldn't fetch this page.** with the reason; the notebook and her first source are untouched.

### Flow 2 — UJ-2 · Sam curates his sources across sessions (returning student)

1. Sam returns to a notebook with chat history. He switches notebooks via the rail; each notebook restores its own sources and chat — nothing leaks between them.
2. He inspects a source card's metadata, decides one is outdated, and removes it (confirmation dialog: "Removing this removes its chunks from answers.").
3. He asks a fresh question in chat.
4. **Climax:** the new answer carries citations only to sources still in the notebook — his notebook reflects only what he has now.
5. He deletes the old notebook entirely (confirmation) and keeps working in the one that matters.

Failure: a notebook switch fails to load → cold-load skeleton on the target pane with an inline retry; the previous notebook's state is untouched. Failure: a source removal fails → the card stays and the dialog surfaces an inline error, never a silent drop.

### Flow 3 — Meera hits an honest refusal (the trust-defining moment)

1. Meera asks something none of her sources cover: *"How does light affect humidity?"*
2. The answer is plain and honest: **Not in your sources.** No fabricated citation, no general-knowledge guess.
3. A single button appears: "Find related web pages."
4. **Climax:** she approves; the fetch runs, the new pages index into the notebook, and her next question answers with citations to the freshly added sources — the tool grew *her* material instead of guessing for her.

Failure: the fetch fails → the refusal state returns with a "Try again" button and no new sources; the notebook is left exactly as it was, honest to the end.

## Open Questions

- OQ-U1: Web-source showcase — if a site blocks embedding, do we fall back to the stored HTML snapshot? `[ASSUMPTION: fallback to stored snapshot; confirm in build]`
- OQ-U2: Palette/font values passed AA review but are still a first pass — final taste-check on first real build before promotion. `[ASSUMPTION]`
- OQ-U3: Dark mode — deferred out of v0.1; light canvas is the v0.1 surface. `[ASSUMPTION]`
- OQ-U4: Mobile tab set (`Sources | Chat | Showcase`) — confirmed with real tablist semantics; validate framing in the mobile mock. `[ASSUMPTION]`
