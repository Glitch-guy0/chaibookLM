# Source Project Context

This design-system workspace was created from an existing OpenDesign project. Treat the copied project files as the primary source evidence for the generated design system.

## Source project

- Source project id: a3947cf1-6b87-40e6-b9b6-aad9f648958d
- Source project name: Web Prototype
- New design-system project id: 1f4c638f-f294-412c-9271-45d2c9127820
- New design-system id: user:web-prototype-design-system
- Source skill id: (none)
- Source design system id: neobrutalism

## Source metadata

```json
{
  "kind": "prototype",
  "nameSource": "prompt",
  "scenarioBinding": {
    "schemaVersion": 1,
    "provenance": "explicit_user",
    "pluginId": "example-web-prototype",
    "snapshotId": "c0f28da9-77d3-43be-aa3f-31a217cf2e9c",
    "boundAt": 1788686328270
  }
}
```

## Copied files

- component-library.html
- mockup-dashboard.html
- mockup-landing.html
- mockup-workspace-mobile.html
- mockup-workspace-desktop.html
- DESIGN.md
- brand-spec.md
- prototype-plan.md

## Skipped files

- (none)

## Generation contract

- Read this file before editing design-system outputs.
- Read the copied files directly from the project workspace; they are source evidence, not generated design-system output.
- Preserve high-signal assets, source examples, UI surfaces, copy, tokens, typography, and interaction patterns from the copied project.
- Generate a reusable OpenDesign design-system package in this same project: DESIGN.md, README.md, SKILL.md, colors_and_type.css, context/provenance, focused preview cards, preserved assets/build/fonts when available, and ui_kits/app/.
- Before final response, run `"$OD_NODE_BIN" "$OD_BIN" tools connectors design-system-package-audit --path . --fail-on-warnings` and fix every actionable issue.
