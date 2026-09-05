# Cost & Trade-Off Evaluation Guide

Every significant architectural change introduces costs and trade-offs. The `architect` role must make these explicit in the implementation plan and companion ADRs.

## The Four Cost Categories

### 1. Infrastructure & Monetary Cost
- **Direct Cloud / Provider Costs**: Virtual machines, serverless executions, managed database instances, data egress, storage tiers.
- **Third-Party API / SaaS Pricing**: Per-seat subscriptions, per-transaction fees, usage-based metering (e.g., LLM tokens, SMS charges).
- **Scale Projections**: When does pricing jump from flat tier to high-volume enterprise billing?

### 2. Operational Complexity
- **Deployment & Provisioning**: Additional services to manage, CI/CD pipeline steps, infrastructure-as-code updates.
- **Observability & Monitoring**: New logging streams, metrics dashboards, health check endpoints, alert configurations.
- **Failure Modes & On-Call**: How does this component fail? Does it support automatic failover or require manual intervention?

### 3. Engineering Effort & Maintenance
- **Initial Build Time vs Long-Term Maintenance**: Does a custom build justify the ongoing patching and support?
- **Cognitive Load & Developer Experience**: Does introducing a new framework or paradigm steepen the team learning curve?
- **Testing Surface**: Need for mock servers, integration test environments, or contract testing.

### 4. Vendor Dependencies & Lock-In
- **Proprietary APIs**: How coupled is the system to provider-specific features?
- **Switching Costs**: If the provider changes pricing or discontinues service, how difficult is migration?
- **Mitigation Strategy**: Is an adapter or abstraction layer warranted?

---

## Communicating Trade-Offs

Use the concise tradeoff format in plans:
```text
Decision: Introduce Redis Cache for Product Catalog
Benefits: Sub-millisecond response times, 80% reduction in DB read queries.
Trade-Offs & Costs:
- Additional Redis instance provisioning & monitoring.
- Cache invalidation complexity on product updates.
- Memory eviction policy tuning required.
Revisit Trigger: Read traffic drops below threshold where DB handles load directly without latency penalty.
```
