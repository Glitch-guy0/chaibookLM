---
name: "dbw-setup"
description: Sets up Diagram-Based Workflow module in a project. Use when the user requests to 'install dbw module', 'configure Diagram-Based Workflow', or 'setup Diagram-Based Workflow'.
---

# Module Setup

## Overview

Installs and configures the Diagram-Based Workflow (DBW) module into a project. Module identity (name, code, version) comes from `./assets/module.yaml`. Collects user preferences and writes them to three files:

- **`{project-root}/_bmad/config.yaml`** — shared project config: core settings at root plus a section for `dbw` with directory paths (`docs_folder`, `planning_artifacts_folder`, `adr_folder`, `diagram_index`). User-only keys (`user_name`, `communication_language`) are **never** written here.
- **`{project-root}/_bmad/config.user.yaml`** — personal settings intended to be gitignored.
- **`{project-root}/_bmad/module-help.csv`** — registers `dbw` capabilities for the BMad help system.

Both config scripts use an anti-zombie pattern — existing entries for this module are removed before writing fresh ones, so stale values never persist.

`{project-root}` is a **literal token** in config _values_ (the data written into the files above) — never substitute it there. It signals to the consuming LLM that the value is relative to the project root, not the skill root. **This does not apply to the filesystem path _arguments_ passed to the scripts below** (the `--*-path`, `--*-dir`, and `--target` arguments): those are real paths, so you **must** resolve `{project-root}` to the actual project root before running, or the scripts will write to a literal `{project-root}/` directory under the skill folder.

## On Activation

1. Read `./assets/module.yaml` for module metadata and variable definitions (`code: dbw`).
2. Check if `{project-root}/_bmad/config.yaml` exists — if a section matching `dbw` is already present, inform the user this is an update.
3. Check for per-module configuration at `{project-root}/_bmad/dbw/config.yaml`. If present:
   - If `{project-root}/_bmad/config.yaml` does **not** yet have a section for this module: this is a **fresh install**. Consolidated into the new format.
   - If `{project-root}/_bmad/config.yaml` **already** has a section for this module: this is a **legacy migration**.
   - In both cases, per-module config files and directories will be cleaned up after setup.

If the user provides arguments (e.g. `accept all defaults`, `--headless`, or inline values like `docs_folder=docs`), map any provided values to config keys, use defaults for the rest, and skip interactive prompting.

## Collect Configuration

Ask the user for values. Show defaults in brackets:

- **`docs_folder`** [default: `{project-root}/docs`]: Where approved C4 diagrams and documentation live.
- **`planning_artifacts_folder`** [default: `{project-root}/planning-artifacts`]: Where WIP planning diagrams and draft designs live.
- **`adr_folder`** [default: `{project-root}/docs/decisions`]: Where Architecture Decision Records live.
- **`diagram_index`** [default: `{project-root}/docs/indexes/diagram-index.md`]: Primary diagram catalog.

## Write Files

Write a temp JSON file with the collected answers structured as `{"module": {...}}` (include `"core": {...}` if core does not exist). Values inside this JSON keep the literal `{project-root}` token. Then run both scripts:

```bash
uv run ./scripts/merge-config.py --config-path "{project-root}/_bmad/config.yaml" --user-config-path "{project-root}/_bmad/config.user.yaml" --module-yaml ./assets/module.yaml --answers {temp-file} --legacy-dir "{project-root}/_bmad"
uv run ./scripts/merge-help-csv.py --target "{project-root}/_bmad/module-help.csv" --source ./assets/module-help.csv --legacy-dir "{project-root}/_bmad" --module-code dbw
```

## Create Output Directories

After writing config, resolve the `{project-root}` token and create the necessary directory structure:
- `docs/c4/components`
- `docs/c4/code`
- `docs/flows`
- `docs/integrations`
- `docs/decisions`
- `docs/indexes`
- `planning-artifacts/c4/components`
- `planning-artifacts/c4/code`
- `planning-artifacts/flows`
- `planning-artifacts/integrations`

## Cleanup Legacy Directories

```bash
uv run ./scripts/cleanup-legacy.py --bmad-dir "{project-root}/_bmad" --module-code dbw --skills-dir "{project-root}/.claude/skills"
```

## Confirm

Display what was configured and show the greeting from `./assets/module.yaml`.
