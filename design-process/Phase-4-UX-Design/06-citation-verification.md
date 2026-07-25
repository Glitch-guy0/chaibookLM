# Scenario 06: Citation Verification & Source Preview

**Created:** 2026-07-25  
**Phase:** 4 — UX Scenarios  
**Persona:** Rachel (Primary)  
**Status:** Outlined  

---

## Scenario Summary

Rachel asks a complex research question. The AI responds with inline citation pills `[1]`, `[2]`. She clicks a citation to verify the claim — the right panel slides in showing the **original source content with the cited passage highlighted**. This is the highest-P1 feature in the entire product.

---

## Trigger

- **Rachel:** "The AI said X from source Y — I need to verify that's actually true before I cite it in my report."

**Emotional State at Entry:** Cautiously optimistic but mistrustful of AI claims — needs proof.

---

## Sunshine Path

### Step 6.1 — Chat Thread with Grounded Answer

**Context:** Rachel has indexed 3 sources and asked a question.

**Page Elements (Center Panel):**
- User message bubble (right-aligned, surface-raised background)
- AI response streaming in with citation pills: `[1]` `[2]` `[3]` inline
- Citation pills styled: `bg-accent/20 border-accent/30 text-accent` — visually distinct from prose text
- Streaming indicator: blinking cursor at end of streaming content
- Once complete: pills become fully clickable buttons with hover scale effect

**Rachel's Mental Model:** "Each [N] is a specific passage the AI actually found — I can check it."

---

### Step 6.2 — Citation Pill Click → Right Panel Opens

**Context:** Rachel clicks `[1]` citation pill.

**Interaction:**
1. Click → Right preview panel animates in from right (`animate-slide-in-right`, 300ms)
2. Panel header shows: source icon + source title (e.g., "📄 ResearchPaper.pdf")
3. Panel body shows the **source viewer** appropriate to the source type

**Emotional Design Goal:** Trust — the answer visually connects to its proof

---

### Step 6.3 — PDF Citation View

**Context:** Citation comes from a PDF source.

**Panel Layout:**
- **Header bar:** File type icon | Source title | "Page 3" label | Close (X) button
- **Metadata strip:** `Passage 2 of 7 • Page 3 • PDF`
- **Source viewer area:**
  - Simulated document view with the full text context of the chunk
  - **The cited passage is highlighted** with `bg-accent/20 border-l-2 border-accent` left-border emphasis block
  - Text above and below the highlight visible in a muted color (`text-text-muted`) for context
  - Scroll position set to the cited passage section

**Rachel's mental confirmation:** "Yes — the AI took this from Page 3, and I can read the full paragraph."

---

### Step 6.4 — Text / Web / VTT Citation View

**Context:** Citation comes from a plain text, web, or VTT source.

**Panel Layout (identical structure):**
- Header: source type icon + title + close
- Metadata: `Passage N of M • [Type]` 
- Content area: full text with highlighted passage block
- For Web: shows URL with external link icon
- For VTT: shows timestamp in metadata (e.g., `at 2:35`)

---

### Step 6.5 — YouTube Citation View (Unchanged)

**Context:** Citation from YouTube source.

**Panel Layout:**
- Header: YouTube icon + video title + close
- YouTube iframe embed seeked to `timestampStart` seconds, autoplay
- Caption: "Video seeked to [X]s — [timestamp formatted]"
- External link to original video URL

> YouTube preview unchanged — embed already provides best UX for video timestamps.

---

### Step 6.6 — Multiple Citations — Panel Switching

**Context:** Response has `[1]` `[2]` `[3]` from 3 different sources.

**Interaction:**
1. Rachel clicks `[1]` → PDF panel opens
2. Rachel clicks `[2]` (in same message) → panel updates with new source, smooth content transition
3. Panel header updates to new source title with a brief slide animation
4. Close (X) → panel collapses, no source selected

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Citation text is empty/fallback | Show "Passage excerpt referenced by AI answer" placeholder |
| Source was deleted after indexing | Panel shows "Source no longer available" with source title |
| Very long passage | Highlighted section visible in scroll area, context above/below visible |
| Multiple citations same source | Each click shows the specific passage for that citation number |

---

## Pages Introduced / Modified

| Page | Change |
|------|--------|
| Center Chat Panel | Citation pills, streaming answer, click handler |
| Right Preview Panel | Full source view with passage highlight, chunk metadata |

---

## Design Notes

- The highlight must be visually strong — `bg-accent/20 border-l-2 border-accent` satisfies both light and dark mode
- Passage context (text above/below highlight) should be visually de-emphasized but readable
- "Passage N of M" gives Rachel a sense of document density — knowing there are 7 chunks in a paper feels informative
- Panel animation should feel snappy (300ms max) — not block Rachel's workflow
