# Scenario 09: Developer Portfolio Inspection (Devon's Journey)

**Created:** 2026-07-25  
**Phase:** 4 — UX Scenarios  
**Persona:** Devon (Primary)  
**Status:** Outlined  

---

## Scenario Summary

Devon arrives at chaibookLM's landing page as a portfolio reviewer or technical evaluator. He moves from landing → demo → signup → dashboard → workspace, specifically looking for architectural clarity, real-time status transparency, and production-grade UI design. This is Devon's end-to-end journey.

---

## Trigger

- **Devon:** "I want to evaluate this RAG portfolio project. Is it actually production-grade or just a tutorial?"

**Emotional State at Entry:** Critical, evaluative — high standards for cleanliness and architecture.

---

## Sunshine Path

### Step 9.1 — Landing Page: First Impression

**Context:** Devon arrives at `/` (unauthenticated).

**What Devon evaluates:**
- Headline readability and technical accuracy: "Turn any source into an answer." ✓
- Live interactive mini-demo — does it actually work? Does it show real indexing animation?
- Design system quality: fonts, color palette, spacing — is this template or custom?
- Feature list: does it call out the technical stack (Next.js, Qdrant, Clerk, vector embeddings)?
- Performance: is the page fast, animations smooth?

**Emotional Design Goal:** Impress within 5 seconds — Devon should think "This is actually good."

---

### Step 9.2 — Live Mini-Demo Card

**Context:** Devon interacts with the landing page live demo.

**Demo Card Elements:**
- Source indexing animation: file added → yellow pulse → green settle (real CSS, not fake)
- Example question pre-typed or typed live
- Answer streams in with citation pills visible
- Demo is clearly labeled as a demo but feels real

**Devon's evaluation:** "The status animation is clean. The citation pill UX is thoughtful. They understand RAG."

---

### Step 9.3 — Sign Up (Clerk)

**Context:** Devon clicks "Get Started" — goes to `/sign-up`.

**What Devon notices:**
- Clerk auth component styled with the app's design tokens (not default Clerk zinc palette)
- Brand colors on input focus, button, header
- Redirects correctly to `/dashboard` after signup

---

### Step 9.4 — Dashboard: Portfolio Evaluation

**Context:** Devon arrives at `/dashboard` (empty state — first visit).

**What Devon notices:**
- Empty state design: is it thoughtful or just a blank page?
- Gradient-signature border on "New Notebook" card — calls out the signature design motif
- Grid layout: clean, proper spacing
- No navbar marketing links visible (workspace-only layout) ✓

**Devon creates a notebook:** "chaiRAG Architecture Test"

---

### Step 9.5 — Workspace: Upload Sources

**Context:** Devon uploads 2 sources to test the RAG pipeline.

1. Uploads a PDF (technical paper or architecture doc)
2. Adds a YouTube URL (tech talk)

**What Devon watches:**
- Status dots: correctly transition yellow pulse → green settle
- Toast notification: "✨ Indexing complete!" — appears and auto-dismisses
- Capacity bar in sidebar: updates correctly
- No silent failures, no console errors visible in UI

---

### Step 9.6 — Technical RAG Query

**Context:** Devon asks a technically-oriented question.

**Example question:** "What are the key architectural decisions in this RAG implementation and how does the chunking strategy affect retrieval quality?"

**Devon evaluates:**
- Does the answer cite sources accurately?
- Are citation pills styled correctly (small, inline, not ugly)?
- Does streaming work smoothly?
- Does clicking a citation open the right panel correctly?

---

### Step 9.7 — Citation Panel Inspection

**Context:** Devon clicks `[1]` on the PDF citation.

**What Devon inspects:**
- Panel slides in cleanly (300ms animation)
- Source content shown with highlighted passage
- Metadata: "Passage 2 of 9 • Page 3 • PDF" — confirms chunking is real, not fake
- Design: panel fits the 3-column layout without breaking the workspace
- Closing X works correctly

**Devon's final evaluation:** "The citation UX is legitimately well-thought-out. This is a real product-grade implementation."

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Devon tries to break the upload | File size limit error shown clearly |
| Devon inspects network tab | API routes are clean, headers meaningful (`X-Citations-Json`) |
| Devon views on a smaller screen | Responsive layout holds (sidebar may collapse) |
| Devon opens the GitHub repo | Code matches what the UI demonstrates |

---

## Pages Involved

| Page | Devon's Lens |
|------|-------------|
| Landing | First impression: design quality + technical credibility |
| Sign Up | Auth integration quality |
| Dashboard | Empty state design, notebook creation |
| Workspace | Full RAG pipeline: upload → index → query → cite |
| Preview Panel | Citation UX depth and accuracy |

---

## Design Notes

- Devon's journey spans 7 pages — every screen must maintain design system consistency
- Devon's "silent failure" fear means every async operation needs clear visual feedback
- The workspace header showing "← Dashboard" link is important for Devon's navigation clarity
- Devon will inspect dev tools: API responses should be clean and well-structured
- The gradient-signature motif should feel intentional, not random — Devon notices design patterns
