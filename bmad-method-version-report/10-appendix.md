# 10 · Appendix — Inventory, Cross-References, Glossary, Sources

> Part of the [BMad Method Report](index.md) for the **Contextual** project.

## 10.1 Full skill inventory (35 installed)

Source: `_bmad/_config/skill-manifest.csv` (descriptions abridged). ⚠ = orphaned by the dbw drift.

### core (8)

| Skill | Purpose |
|---|---|
| `bmad-help` | Analyzes state + query; recommends next skill(s) |
| `bmad-brainstorming` | Facilitated creative-technique sessions |
| `bmad-customize` | Authors/updates `_bmad/custom/` overrides; verifies merge |
| `bmad-deep-recon` | Research for decisions (6 built-in types + custom); draft / summarize / run modes |
| `bmad-forge-idea` | Persona-driven idea pressure-testing |
| `bmad-party-mode` | Multi-agent discussions; custom parties/personas |
| `bmad-review` | Lens-based review (adversarial, edge-case, verification-gap, structure, prose) |
| `bmad-advanced-elicitation` | Named-method refinement passes |

### bmm — agents (5)

| Skill | Identity |
|---|---|
| `bmad-agent-analyst` | Mary — Business Analyst 📊 |
| `bmad-agent-pm` | John — Product Manager 📋 |
| `bmad-agent-ux-designer` | Sally — UX Designer 🎨 |
| `bmad-agent-architect` | Winston — System Architect 🏗️ |
| `bmad-agent-dev` | Amelia — Senior Software Engineer 💻 |

### bmm — plan (9)

| Skill | Purpose |
|---|---|
| `bmad-product-brief` | Create/update/validate product brief |
| `bmad-prfaq` | Working-Backwards PRFAQ challenge |
| `bmad-prd` | Create/update/validate PRD |
| `bmad-spec` | Condense any input into SPEC.md + companions; can break into stories |
| `bmad-ux` | DESIGN.md + EXPERIENCE.md |
| `bmad-architecture` | Architecture spine; create/update/validate |
| `bmad-project-context` | AGENTS.md setup/refresh/audit + pitfall recording |
| `bmad-create-epics-and-stories` | Epics + user stories with AC |
| `bmad-sprint-planning` | Readiness gate + sprint status generation/repair |

### bmm — ship (7)

| Skill | Purpose |
|---|---|
| `bmad-build` | Delegate feature/story/bug → implemented, reviewed code |
| `bmad-build-auto` | One unattended loop iteration |
| `bmad-code-review` | Parallel independent reviewers + triage |
| `bmad-correct-course` | Mid-sprint change assessment → change proposal |
| `bmad-walkthrough` | Guided human review of a change |
| `bmad-qa-generate-e2e-tests` | Automated API/e2e test generation |
| `bmad-retrospective` | Evidence-sourced epic retro + acceptance decision |

### bmad-loop (3)

| Skill | Purpose |
|---|---|
| `bmad-loop-setup` | Install/upgrade module + orchestrator tool |
| `bmad-loop-sweep` | Deferred-work ledger triage (automation-only; `result.json` partition) |
| `bmad-loop-resolve` | Interactive CRITICAL-escalation resolution (`/bmad-loop-resolve <story-key>`) |

### dbw (3) ⚠ sources missing

| Skill | Purpose |
|---|---|
| `dbw-setup` | Install/update dbw config |
| `dbw-documentation` | C4 + behavioral diagrams, ADRs; `[DS]` document-system, `[VS]` verify-sync |
| `dbw-planning-workflow` | Visual planning + Architect impact analysis; `[PW]` plan-change, `[PD]` promote |

## 10.2 Config & manifest cross-reference

| File | Format | Written by | Read by | Committed? |
|---|---|---|---|---|
| `_bmad/config.toml` | TOML | installer | `resolve_config.py`, `render_skill.py`, roster skills | ✅ |
| `_bmad/config.user.toml` | TOML | installer | same merge chain | ✅ (personal values inside) |
| `_bmad/custom/config.toml` | TOML | team | same merge chain | ✅ |
| `_bmad/custom/config.user.toml` | TOML | individual | same merge chain | ❌ gitignored |
| `_bmad/_config/manifest.yaml` | YAML | installer | humans / audit | ✅ |
| `_bmad/_config/skill-manifest.csv` | CSV | installer | audit, registry | ✅ |
| `_bmad/_config/files-manifest.csv` | CSV | installer | integrity audit | ✅ |
| `_bmad/_config/bmad-help.csv` | CSV | installer | `bmad-help`, agent menus | ✅ |
| `<skill>/customize.toml` | TOML | installer | `resolve_customization.py`, renderer | (installed, not hand-edited) |
| `_bmad/custom/<skill>.toml` | TOML | team | same | ✅ |
| `_bmad/custom/<skill>.user.toml` | TOML | individual | same | ❌ gitignored |
| `_bmad/bmm/config.yaml`, `_bmad/bmad-loop/config.yaml` | YAML | installer | module skills | ✅ |
| `_bmad/config.yaml`, `_bmad/config.user.yaml` | YAML | ⚠ dbw-era leftover | *(nothing in the merge chain)* | ✅ but stale |

## 10.3 Glossary

| Term | Meaning |
|---|---|
| **Skill** | Named command installed into an AI tool; loads an agent, workflow, or task |
| **Agent** | Skill defining a persona + menu codes |
| **Menu code** | Short per-agent command (BD, CR…) executed while the agent is in character |
| **Module** | Versioned bundle of skills + config + help entries (core, bmm, bmad-loop, dbw) |
| **Rendered generation** | Immutable, hash-addressed snapshot of a workflow skill's instructions under `_bmad/render/` |
| **Customize.toml** | Per-skill schema + defaults; never edited; overridden via `_bmad/custom/` |
| **Structural merge** | Shape-based TOML merge: tables deep-merge, keyed table-arrays merge by `id`/`code`, other arrays append, nothing is removable |
| **persistent_facts** | Standing context entries (text / `file:` / `skill:` refs) loaded at activation |
| **Deferred-work ledger** | bmad-loop's record of postponed items; triaged by `bmad-loop-sweep` |
| **Sprint status** | `_bmad-output/implementation-artifacts/sprint-status.yaml` — the tracking file all ship-phase skills sync |
| **Spine** | BMM's architecture artifact ("architecture spine"), linted by `lint_spine.py` |
| **Shim** | Deprecated skill-ID forwarder kept until v7 (`v6-shims/`) |
| **uv** | Python tooling runner; provisions Python 3.11+ for BMad's scripts |

## 10.4 Official sources consulted

- BMad Method GitHub — `github.com/bmad-code-org/BMAD-METHOD` (README: modules table, install routes, prerequisites)
- Official docs site — `docs.bmad-method.org`
  - *Skills and Agents* (`/reference/skills-and-agents/`): skill definition, skills-directory-per-tool table, agent roster & menu codes, core skills, deprecated names, troubleshooting ("installer does not delete old skill directories")
  - *Customize BMad* (`/customize/customize-bmad/`): per-skill vs central surfaces, 3-layer & 4-layer priority tables, shape-based merge rules, activation order, `resolve_customization.py` usage, one-run `--set` overrides, read-only `agent.name/title`, troubleshooting
- bmad-loop repo — `github.com/bmad-code-org/bmad-loop` (`docs/setup-guide.md`): orchestrator vs skills split, installer limitations, `bmad-loop init`/`validate`, review-layer requirement logic, adapter/policy model
- npm registry — `npmjs.com/package/bmad-method` (latest 6.12.0, published ~2026-09-04)
- BMAD-METHOD releases/changelog — v6.10.0 (bmad-loop marketplace module, review layers), 6.10.1 (`bmad-dev-auto`→`bmad-build-auto`), 6.12-era renames (Quick Dev→Build)

## 10.5 Local evidence base

- `_bmad/_config/{manifest.yaml, skill-manifest.csv, files-manifest.csv, bmad-help.csv}`
- `_bmad/{config.toml, config.user.toml, custom/*, bmm/*, bmad-loop/*, scripts/*}`
- `_bmad/render/bmad-build/contextual-b3c8d07f5cf0/b2c4dcb4ad8e1e76649d/manifest.json` (+ bmad-build-auto generation)
- `.agent/skills/**` and `.kiro/skills/**` (35 SKILL.md each; `bmad-build`, `bmad-code-review`, `bmad-help`, `bmad-agent-dev`, `bmad-loop-setup`, `dbw-*` inspected)
- `_bmad-output/{planning-artifacts, implementation-artifacts}` (4 epics of real artifacts)
- Git tracking state (`git ls-files _bmad` → 22 files) and `.gitignore` rules

---

*Report generated 2026-09-14 · branch `refactor/complete-workflow-changes` · all file references relative to project root.*
