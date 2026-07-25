# Scenario 05: Source Management & Status Monitoring

**Created:** 2026-07-25  
**Phase:** 4 — UX Scenarios  
**Persona:** Devon (Primary), Rachel (Secondary)  
**Status:** Outlined  

---

## Scenario Summary

Devon uploads a file and watches real-time status feedback. Rachel checks which of her sources finished indexing before starting Q&A. Both need confident visual feedback that the system is working — and control over what's in the notebook.

---

## Trigger

- **Devon:** "Is this RAG pipeline actually working transparently? Let me watch it process."
- **Rachel:** "I uploaded 3 files — how do I know which ones are ready to query?"

**Emotional State at Entry:** Curious / mildly anxious (do I trust this system?)

---

## Sunshine Path

### Step 5.1 — Source List (Left Sidebar — Workspace)

**Context:** User is in the Notebook Workspace with the left sidebar visible.

**Page Elements:**
- Source list with per-item status indicator dots
- Status dot states:
  - `uploading` → grey/faded pulse (loading state)  
  - `indexing` → **yellow pulse** (`animate-indexing` CSS animation, warning hue)
  - `ready` → **green settled dot** (success hue, no animation)
  - `failed` → red dot with retry option
- Source item shows: icon (type-specific), title, file size, status label
- "Add Source" button at top of sidebar

**Emotional Design Goal:** Reassurance — user sees the system is actively working

---

### Step 5.2 — Status Transition (Animated)

**Context:** User watches a source complete indexing.

**Visual Sequence:**
1. Yellow pulsing dot with "Indexing…" label
2. → System completes embedding and vector storage
3. → Dot settles to solid green; label changes to "Ready"
4. → Toast notification floats in top-right: "✨ '[Source Title]' indexing complete! Ready for Q&A."
5. → Recently indexed source briefly glows (gradient border pulse) to draw attention

**Emotional Design Goal:** Delight — the system rewards patience with a clear "done!" moment

---

### Step 5.3 — Source Detail & Capacity Meter

**Context:** User wants to see notebook storage usage.

**Page Elements:**
- Sidebar footer: compact capacity bar `[███░░] 12MB / 50MB`
- Per-source: file size badge shown on hover
- Tooltip on capacity bar: "12MB used of 50MB notebook limit"

**Constraints shown in UI:**
- If capacity > 80%: bar turns warning-yellow
- If capacity at limit: "Add Source" button disabled with tooltip explaining limit

---

### Step 5.4 — Source Deletion

**Context:** User wants to remove a source from the notebook.

**Interaction Flow:**
1. User hovers source item → Delete icon appears (trash, right-aligned)
2. User clicks delete → Confirmation inline micro-dialog: "Remove '[Title]'? This cannot be undone." + [Cancel] [Remove] buttons
3. On confirm → source fades out, list compresses; capacity bar updates
4. System also removes source vectors from Qdrant collection

**Emotional Design Goal:** Control — user trusts the system respects their decisions

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Upload fails mid-stream | Status → `failed`, red dot, "Retry" button |
| File exceeds 5MB | Immediate error toast before upload starts |
| Notebook at 50MB capacity | "Add Source" disabled, tooltip explains limit |
| Source stuck in `indexing` > 2min | System marks `ready` as fallback (current behavior) |

---

## Pages Introduced / Modified

| Page | Change |
|------|--------|
| Notebook Workspace — Left Sidebar | Status dots, capacity bar, delete interaction |
| Toast Notification | Indexing complete feedback |

---

## Design Notes

- Status animations must be performant (CSS-only, no JS timer)
- Deletion must be reversible or clearly destructive — use strong warning language
- Capacity bar should not alarm users unnecessarily — only warn at 80%+
