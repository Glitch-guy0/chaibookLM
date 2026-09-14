# 9 · Operations — Runbook, Findings & Recommendations

> Part of the [BMad Method Report](index.md) for the **Contextual** project.

## 9.1 Day-to-day runbook

### Run a skill

Just name it in your AI tool: `bmad-build implement story 2-3`, or load an agent (`Amelia…`) and use a menu code (`BD`). For guidance, `bmad-help` inspects `_bmad-output/` and recommends the next step. Skills that render (`bmad-build`, `bmad-build-auto`) require `uv` on PATH.

### Check install health

```bash
# 1. Manifests parse and agree
cat _bmad/_config/manifest.yaml | grep -A2 "^modules:" | head -20

# 2. Central config resolves
uv run _bmad/scripts/resolve_config.py --project-root "$PWD" > /tmp/bmad-config.json && echo OK

# 3. Skill dirs match the registry
ls .agent/skills | wc -l                          # expect 35
diff <(ls .agent/skills) <(ls .kiro/skills)       # expect identical

# 4. Rendered snapshots verify themselves on every reuse
#    (a hash mismatch would print: HALT: generation collision or corruption …)
```

### Update BMad

```bash
npx bmad-method install      # re-run; prior answers are defaults; regenerates installer files
```

- Your `_bmad/custom/` files survive untouched.
- Customizations live in overrides — never in installed files — so updates can't erase your changes.
- After updating bmad-loop upstream, `/bmad-loop-setup` re-runs as an upgrader.

### Reset a skill to defaults

Delete its override: `rm _bmad/custom/<skill>.toml` (or the `.user.toml` variant). No installed file is ever touched.

## 9.2 Findings

| # | Finding | Severity | Evidence |
|---|---|---|---|
| F1 | **Core + BMM are current** (6.12.0 = npm latest) and installed following official architecture | ✅ healthy | manifest.yaml vs npm |
| F2 | **Render pipeline works** — two generations on disk with valid self-describing manifests; `bmad-build-auto` results in artifacts prove real usage | ✅ healthy | `_bmad/render/**/manifest.json` |
| F3 | **Customization system unused** — zero overrides; all skills run shipped defaults | ℹ️ opportunity | `_bmad/custom/` templates only |
| F4 | **`dbw` module drift** — registered + skills installed, but `_bmad/dbw/` sources and config files missing; straggler YAMLs (`config.yaml`, `config.user.yaml`, top-level `module-help.csv`) are dbw leftovers | ⚠️ medium | files-manifest vs disk; manifest `source: unknown` |
| F5 | **`bmad-loop` dormant** — registered with pinned SHA, but orchestrator + `.bmad-loop/` never initialized; sweep/resolve skills inert | ⚠️ low | no `.bmad-loop/` dir |
| F6 | **Stray root `planning-artifacts/` folder** — dbw config pointed planning artifacts at `{project-root}/planning-artifacts` while BMM uses `_bmad-output/planning-artifacts`; risk of split-brain artifacts | ℹ️ low | root dir listing vs bmm config |
| F7 | **Committed `__pycache__/*.pyc`** entries inside files-manifest (build artifacts tracked in the integrity manifest) | ℹ️ cosmetic | files-manifest tail |
| F8 | **Legacy YAML duplicates** (`_bmad/config.yaml`, `config.user.yaml`) not part of the resolver merge chain — harmless but misleading | ℹ️ low | `config_utils.load_central_config` reads TOML only |
| F9 | **Only 22 of ~250 `_bmad` files committed** — correct per design (skills materialize per machine), but note: repo has no pinned installer version in package.json; reproducibility relies on npm latest | ℹ️ consideration | git ls-files |

## 9.3 Recommendations (prioritized)

1. **Resolve the dbw drift (F4)** — pick keep-or-drop, then either restore sources or run the cleanup below. Until then, `bmad-help` recommendations include a dead module.
2. **Decide bmad-loop's fate (F5)** — either run `bmad-loop-setup` (requires tmux, git ≥ 2.34, uv tool install from Git) to unlock unattended epic runs, or uninstall the module to shrink the catalog. Given epics 2–4 already used `bmad-build-auto` interactively, initializing the orchestrator is the natural next step if unattended runs are wanted.
3. **Start using customization (F3)** — lowest-friction wins:
   - `_bmad/custom/bmad-agent-dev.toml` → `persistent_facts` with repo conventions (test runner, commit style);
   - `_bmad/custom/bmad-build.toml` → tune `review_layers` or `implementation_handoff` if the default subagent recipe doesn't fit your tooling.
4. **Clean the stragglers (F6, F8)** — remove `_bmad/config.yaml`, `_bmad/config.user.yaml`, root `planning-artifacts/`, and the duplicate top-level `module-help.csv` after confirming dbw disposition.
5. **Optionally pin the installer version (F9)** — document `bmad-method@6.12.0` in project docs (or a devDependency) so every team member installs the same core.

## 9.4 Repair scripts

### 9.4.1 bmad-loop — initialize

```bash
# In the AI tool:
/bmad-loop-setup accept all defaults
# or manually:
uv tool install "bmad-loop[tui] @ git+https://github.com/bmad-code-org/bmad-loop.git"
bmad-loop init --project "$PWD" --cli claude
bmad-loop validate
```

### 9.4.2 dbw drift — repair

```bash
# Option A — keep dbw: restore sources, then rebuild
#   (re-obtain the module from its origin, e.g. your module repo, then:)
npx bmad-method install          # rebuilds _bmad/dbw + manifests

# Option B — drop dbw: manual prune
rm -rf .agent/skills/dbw-setup .agent/skills/dbw-documentation .agent/skills/dbw-planning-workflow
rm -rf .kiro/skills/dbw-setup .kiro/skills/dbw-documentation .kiro/skills/dbw-planning-workflow
rm -f _bmad/config.yaml _bmad/config.user.yaml _bmad/module-help.csv
rm -rf planning-artifacts
# then remove the 3 dbw rows from _bmad/_config/skill-manifest.csv,
# the 5 "Diagram-Based Workflow" rows from _bmad/_config/bmad-help.csv,
# and the dbw module entry from _bmad/_config/manifest.yaml
# — or simply: delete .agent/skills & .kiro/skills and re-run the installer for a clean set.
```

> The official docs favor Option B's last line: *"Remove the stale directories, or delete the whole skills directory and re-run the installer for a clean set."* The installer does **not** delete old skill dirs itself.

## 9.5 Failure modes worth knowing

| Symptom | Cause | Fix |
|---|---|---|
| `HALT: … uv` / skill refuses to run | `uv` missing (rendered skills hard-require it) | install uv, re-invoke |
| `HALT: generation collision or corruption` | rendered snapshot tampered/partial | delete `_bmad/render/<skill>/` and re-invoke (regenerates deterministically) |
| `HALT: no active review layers` | all review layers disabled via overrides | re-enable a layer in `_bmad/custom/bmad-build.toml` |
| Skill not appearing in tool | tool-specific enablement or wrong dir | check the tool's skills dir; restart/reload window |
| Skills from removed module still present | installer never deletes skill dirs | manual prune or clean reinstall (above) |
| Config changes not taking effect | edited installer-owned file, or override named wrong | edit `_bmad/custom/config*.toml`; name override exactly after the skill dir; verify with `resolve_customization.py` |

---

Next: [10-appendix.md](10-appendix.md) — full inventory, cross-references, glossary, sources.
