# C4 Model Standard for Diagram-Based Workflow

This guide specifies how to author and maintain C4 architecture diagrams within `docs/c4/`.

## The C4 Hierarchy

```text
System Context (Level 1)
       ↓
Containers (Level 2)
       ↓
Components (Level 3)
       ↓
Code (Level 4)
```

The C4 hierarchy provides a progressive zoom path:
- An engineer can start at System Context to see the big picture.
- Zoom into Containers to see deployable units and data stores.
- Zoom into a specific Container's Component diagram to see internal services/adapters.
- Zoom into Code diagrams for key domain classes and dependency structures.

---

## Level 1 — System Context Diagram
**Path**: `docs/c4/system-context.mmd`
**Question**: *What is this system, who uses it, and what external systems interact with it?*

### Rules:
1. Show only:
   - Primary user personas / actors
   - The main software system (as a single box or boundary)
   - External systems (third-party APIs, external databases, partner services)
   - High-level relationships with clear labels
2. **Do NOT** include internal microservices, databases, queues, or classes.
3. Keep it readable at a single glance.

---

## Level 2 — Container Diagram
**Path**: `docs/c4/containers.mmd`
**Question**: *What major applications, services, data stores, queues, and runtime containers make up the system?*

### Rules:
1. Show:
   - All independently deployable or runnable units (web apps, API servers, worker daemons)
   - Data stores (PostgreSQL, Redis, S3 bucket)
   - Message brokers / event streams (Kafka, RabbitMQ, SQS)
   - Protocols / communication mechanisms (HTTPS/REST, gRPC, WebSocket, TCP)
   - Ownership boundaries and async/sync distinctions
2. Label each container with its technology and primary responsibility:
   `API Server [Go / Gin] - Handles user authentication and order ingestion`

---

## Level 3 — Component Diagram
**Path**: `docs/c4/components/<container-name>.mmd`
**Question**: *How is an individual container internally structured?*

### Rules:
1. Scope each component diagram to a **single container** (do not make a mega-diagram covering all containers).
2. Show:
   - Controllers / Handlers / Entry points
   - Domain services & Application services
   - Repositories & Data Access Objects
   - Adapters & External client wrappers
   - Event listeners / Producers
3. Emphasize boundary rules (e.g., Controllers call Services, Services use Repositories/Adapters).

---

## Level 4 — Code / Class Diagram
**Path**: `docs/c4/code/<subject>.mmd`
**Question**: *How are key domain types, classes, interfaces, or modules structured?*

### Rules:
1. Use **selectively**. Do NOT diagram every class in the repository.
2. Only create Code diagrams where structural relationships (inheritance, composition, complex state machines, plugin interfaces) require visual clarity.
3. Keep focused on a specific subject (e.g., `code/order-domain.mmd`, `code/plugin-pipeline.mmd`).
