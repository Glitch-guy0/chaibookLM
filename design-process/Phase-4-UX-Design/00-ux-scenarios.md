# UX Scenarios: chaibookLM

> Design experiences, not screens — every page serves a user with a goal and an emotion.

**Created:** 2026-07-25  
**Updated:** 2026-07-25 (Milestone 2 — 5 additional scenarios)
**Phase:** 4 (UX Design)  
**Agents:** Saga (Scenario Outline), Freya (Page Specifications)  

---

## Scenario Index

| # | Scenario | Persona | Key Pages | Status |
|---|----------|---------|-----------|--------|
| 01 | [Landing Page Journey](file:///Users/prajwal/Documents/learning/chaibookLM/design-process/Phase-4-UX-Design/02-page-specs.md) | Devon | Landing Page | `built` |
| 02 | [Authentication (Sign In / Sign Up)](file:///Users/prajwal/Documents/learning/chaibookLM/design-process/Phase-4-UX-Design/02-page-specs.md) | Both | Clerk Auth | `built` |
| 03 | [Notebooks Dashboard](file:///Users/prajwal/Documents/learning/chaibookLM/design-process/Phase-4-UX-Design/02-page-specs.md) | Rachel | Dashboard Grid | `built` |
| 04 | [Notebook Workspace (Core)](file:///Users/prajwal/Documents/learning/chaibookLM/design-process/Phase-4-UX-Design/02-page-specs.md) | Both | 3-Column Workspace | `built` |
| 05 | [Source Management & Status Monitoring](file:///Users/prajwal/Documents/learning/chaibookLM/design-process/Phase-4-UX-Design/05-source-management.md) | Devon + Rachel | Left Sidebar, Status Dots | `outlined` |
| 06 | [Citation Verification & Source Preview](file:///Users/prajwal/Documents/learning/chaibookLM/design-process/Phase-4-UX-Design/06-citation-verification.md) | Rachel | Chat Panel, Right Preview Panel | `outlined` |
| 07 | [Notebook Management (Create / Rename / Delete)](file:///Users/prajwal/Documents/learning/chaibookLM/design-process/Phase-4-UX-Design/07-notebook-management.md) | Rachel | Dashboard, Create Dialog | `outlined` |
| 08 | [Multi-Source Research Session](file:///Users/prajwal/Documents/learning/chaibookLM/design-process/Phase-4-UX-Design/08-multi-source-session.md) | Rachel | Full Workspace (Power User) | `outlined` |
| 09 | [Developer Portfolio Inspection](file:///Users/prajwal/Documents/learning/chaibookLM/design-process/Phase-4-UX-Design/09-developer-inspection.md) | Devon | End-to-End Product Tour | `outlined` |

---

## Coverage Matrix

| Feature | Scenario(s) | Persona |
|---------|-------------|---------|
| Multi-format source ingestion | 05, 08, 09 | Both |
| Status dot animations (yellow → green) | 05, 09 | Devon |
| Notebook capacity meter | 05 | Devon |
| Source deletion | 05 | Both |
| Inline citation pills `[N]` | 06, 08, 09 | Rachel |
| PDF citation preview with highlighted passage | 06, 08 | Rachel |
| YouTube timestamped embed | 06, 08 | Rachel |
| Text/VTT/Web passage highlight | 06, 08 | Rachel |
| Chunk position metadata (Passage N of M) | 06 | Rachel |
| Notebook create / rename / delete | 07, 09 | Rachel |
| Dashboard empty state | 07, 09 | Both |
| Multi-source cross-synthesis query | 08 | Rachel |
| Workspace header (no marketing nav) | 09 | Devon |
| Landing live demo | 09 | Devon |

---

## Design Principles Applied

1. **Sunshine paths first** — each scenario covers the happy path before edge cases
2. **Emotional beats** — every major step notes the target user emotion
3. **Feature Impact Matrix alignment** — scenarios directly address P1 drivers from Trigger Map
4. **Rachel's fear of hallucination** → resolved by Scenarios 06 & 08 (citation verification)
5. **Devon's disgust with silent failures** → resolved by Scenario 05 & 09 (status transparency)

---

_Created using Whiteport Design Studio (WDS) methodology_
