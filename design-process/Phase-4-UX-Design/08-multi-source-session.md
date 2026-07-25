# Scenario 08: Multi-Source Research Session (Power User)

**Created:** 2026-07-25  
**Phase:** 4 — UX Scenarios  
**Persona:** Rachel (Primary)  
**Status:** Outlined  

---

## Scenario Summary

Rachel's core workflow: she has 5+ sources indexed across different formats (PDF paper, YouTube lecture, web article, VTT transcript) and asks a complex question that synthesizes across all of them. The AI response cites multiple sources in a single answer, and Rachel verifies each one in sequence.

---

## Trigger

- **Rachel:** "I need an answer that draws from all my sources at once — not just one document."

**Emotional State at Entry:** In flow state — deep research, high expectations.

---

## Sunshine Path

### Step 8.1 — Workspace with Multiple Sources Ready

**Context:** Rachel has 5 sources all in "ready" (green dot) state in the left sidebar.

**Left Sidebar State:**
- 5 source items: PDF (research paper), YouTube (lecture), Web URL (article), VTT (podcast transcript), Text (notes)
- All green dots — no animation (settled/ready)
- Sidebar capacity bar: e.g., `[████░] 23MB / 50MB`
- "Add Source" still accessible for additional sources

**Emotional Design Goal:** Abundance — Rachel has her research collection assembled and feels ready.

---

### Step 8.2 — Cross-Source Query

**Context:** Rachel types a complex multi-part question into the chat input.

**Query Example:** "What are the main arguments for and against the proposed regulation, and how do the academic and practical perspectives differ?"

**Chat Input Behavior:**
- Textarea auto-expands as Rachel types longer question (max-h-32 clamp)
- Send button active (not disabled)
- Send → user message appears right-aligned with avatar

---

### Step 8.3 — Streaming Multi-Citation Answer

**Context:** The RAG pipeline retrieves top-5 chunks across all 5 sources and streams an answer.

**Center Panel State During Streaming:**
- AI response card appears immediately (left-aligned, `gradient-signature` bot icon)
- Text streams in word by word
- Blinking cursor at end of stream
- Citation pills appear inline as the answer references them: `[1]` `[2]` `[3]` `[4]`
- Each pill clickable but slightly muted during streaming (disabled cursor)
- Once streaming completes: pills become fully interactive (hover scale, cursor pointer)

**Typical response structure:**
```
The academic literature [1][2] argues... while practitioners report [3]... 
The podcast transcript suggests [4] a more nuanced view...
```

---

### Step 8.4 — Sequential Citation Verification

**Context:** Rachel clicks each citation to verify the sources.

**Flow:**
1. Click `[1]` → Right panel opens → PDF paper excerpt highlighted
2. Click `[2]` → Right panel updates → Different section of PDF highlighted
3. Click `[3]` → Right panel updates → YouTube embed at timestamp
4. Click `[4]` → Right panel updates → VTT transcript passage highlighted
5. Rachel reads each, closes panel, continues with follow-up question

**Panel Behavior:**
- Each new citation click smoothly replaces panel content (no close/reopen)
- Source type icon in panel header updates to match new source type
- Title updates with brief animation

---

### Step 8.5 — Follow-Up Question (Conversational Context)

**Context:** Rachel asks a follow-up based on what she just read.

**Chat behavior:**
- Chat thread persists above — Rachel can scroll up to see earlier messages
- New question → new grounded answer (RAG reruns with new question embedding)
- New citations added below previous messages
- Thread grows naturally — not cleared between questions

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No relevant chunks found | AI answers from general knowledge with a note: "No specific source passages were retrieved for this question." |
| Only 1 source indexed | All citations `[1]` reference same source — still works correctly |
| 5+ citation pills in one answer | Scroll horizontally if needed (rare — usually 2-4 max) |
| Right panel open while new question asked | Panel stays open; next answer stream appears; panel closes only on X or new citation click |

---

## Pages Introduced / Modified

| Page | Change |
|------|--------|
| Workspace — Center Chat Panel | Multi-citation streaming, follow-up questions |
| Workspace — Right Preview Panel | Source switching without close/reopen |

---

## Design Notes

- The key design tension: having 4 citation pills in one response without it feeling overwhelming
- Pills must be compact (small, inline, not block elements) so prose flow isn't disrupted
- Right panel switching animation should feel fluid — content swap not panel rebuild
- The "power user" session is the moment that most strongly validates the product's core value
