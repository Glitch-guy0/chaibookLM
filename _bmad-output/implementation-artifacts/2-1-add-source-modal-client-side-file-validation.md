---
title: 'Story 2.1: Add Source Modal & Client-Side File Validation'
type: 'feature'
created: '2026-09-07'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/EXPERIENCE.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Users need to intake sources across 5 modalities (`Text`, `Web URL`, `PDF Dropzone`, `Transcript (.srt/.vtt)`, `YouTube URL`) with immediate client-side limits and quota protection.
**Approach:** Upgrade `<UploadDialog>` / `<AddSourceModal>` to 5 tabs with drag-and-drop file validation (PDF ≤ 10MB, Transcript ≤ 5MB), YouTube URL parsing, 10-source notebook cap protection, and support `POST /api/sources` / `POST /api/notebooks/[id]/sources` dispatching `source.ingest` Inngest events with status `queued` in < 200ms.

## Boundaries & Constraints

**Always:**
- 5 tabs: `Text`, `Web URL`, `PDF Dropzone`, `Transcript (.srt/.vtt)`, `YouTube URL`.
- Client limits: PDF rejected if > 10MB; Transcript rejected if > 5MB.
- Quota warning if notebook source count ≥ 10.
- `POST /api/sources` returns HTTP 201 with status `queued` and dispatches Inngest event.

**Never:**
- Never accept unvalidated files or unparseable URLs.
- Never exceed 10 sources per notebook.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| PDF upload > 10MB | File with size 11MB selected | Upload blocked immediately | Inline error: "PDF exceeds 10MB limit" |
| Transcript > 5MB | `.srt` file > 5MB selected | Upload blocked immediately | Inline error: "Transcript exceeds 5MB limit" |
| YouTube URL Invalid | "http://example.com" | Submit blocked | Inline error: "Invalid YouTube URL" |
| Notebook cap reached | Notebook with 10 sources | Modal shows quota notice | Submissions disabled |
| Valid submission | Valid text, url, pdf, transcript, or youtube | POST /api/sources returns 201 | Source added, dialog closed |

</intent-contract>

## Code Map

- `components/sources/upload-dialog.tsx` -- 5-tab intake modal with validation and quota warnings.
- `components/notebooks/api.ts` -- client API functions for all 5 modalities.
- `app/api/sources/route.ts` -- generic POST endpoint for source creation.
- `app/api/notebooks/[id]/sources/route.ts` -- notebook source creation route.
- `backend/src/shared-kernel/types.ts` -- update `Source.type` to `'text' | 'web' | 'pdf' | 'transcript' | 'youtube'`.
- `backend/src/contexts/sources/index.ts` -- support multi-modal source creation.

## Tasks & Acceptance

**Execution:**
- Update `backend/src/shared-kernel/types.ts` for all 5 source types.
- Update `components/notebooks/api.ts` to include multi-modal source creation.
- Update `components/sources/upload-dialog.tsx` with 5 tabs, client file validation, and quota alert.
- Create `app/api/sources/route.ts` and ensure Inngest event dispatch on source creation.
- Verify tests in `components/sources/upload-dialog.test.tsx` and API tests.
