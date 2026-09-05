# Diagram Sync Verification Guide

This guide describes how to verify that existing Mermaid diagrams in `docs/` match the reality of the codebase.

## Verification Checklist

When executing `verify-sync` (`[VS]`), the agent inspects both the diagrams and the actual source tree:

1. **Container / Deployable Verification**:
   - Check Dockerfiles, docker-compose, Kubernetes manifests, package manifests, or serverless configs.
   - Verify every container in `docs/c4/containers.mmd` exists in source control.
   - Check for undeclared databases, caches, or background workers.

2. **Component & Module Verification**:
   - For each component diagram in `docs/c4/components/<container>.mmd`, check the internal package/folder structure.
   - Verify that controllers, services, repositories, and adapters reflect actual code exports.
   - Flag "ghost components" (in diagram but deleted in code) or "unmapped services" (in code but missing in diagram).

3. **Integration Boundary Verification**:
   - Check HTTP clients, SDK imports, environment variables, and config files for third-party API usage (e.g., Stripe, Twilio, SendGrid, OpenAI, S3).
   - Ensure every external dependency in code is represented in `docs/integrations/` or `docs/c4/system-context.mmd`.

4. **ADR Consistency**:
   - Ensure all decisions referenced in diagram annotations have an active file in `docs/decisions/`.
   - Verify that code paths adhere to documented constraints (e.g., if ADR dictates "all external payment calls through PaymentAdapter", verify no controller calls Stripe SDK directly).

## Reporting Drift

If drift is discovered, produce a clear drift report:
- **Missing in Diagrams**: Code exists but is undocumented.
- **Outdated in Diagrams**: Diagram shows deprecated patterns or deleted endpoints.
- **Architectural Violations**: Implementation bypasses a documented boundary.
