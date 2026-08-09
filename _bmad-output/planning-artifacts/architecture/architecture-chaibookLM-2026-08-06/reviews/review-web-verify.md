# Web Verification Review — chaibookLM Architecture Spine

- **Date:** 2026-08-09
- **Scope:** Every committed technology/version claim in `ARCHITECTURE-SPINE.md`, web-verified as of today.
- **Method:** Live web searches against npm, official release feeds, provider docs, and package registries (2026 data).
- **Overall verdict:** Sound stack — 12 of 13 claims confirmed current; **one outdated claim (TypeScript 5.x)** and **one zero-adoption dependency flag (@glitch-guy0/shikigami)**.

---

## Verdict

The architecture's committed stack is largely confirmed and current as of 2026-08-09. One version claim is stale (TypeScript, now 7.x), and the pinned `@glitch-guy0/shikigami` package is real but has zero adopters, warranting a documented risk. No technology was found defunct.

## Per-Technology Findings

### Confirmed OK

| Claim | Verified status (2026-08-09) | Source |
|---|---|---|
| Next.js 16.x | **Confirmed.** Stable 16.x line current; 16.3.0 latest (npm + official docs). | npm; nextjs.org/docs/app/getting-started/installation |
| React 19.x | **Confirmed.** 19.2.8 latest (Jul 2026); 19.x is the stable major. | npm react |
| @tanstack/react-query 5.101.4 | **Confirmed.** 5.101.4 published 2026-07-21; v5 is stable line (v6 still beta as of Aug 2026). Pin is exactly correct. | npm; GitHub releases |
| Tailwind CSS 4.3.x | **Confirmed.** 4.3.3 current; 4.3 line stable since May 2026. | npm tailwindcss; tailwindcss.com/blog |
| Clerk | **Confirmed.** Actively maintained; 2026 Next.js guides; free tier (≤10k MAU) current. | apiscout guide 2026-03-08; clerk.com |
| Qdrant | **Confirmed.** Actively maintained (cloud public API v0.155.x, Jul 2026); server v1.19.x. | GitHub qdrant/qdrant; cloud API |
| Neon | **Confirmed.** Active; serverless Postgres with branching/scale-to-zero. | GitHub neon; docs |
| Filebase | **Confirmed.** Active; S3-compatible object storage + IPFS tier (s3.filebase.io / s3.filebase.com) documented. | filebase.com/docs |
| Upstash QStash | **Confirmed.** Active; SDK `@upstash/qstash` current; docs live. | upstash.com/docs/qstash |
| Driver.js | **Confirmed.** Active; zero-dep vanilla TS library (nilbuild/driver.js), updated Jul 2026. | GitHub nilbuild/driver.js |
| react-markdown + remark-gfm | **Confirmed.** react-markdown 10.1.0 (Mar 2026); remark-gfm 4.0.1; compatible pair. | GitHub releases; npm |
| jina (Reader/Search) | **Confirmed.** Active; r.jina.ai Reader + s.jina.ai Search maintained. | GitHub jina-ai/reader |
| create-next-app@latest 2026 defaults | **Confirmed.** Default enables TypeScript, Tailwind CSS, ESLint, App Router, Turbopack, import alias `@/*`, includes AGENTS.md; min Node 20.9. Matches spine's App Router + Tailwind assumption. | nextjs.org/docs/app/getting-started/installation (16.3.0) |

### Flags

- **TypeScript 5.x — OUTDATED, update spine.** Latest stable on npm is **7.0.2** (published 2026-08-08; TS 7 is the native/Go-port compiler). The 6.x line shipped earlier in 2026. Recommending `5.x` is a training-cutoff staleness; update to **7.x** (with a fallback note that Next.js 16.x works with TS 7).
- **@glitch-guy0/shikigami 0.1.0 — REAL BUT ZERO ADOPTION.** Package exists, pinned version 0.1.0 exactly correct, GitHub repo `Glitch-guy0/shikigami-sdk` active. **However:** npm reports "no other projects in the registry using it" — a single-author, zero-consumer package. Risk: unmaintained/breaking-change surface. Recommendation: keep but document as a pin-and-lock dependency (exact version, no semver range), or add a fallback plan.
- **QStash message-size nuance (design note, not a version error).** QStash payload limit is ~1 MB, but the spine references ≤5 MB source ingestion callbacks. If sources pass through the QStash body, they'll be rejected; plan to pass a reference (URL/key) and fetch inside the callback instead. Confirm the spine's ingestion flow doesn't put >1 MB in the QStash body.

## Non-issues reviewed

- **shikigami name collision:** `shikigami.dev` (a desktop multi-agent runner) and `@nahisaho/shikigami` (a different agent-skills package) are unrelated products. The pinned `@glitch-guy0/shikigami` is the correct, intended package — no mixup.
- **Qdrant free tier** and **Upstash limits** flagged as watch-items, not blockers.

## Bottom line

Approved with changes: bump TypeScript to 7.x, and add an explicit risk note + pin policy for `@glitch-guy0/shikigami`. Everything else matches the current 2026 ecosystem as of 2026-08-09.
