---
title: 'Story 2.3: Multi-Modal Content Extractors & Markdown Normalization'
type: 'feature'
created: '2026-09-07'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-Contextual-2026-09-06/ARCHITECTURE-SPINE.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Ingested research content comes in heterogeneous formats (PDF, Web, Subtitles, YouTube, Text) and must be normalized into structured Markdown with provenance anchors (`<!-- page: N -->` and `<!-- time: mm:ss -->`) for precise chunking and showcase highlighting.
**Approach:** Implement multi-modal extractors:
- PDF: page-by-page extraction outputting `<!-- page: N -->` markers and cleaning ephemeral binaries.
- Web: Firecrawl API scraping returning sanitized Markdown.
- YouTube: Keyless subtitle parsing into `<!-- time: mm:ss -->` markers, failing with "No captions found for this video" if absent.
- Subtitles (.srt/.vtt): Regex-based parser converting timestamps into `<!-- time: mm:ss -->` dialogue blocks.
- Text: Standardized Markdown normalization.

## Boundaries & Constraints

**Always:**
- PDF content MUST include `<!-- page: N -->` anchors for each page.
- YouTube and subtitle transcripts MUST include `<!-- time: mm:ss -->` anchors.
- YouTube extraction with no captions MUST fail with `"No captions found for this video"`.
- Ephemeral binary MUST be deleted after PDF extraction.

**Never:**
- Never drop timestamp or page metadata during normalization.
- Never output unescaped HTML or corrupted markdown.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Multi-page PDF | PDF content with page blocks | Markdown with `<!-- page: 1 -->`, `<!-- page: 2 -->` | Ingestion failure if unparseable |
| Subtitle .srt | SRT file with `00:01:23,000 --> 00:01:26,000` | Markdown with `<!-- time: 01:23 -->` dialogue | Skips malformed blocks |
| Subtitle .vtt | VTT file with `00:02:45.000 --> 00:02:48.000` | Markdown with `<!-- time: 02:45 -->` dialogue | Handles WEBVTT header cleanly |
| YouTube No Captions | Video URL with disabled captions | Throws "No captions found for this video" | Transitions to failed with error reason |
| Raw Text | Unstructured markdown or text | Clean sanitized Markdown | Default fallback to trimmed text |

</intent-contract>

## Code Map

- `backend/src/contexts/ingestion/extractors/subtitle-extractor.ts` -- regex parser for `.srt` and `.vtt`.
- `backend/src/contexts/ingestion/extractors/pdf-extractor.ts` -- page-anchored PDF parser and binary cleanup.
- `backend/src/contexts/ingestion/extractors/youtube-extractor.ts` -- keyless caption parser with timestamp anchors.
- `backend/src/contexts/ingestion/extractors/text-extractor.ts` -- Markdown normalization.
- `backend/src/contexts/ingestion/extractors/index.ts` -- unified multi-modal extraction facade.
- `backend/src/contexts/ingestion/__tests__/extractors.test.ts` -- comprehensive unit tests for all 5 extractors.

## Tasks & Acceptance

**Execution:**
- Implement all extractors in `backend/src/contexts/ingestion/extractors/`.
- Wire extractors into `IngestionService.loadContent`.
- Verify with unit tests in `backend/src/contexts/ingestion/__tests__/extractors.test.ts`.
