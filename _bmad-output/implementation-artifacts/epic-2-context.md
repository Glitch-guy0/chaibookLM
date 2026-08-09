# Epic 2 Context: Organize Your Research Notebooks

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A signed-in user manages their research notebooks from a dedicated notebook dashboard — creating, opening, renaming, deleting, and bulk-deleting them — so their work stays organized into separate containers. The dashboard is the only notebook-management surface; a notebook workspace holds exactly three tabbed sections (Sources | Chat | Showcase) with no rail or side panel. The 10-notebook-per-user cap and the 1-week auto-expiry (TTL) are surfaced clearly and enforced server-side.

## Stories

- Story 2.1: Create a notebook
- Story 2.2: Open a notebook workspace
- Story 2.3: Rename a notebook
- Story 2.4: Delete and bulk-delete notebooks
- Story 2.5: Auto-expire notebooks after one week

## Requirements & Constraints

- Notebook management (create, rename, open, delete with confirmation, bulk-delete) lives entirely on the notebook dashboard, the signed-in home surface.
- Each user is capped at 10 notebooks. An 11th create attempt is blocked with a pop-up warning that lists the cap (10) and the current count; the warning has a single dismiss button.
- Notebook names need not be unique. Empty or whitespace-only names are rejected inline for both create and rename, and a rejected rename preserves the previous name.
- A notebook expires 1 week after creation and is auto-deleted (with its sources, chunks, and chat). Cards show "Expires in N days". On the next dashboard visit after an expiry, a notice announces what was removed.
- Deleting a notebook removes the notebook, its sources, their chunks, and its chat history. Bulk-delete removes multiple selected notebooks after a single confirmation.
- Deletion is a destructive action and always requires a confirmation dialog.
- Notebooks, sources, chunks, and chat are scoped per authenticated user and persist server-side (survives a full session/logout cycle).
- Dashboard and notebook workspace are fully responsive, with a minimum supported viewport of 320px.

## Technical Decisions

- Notebook management spans two bounded contexts: `contexts/notebooks` (CRUD) and `contexts/limits` (caps, counters, TTL). Next.js is the composition root and controller layer only; adapters are injected, never constructed by domain code.
- The `limits` context is the single owner of per-user/per-notebook counts in Neon. Every write boundary (create notebook, delete) routes through it; cap check-and-increment is a single Postgres transaction. Only the write boundary bumps counters; delete/TTL paths reconcile counters down exactly once (no double-bump).
- v0.1 caps are configurable server-side without code edits (10 notebooks/user, 10 sources/notebook, 30 sources/user, 5MB/source, 1-week TTL).
- Notebook TTL is lazy (AD-11): expiry check runs on dashboard load and notebook open; no cron in v0.1 (a daily sweep is deferred).
- Chunk data lives only in Qdrant (AD-1); Neon stores user + resource working metadata only. Notebook deletion's chunk removal follows the fixed cascade order Qdrant → Filebase → Neon, owned by the ingestion context as the single writer of the chunk lifecycle (AD-4, AD-14); each step is idempotent. This cascade is shared with the delete story of the sources epic.
- Notebooks are identified by UUIDs (`notebookId`). Mutations go through the owning context; mutation-only-through-owning-context is the cross-cutting convention.
- Client data fetching uses TanStack Query (no raw `fetch` in client components).

## UX & Interaction Patterns

- Notebook dashboard is a grid of notebook cards on the cream canvas: a create card (opens inline name input), and notebook cards showing title, source count, created + expiry meta ("Expires in N days"), and per-card rename/delete actions. Bulk-select checkboxes + bulk-delete toolbar (single confirmation). Active/open state is a brand fill with bold weight + filled glyph — never color-only.
- Create notebook card opens inline creation; hitting the 10-notebook cap surfaces the pop-up warning (cap + current count).
- Notebook workspace shows exactly three sections — Sources | Chat | Showcase — switched via tabs on top at every breakpoint, with real tablist semantics (`role="tablist"`/`tab`, `aria-selected`, arrow-key navigation). No notebook rail, no side panel. A "Back to notebooks" affordance returns to the dashboard.
- Cold load: skeletons matching the tabbed section layout that resolve on data. Empty notebook shows "This notebook has no sources yet." (with a primary action to add the first source) and "Ask anything about your sources." in Chat.
- Destructive-action confirmation dialogs trap focus with initial focus on the confirm button, return focus to the trigger on close, and close on Esc. Modal stacks stay one level deep.
- Dialog confirmation is required for destructive actions, including delete and bulk-delete notebooks.
- Neo-brutalist design system applies to all surfaces (2px hard borders, offset shadows, hard corners); interactive elements ≥44px on mobile, ≥24px on desktop; WCAG 2.2 AA in light and dark mode; focus visible via a 3px ring + 2px offset on `:focus-visible`.

## Cross-Story Dependencies

- Depends on Epic 1: signed-in user scoping, persistence, and the `limits` context counters (notebook cap, single-writer counter, per-user data) must exist before dashboard CRUD works.
- Shares the delete cascade (Qdrant → Filebase → Neon) with Epic 3 source removal; notebook deletion reuses the ingestion context's removal path.
- Story 2.4 and 2.5 both depend on the limits context reconciling counters down exactly once; 2.5 additionally depends on the lazy TTL check (AD-11).
