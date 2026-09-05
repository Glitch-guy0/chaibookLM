# Architecture Decision Records (ADR) & Cost Drivers Guide

In the Diagram-Based Workflow, Architecture Decision Records (ADRs) are not isolated prose documents. Every ADR must point to the specific diagram element it affects.

```text
Mermaid Diagram Node
       ↓
Linked ADR (docs/decisions/ADR-xxx.md)
       ↓
Why / Trade-offs / Cost Drivers
       ↓
Source Code Implementation (src/adapters/...)
```

## Structure of a DBW ADR

Every ADR in `docs/decisions/` should include:

1. **Title & Status**: `ADR-001: Use Stripe for Payment Processing` (Status: Proposed / Accepted / Deprecated / Superseded)
2. **Affected Diagram Elements**: Clickable or explicit references to diagram files and node IDs (e.g., `docs/c4/containers.mmd -> Payment Gateway`, `docs/integrations/stripe.mmd`).
3. **Context & Problem**: Why did this decision need to be made?
4. **Decision**: What exact technology, architecture pattern, or vendor was chosen?
5. **Alternatives Considered & Why Rejected**:
   - Option A: (Reason rejected)
   - Option B: (Reason rejected)
6. **Cost Drivers & Trade-Offs**:
   - *Infrastructure Cost*: (e.g., adds managed cache tier, $X/month or compute usage)
   - *Vendor Implications*: (e.g., transaction fees, SLA guarantees, data sovereignty)
   - *Operational Complexity*: (e.g., requires secret rotation, dead-letter monitoring)
   - *Engineering & Maintenance*: (e.g., custom adapter maintenance, learning curve)
7. **Revisit Triggers**: What event, volume threshold, or condition would warrant revisiting this decision? (e.g., "Revisit if monthly transactions exceed 100k or vendor increases take rate above 3%").
