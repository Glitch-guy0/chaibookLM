# Scenario 07: Notebook Management (Create / Rename / Delete)

**Created:** 2026-07-25  
**Phase:** 4 — UX Scenarios  
**Persona:** Rachel (Primary)  
**Status:** Outlined  

---

## Scenario Summary

Rachel manages multiple research projects by creating, naming, and deleting notebooks from the Dashboard. Each notebook is an isolated workspace — creating a new one is her starting ritual for each new research project.

---

## Trigger

- **Rachel:** "I need a new notebook for my AI safety paper — separate from my climate research."

**Emotional State at Entry:** Organized, purposeful — building a system for her research.

---

## Sunshine Path

### Step 7.1 — Dashboard: Notebook Grid

**Context:** Rachel arrives at `/dashboard` after login.

**Page Elements:**
- Grid: 4 columns (desktop), 2-col (tablet), 1-col (mobile)
- Each notebook card: colored swatch/thumbnail, title, source count, "last edited" date, status summary
- **Empty state (no notebooks):** Friendly illustration, headline "Start your first notebook", CTA button with gradient-signature border
- **"New Notebook" card:** Always appears as first or last item in grid — styled with gradient-signature border animation to draw attention

---

### Step 7.2 — Create Notebook Dialog

**Context:** Rachel clicks "New Notebook" card or "+ New Notebook" button.

**Interaction:**
1. Modal/dialog opens (centered, backdrop blur)
2. Input field: "Notebook title" (auto-focused)
3. Optional: color picker for card swatch (3-4 preset brand colors)
4. [Cancel] [Create Notebook] buttons
5. On create → modal closes, new notebook card appears in grid with fade-in
6. Auto-navigate to the new notebook workspace (empty state, no sources)

**Validation:**
- Empty title → button disabled, placeholder text "Give your notebook a name"
- Title too long (>80 chars) → inline truncation warning

---

### Step 7.3 — Notebook Workspace — Empty State

**Context:** Rachel just created a fresh notebook and lands in the workspace.

**Page Elements (Center Panel — Empty State):**
- Bot icon in gradient-signature rounded container
- Headline: "Ask anything about your sources"
- Subtitle: "Add a source from the left sidebar to enable grounded Q&A."
- Left sidebar: "Add Source" button prominent, source list empty with friendly placeholder

**Design Note:** The empty state is an onboarding moment — it should feel welcoming, not broken.

---

### Step 7.4 — Rename Notebook

**Context:** Rachel wants to rename a notebook from the Dashboard.

**Interaction Options:**
1. Three-dot menu on notebook card → "Rename" option
2. Click notebook title on card → enters inline edit mode
3. Title input appears in-place, auto-selected text, [✓] [✕] commit/cancel buttons
4. On commit → card updates title with a brief scale animation

---

### Step 7.5 — Delete Notebook

**Context:** Rachel wants to remove a notebook she no longer needs.

**Interaction:**
1. Three-dot menu on notebook card → "Delete" (red/destructive)
2. Confirmation dialog: "Delete '[Notebook Title]'? All sources and chat history will be permanently removed."
3. [Cancel] [Delete Permanently] (destructive red button)
4. On confirm → card fades and shrinks out of grid; Qdrant collection purged

**Emotional Design Goal:** Safety — deletion is irreversible, so the UI must clearly communicate consequence without being annoying.

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No notebooks yet | Empty state with strong CTA |
| Duplicate notebook names | Allowed (no enforcement) — title is cosmetic |
| Network error on create | Optimistic UI rolls back; error toast |
| Delete notebook with many sources | Warning in dialog mentions source count |

---

## Pages Introduced / Modified

| Page | Change |
|------|--------|
| Dashboard | New Notebook card, grid, empty state |
| Create Notebook Dialog | Modal form |
| Workspace — Empty State | Already exists, confirm it covers this scenario |

---

## Design Notes

- Notebook card color swatches make the grid scannable at a glance
- The "New Notebook" card should feel inviting — gradient-signature border is perfect here
- Inline rename avoids modal overhead for a simple action
- Deletion modal must use the semantic `error` color for the confirm button
