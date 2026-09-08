# Contextual — Browser Verification Checklist (Light + Dark)

**For:** Prajwal (Developer) · **Companion to:** `ux-implementation-handoff-design-system.md`
**How to run:** `npm run dev` → sign in via Clerk. Verify **every section twice** — once in Light, once in Dark. Toggle via the ☀/☾ ThemeToggle in the topbar.
**How to force a theme:** DevTools → console: `document.documentElement.classList.toggle('dark')` + `document.documentElement.setAttribute('data-theme','dark')` (or OS `prefers-color-scheme` with cookies cleared).
**Mark:** ✅ pass · ❌ fail (note the token/component) · ⚠ known deferred (cite `docs/deferred-work.md`).

Legend: **[L]** = light only, **[D]** = dark only, unmarked = both themes.

---

## 0. Theme mechanics

- [ ] Toggle button flips theme instantly; no white/black flash on hard reload of `/`, `/dashboard`, `/notebook/[id]` (inline boot script runs before paint).
- [ ] `html` gets both the `dark` class **and** `data-theme="dark"`; `color-scheme` matches (`:root` light / `.dark` dark) — check DevTools computed styles.
- [ ] No component remounts or loses state on toggle (open chat with text in composer → toggle → composer text and conversation survive).
- [ ] [D] Canvas `#0D0D0D`, cards `#18181B`, ink `#FFFFFF`, borders `#E4E4E7` — sample with the eyedropper; no warm-brown leftovers (`#16130D`, `#F5F0E8`).
- [ ] [L] Canvas `#F4F4F0` (industrial off-white, **not** warm beige), cards pure white, ink `#111111`.
- [ ] OS-level dark mode with cleared cookies → app boots dark; accepting cookie consent then persisting a choice keeps it after reload.

## 1. Landing + Dashboard

- [ ] Hero/display type is **Space Mono bold**; body is Inter — never Inter as display.
- [ ] ThemeToggle: 2px border, 3px shadow → 5px + lift on hover → collapse on press; visible cyan focus ring when Tabbed to.
- [ ] Notebook cards: 2px ink border, `5px 5px` shadow → `8px 8px` + `translate(-2px,-2px)` hover; title Space Mono; badges use `.badge.cyan` + `.expire`.
- [ ] Selected (checkbox) card: solid accent-yellow fill with **dark `#111111` text readable in both themes** (this was the old dark-mode contrast failure — verify it's gone).
- [ ] Delete button red fill with white text ≥ 4.5:1; Rename = surface/secondary.
- [ ] Exactly **one** solid primary CTA per viewport.
- [ ] Credit badge states: normal surface pill → `⚡ N/10`; ≤2 → **accent bg with `#111111` ink** ([D] check this specifically — white-on-yellow is the bug being fixed); 0 → `--danger-deep` bg, white text, 🔒.
- [ ] Expiration banner: full-width accent band, dark ink text, mono font, readable in both themes.

## 2. Workspace shell (all three viewports)

- [ ] Desktop ≥1280px: tri-pane **25% / 45% / 30%** with `SOURCES (N/10)` / `GROUNDED CHAT` / `ORIGINAL VIEW SHOWCASE` pane heads; outer 2px border + `6px 6px` shadow; panes scroll independently.
- [ ] Tablet 768–1279px: 50/50 Chat+Showcase; `📑 Sources (N/10)` topbar button opens the slide-over drawer; Esc/overlay click closes; focus returns to trigger.
- [ ] Mobile <768px: 3 tabs `Sources (N) | Chat | Showcase`, real tablist semantics, arrow-key nav, active tab = accent fill + dark ink.
- [ ] ExpirationBanner spans full width **above** the topbar; countdown text is honest (no fake numbers).
- [ ] Breadcrumb `← Notebooks / {title}`; muted "Share · soon" chip renders disabled (opacity ~0.65, not-allowed).

## 3. Sources pane + ingestion

- [ ] Add Source modal: 3px border + `8px 8px` shadow, dimmed overlay (`rgba(17,17,17,.55)` light / `rgba(0,0,0,.7)` dark), focus trapped, Esc closes, focus returns to trigger; one modal level only.
- [ ] All 5 tabs (Text/Web/PDF/Transcript/YouTube) legible in both themes; dropzone dashed border visible.
- [ ] SourceCard states, each verified per theme:
  - [ ] queued — gray dot + "Queued", muted but ≥ 3:1 for the dot
  - [ ] indexing — spinning `.orb`, accent border, orbiting shadow animation, label "Indexing"
  - [ ] ready — green pulsing dot + "Ready" (`#00E575` on `#18181B` in dark ≥ 3:1)
  - [ ] failed — red border/dot, fail-reason tooltip, working Retry button
- [ ] Type icons (¶ ↗ 📄 💬 ▶) sit in bordered `.src-icon` squares; icon + label + status = color never the only channel.
- [ ] `aria-live` fires only on ready/failed transitions (no intermediate announcements) — verify with the accessibility inspector.

## 4. Grounded chat

- [ ] User message: yellow block, **dark ink text in both themes**, 2px border, `4px 4px` shadow.
- [ ] Assistant: open unbordered markdown, Inter body, line-height ~1.6, `max-w-2xl` reading measure.
- [ ] Citation chips: cyan fill, `#111111` text, Space Mono, **not slanted**, 2px radius; hover tooltip `source • page/timestamp`; keyboard-focusable, Enter opens Showcase.
- [ ] Streaming: tokens append smoothly; "Generating answer…" hint; composer disabled while streaming; `aria-live="polite"` announces only the settled answer.
- [ ] RefusalCard: ink border + ⚠, exact copy "The uploaded sources do not specify the requested information." + "Search the live web via Tavily? (Consumes 1 credit)"; button slant/elevation flow; at 0 credits the button is disabled with the reset notice visible.
- [ ] **Press animation (every button, both themes):** press-and-hold any button — it must sink **exactly onto its shadow footprint**: shadow collapses to `0 0 0 0` and the button translates **`translate(4px, 4px)` in ~75ms** (DESIGN.md §5 "Pressed / Active" row). No partial 1–3px nudges, no shadow peeking out from under the pressed button, no movement without shadow collapse. Release springs back to rest.
- [ ] Composer: Enter sends, Shift+Enter newline, auto-grow to ~200px max; Send = accent primary (the viewport's one primary CTA).
- [ ] Failed turn: "Something went wrong." + Retry link, all readable per theme.
- [ ] History: scroll to top loads older pages without a visible jump; error states offer Retry.

## 5. Showcase (Original View)

- [ ] Empty state: "Click any citation pill in chat to verify proof in the original source." — readable, both themes.
- [ ] PDF view: header "Page X of Y", ‹ › buttons, `[`/`]` keys page; cyan bounding-box highlight flashes ~2.5s then settles (still visible at rest, not invisible in dark).
- [ ] [D] The cyan proof highlight uses `#22D3EE` (`--citation` dark) — check the box edge and tint against `#18181B`.
- [ ] YouTube view: embedded player seeks to the cited timestamp; transcript line highlights and autoscrolls.
- [ ] Web view: sanitized reader renders; iframe fallback shows the blocking notice per the retro action item.
- [ ] Mobile: tapping a citation flips Chat→Showcase, sticky `← Back to Chat` docks bottom-center (≥44px), return restores exact scroll position; Esc also returns.
- [ ] Tab/arrow through the showcase; focus ring (cyan, 3px, 2px offset) visible on every control in both themes.

## 6. Credits + lockout

- [ ] Click badge → credits Dialog (heavy 8px shadow); content lists pool/reset at 12:00 AM Asia/Kolkata; "Got it" closes; focus returns.
- [ ] At 0 credits: badge 🔒 red, composer textarea + Send disabled (opacity 0.45, not-allowed cursor), placeholder shows the lockout copy.
- [ ] Warning state (≤2): accent badge + dark ink text both themes; modal balance line colors correctly (green/normal, yellow/warn, red/zero).

## 7. Motion + a11y floors

- [ ] Enable **Reduce Motion** (OS setting): no orbit spin, no green pulse, no hover translate (border/underline change instead), tour + smooth-scroll instant. Repeat one source ingestion + one chat turn under this mode.
- [ ] Keyboard-only pass: Tab through landing → dashboard → workspace; every stop shows the visible ring; no focus traps outside modals/drawer.
- [ ] Screen-reader spot check (VoiceOver): notebook cards announce name+state; status changes announce; live region polite.
- [ ] Zoom to 200%: no clipped text, no horizontal scroll at 320px width.

## 8. Sign-off

- [ ] All above ✅ in **Light** — date/initials: ______
- [ ] All above ✅ in **Dark** — date/initials: ______
- [ ] `npm run typecheck && npm run test && npm run lint && npm run build` clean.
- [ ] New gaps found → logged in `docs/deferred-work.md` (or fixed if trivial). No silent workarounds.
