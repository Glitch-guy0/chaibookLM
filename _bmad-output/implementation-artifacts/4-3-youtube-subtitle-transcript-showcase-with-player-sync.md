---
title: 'Story 4.3: YouTube & Subtitle Transcript Showcase with Player Sync'
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

**Problem:** When AI cites a video or subtitle file, researchers need to immediately hear and see the assertion in context without manually scrubbing through long media.
**Approach:** Build a YouTube and Subtitle Transcript Showcase viewer that seeks the embedded video player directly to `timestampSeconds`, auto-scrolls the dialogue transcript list to the matching line, highlights the cited cue in cyan with bold monospace timestamp label (e.g. `[18:42]`), and enables clicking any cue to jump the player.

## Boundaries & Constraints

**Always:**
- Embedded player seeks directly to cited `timestampSeconds`.
- Transcript list auto-scrolls to the matching dialogue cue.
- Cited transcript cue is highlighted in cyan with bold monospace timestamp label (e.g. `[18:42]`).
- Clicking any transcript cue seeks video to that timestamp.
- Subtitle (`transcript`) sources without YouTube URL display full dialogue with timestamps.

**Never:**
- Never block rendering if video embed is restricted (show transcript fallback).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| YouTube Citation Click | `timestampSeconds = 1122` | Player seeks to 18:42, transcript auto-scrolls to cue | Formats time mm:ss / hh:mm:ss |
| Transcript Cue Click | Click cue at `05:10` | Seeks player to 310s, updates active highlight | Syncs state |
| Subtitle File Source | type: transcript | Renders transcript list with seekable cues | Fallback audio/text view |
| No Timestamps Available | Source without anchors | Renders raw dialogue lines cleanly | Graceful degradation |

</intent-contract>

## Code Map

- `components/notebooks/showcase/youtube-showcase.tsx` -- YouTube player and synced transcript component.
- `components/notebooks/showcase/transcript-showcase.tsx` -- Subtitle dialogue reader component.
- `components/notebooks/showcase/youtube-showcase.test.tsx` -- Unit tests for YouTube and transcript showcase.

## Tasks & Acceptance

**Execution:**
- [x] Implement `<YouTubeShowcase>` with player embed and timestamp seek.
- [x] Implement synchronized autoscrolling transcript list with cyan highlight on active cue.
- [x] Implement `<TranscriptShowcase>` for standalone subtitle files.
- [x] Add unit tests in `youtube-showcase.test.tsx`.

## Auto Run Result

- Status: done
- Implemented `YouTubeShowcase` with player embed seeking to cited `timestampSeconds`.
- Synchronized autoscrolling transcript list highlighting active dialogue line in cyan with bold monospace timestamp label (e.g. `[18:42]`).
- Implemented `TranscriptShowcase` for subtitle dialogue files.
- Verified via `components/notebooks/showcase/youtube-showcase.test.tsx`.
