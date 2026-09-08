# Contextual — Design System Implementation Handoff

**From:** Sally 🎨 (UX Designer) · **For:** Prajwal (Developer) · **Date:** 2026-09-08
**Status:** Hands-off contract. Build/verify to this document — do not reinterpret the design.

**Design authority (conflict order):**
1. `_bmad-output/planning-artifacts/ux-designs/ux-Contextual-2026-09-06/DESIGN.md` — visual tokens
2. `.../EXPERIENCE.md` — behavior, states, microcopy
3. `docs/design-system.md` — condensed intent (this repo)
4. Mockups under `ux-designs/.../mockups/` — reference only; **DESIGN/EXPERIENCE win on any conflict**

**Token source of truth:** `app/globals.css`. Never hardcode a hex in a component when a token exists.

---

## 1. What this branch already did (context — do not redo)

Branch `refactor/complete-workflow-changes` re-aligns the UI to DESIGN.md. Already in the working tree:

- **Token unification** (`app/globals.css`): the old warm-brown dark palette (`#16130D`, `#F5F0E8`, `#FF864F`…) was replaced with the canonical DESIGN.md dark palette (`#0D0D0D` canvas, `#18181B` surface, `#FFFFFF` ink, `#FACC15` brand, `#22D3EE` cite, `#E4E4E7` border). `@theme` `-dark` mirrors now match the `.dark {}` block.
- **`[data-theme="dark"]` selector added** alongside `.dark` so the attribute set by the inline boot script in `app/layout.tsx` activates tokens even before/without the class.
- **Workspace restructure** (`components/notebooks/workspace.tsx`): full-width ExpirationBanner → breadcrumb topbar (`← Notebooks / title`, tablet drawer trigger, disabled "Share · soon") → tri-pane `25% / 45% / 30%` with `pane-head` / `pane-scroll` structure, matching `mockup-workspace-desktop.html`.
- **Canonical component CSS** added to `globals.css`: `.src-item`, `.src-row`, `.src-icon`, `.status`, `.badge`, `.expire`, `.credit`, `.refusal`, `.msg-user`, `.msg-ai`, `.pill`, `.dot.*`, `.orb`, orbit/pulse keyframes with reduced-motion kills.
- **SourceCard, RefusalCard, CreditBadge, NotebookCard/Grid, all five Showcase readers** re-skinned to the canonical classes.

## 2. Canonical tokens (verify these exact values)

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#F4F4F0` | `#0D0D0D` |
| `--surface` | `#FFFFFF` | `#18181B` |
| `--fg` (ink) | `#111111` | `#FFFFFF` |
| `--muted` | `#555555` | `#A1A1AA` |
| `--border` | `#111111` | `#E4E4E7` |
| `--accent` | `#FFE500` | `#FACC15` |
| `--citation` | `#00E5FF` | `#22D3EE` |
| `--danger` / `--success` | `#FF3333` / `#00E575` | same |
| `--color-ink-muted` | `#777777` | `#71717A` |

Shadows: zero blur, solid offset — card `4px 4px 0 0`, dialog `8px 8px 0 0`, badge `3px 3px 0 0`. Buttons/cards lift on hover (`6px`, `translate(-2px,-2px)`), collapse on press (`0`, `translate(4px,4px)`). Radii: 2px default, 4px md, 9999px **only** the credit pill.

## 3. Developer tasks (do these — they are the remaining work)

### T1 — Fix CreditBadge warning-state contrast (real bug, dark mode)
`components/ui/credit-badge.tsx` warn state uses `text-[var(--fg,#111111)]` on `bg-[var(--accent)]`. In dark mode that is **white `#FFFFFF` on `#FACC15` ≈ 1.5:1 — fails hard**.
**Fix:** pin the ink: `text-[#111111]` in **both** themes (yellow keeps dark ink in both themes — this inversion is sanctioned by DESIGN.md, same as `.msg-user` and `.badge.yellow`, which already do it correctly). Do the same audit for any other `var(--fg)`-on-accent pairing.

### T2 — Refresh the contrast test to the new tokens
`app/design-system.contrast.test.ts` still carries the **old** hex constants (`#16130D`, `#7A7263`, `#FF864F`, …). Update the constants to §2 values, then:
- Keep `it.fails` for `ink-muted-dark (#71717A) on surface-dark (#18181B)` — it still computes ≈ **3.67:1** (< 4.5). Update the comment's ratio.
- **Replace** the `it.fails` "ink-dark on brand-dark" test: that pairing no longer exists in components (accent fills now carry fixed `#111111` ink). Assert the real pair instead: `#111111 on #FACC15` ≥ 4.5:1 (≈ 12.3:1), and add `#111111 on #FFE500` for light.

### T3 — Sweep for stale hardcoded hexes
Grep components for `#16130D|#F5F0E8|#FF864F|#4A9EFF|#201C14|#7A7263` — all hits are stale-palette leftovers and must switch to tokens. (The cyan highlight in `pdf-showcase.tsx` uses literal `#00E5FF`; acceptable only because it must stay cyan in both themes — prefer `var(--citation)` anyway.)

### T4 — Standard verification gates
1. `npm run typecheck` — clean.
2. `npm run test` — contrast suite green (with the two intentional `it.fails` semantics preserved/updated per T2).
3. `npm run lint` — clean.
4. `npm run build` — succeeds.
5. `graphify update .` (repo rule after code changes).
6. Hand off to `ux-verification-checklist-light-dark.md` (sibling doc) and walk it in a real browser.

## 4. Component contract (what "correct" looks like)

- **Button** — 2px ink border, elevation flow 4→6→0px shadow; keyboard Enter/Space fires the same pressed transform; disabled = opacity 0.45, no translate; reduced-motion = no translate, thick underline/`--shadow-elevated` instead.
- **CitationChip** — cyan fill, Space Mono 11px bold, 1.5px border, 2px radius, **never slanted**; hover tooltip `source • page/timestamp`; click → Showcase (desktop focuses pane; mobile flips tab + shows `← Back to Chat`). Known deferred gap: 20×20px touch target (do not "fix" silently — tracked).
- **SourceCard** — status machine `queued`(gray dot) → `processing`(orb spin + accent border + orbiting shadow) → `ready`(green pulse) → `failed`(red border, reason tooltip, Retry). Dot + text label always; color never the only channel. `aria-live` announces **only** `ready`/`failed` transitions.
- **CreditBadge** — mono pill `⚡ N/10`; warn ≤2 accent bg; locked 0 = `--danger-deep` bg + white text + 🔒; click opens the credits Dialog (focus trap, Esc closes, focus returns).
- **RefusalCard** — ink border, ⚠ marker, exact microcopy "The uploaded sources do not specify the requested information." + "Search the live web via Tavily? (Consumes 1 credit)"; button disabled at 0 credits with reset notice.
- **Showcase readers** (PDF/Web/YouTube/Transcript/Text) — cyan proof highlight ~2.5s; PDF `[`/`]` page keys; header "Page X of Y"; empty state copy per EXPERIENCE.md.
- **Chat** — user msg = yellow block, dark ink text, right-of-stream styling per `.msg-user`; assistant = open markdown (`react-markdown`), no border; Enter sends / Shift+Enter newline; composer disabled while streaming or 0 credits.

## 5. Hard guardrails (anti-patterns — reject in review)

1. No gradients, no blur shadows, no radius > 4px (except credit pill).
2. Max one solid primary CTA per viewport.
3. Never `color: var(--muted)` on hover — move bg/border/shadow instead.
4. Cyan **only** for verification affordances; yellow for primary/warning; green ready; red destructive.
5. Space Mono for display/badges/status; Inter for body. Never Inter as display.
6. No emoji as functional icons (status glyphs ⚡/🔒/⚠ in sanctioned microcopy are the exception).
7. No hover-only affordances on touch; no stacked modals; no infinite scroll.
8. Every focusable element shows the 3px `--citation` focus ring (inverted to surface on ink/brand fills).

## 6. Accessibility floor (per-theme, both must pass)

- Normal text ≥ 4.5:1, large text/dots ≥ 3:1 against their actual surface.
- Known accepted deferral: `--color-ink-muted-dark` ≈ 3.67:1 on `--color-surface-dark` — tracked in `docs/deferred-work.md`; do not silently change tokens.
- `prefers-reduced-motion`: transforms off, orbit/pulse off, tour/scroll instant.
- `color-scheme` set on both roots; `forced-colors` not broken by ink-border reliance.
- Streaming answers in `aria-live="polite"`; never assertive; never per-token.

## 7. Definition of done

T1–T4 complete → `npm run typecheck && npm run test && npm run lint && npm run build` all clean → every row of the verification checklist checked in **both** themes → any new gap found gets a `deferred-work.md` entry (or a fix if trivial) instead of a silent workaround.
