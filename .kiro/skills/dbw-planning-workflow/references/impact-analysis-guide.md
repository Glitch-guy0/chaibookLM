# Impact Analysis Guide — Mapping Diagram Diffs to Code

When a diagram in `planning-artifacts/` is updated, the `architect` capability must map the visual diff to concrete implementation changes.

## 1. C4 Level Impact Classification

Determine which levels of the C4 model are affected:

| C4 Level Changed | Likely Code & Infrastructure Impact |
|---|---|
| **Level 1: System Context** | External API clients, auth credentials, environment secrets, webhook endpoints, firewall/network ingress. |
| **Level 2: Containers** | Dockerfiles, compose configs, k8s deployments, new DB migrations, queue listeners, build scripts, service-to-service RPC contracts. |
| **Level 3: Components** | New service interfaces, repository classes, controllers/routes, dependency injection bindings, domain handlers. |
| **Level 4: Code** | Class signatures, domain model fields, ORM mappings, utility functions, unit test suites. |

---

## 2. Behavioral Flow Impact

If sequence diagrams or flowcharts are modified:
- **Synchronous vs Asynchronous**: Check if a synchronous HTTP call was changed to an asynchronous message. If so, identify retry handling, dead-letter queues, and eventual consistency implications.
- **State Machine Changes**: Check if entity states were added/removed in state diagrams. Trace all state transition guards in the domain logic.
- **Error & Fallback Paths**: Ensure the diagram's error branches correspond to explicit exception handling or circuit breakers in code.

---

## 3. Integration & Third-Party Impact

If a third-party service is added or replaced:
- Locate the adapter package (`src/adapters/<service>`).
- Verify that domain logic is insulated from vendor SDK specifics.
- Review error responses, rate limits, timeouts, and auth refresh flows.
