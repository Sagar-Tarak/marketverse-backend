# Marketverse Architecture Decision Records

This directory stores decisions that materially affect architecture or product behavior. A decision should include context, options, chosen approach, consequences and status.

## ADR-001 — Single-player first, multiplayer later

**Status:** Accepted  
**Decision:** Initial release is single-player with private worlds. Model world membership separately so shared-world multiplayer can be introduced later.  
**Consequences:** World-scoped data and authorization are required from the beginning. Multiplayer synchronization, matchmaking and chat are deferred.

## ADR-002 — Modular monolith first

**Status:** Accepted  
**Decision:** Use one NestJS backend codebase with explicit modules and a separately executable simulation worker.  
**Consequences:** Simpler local development and transactional boundaries. Extract services only when scale or team boundaries justify it.

## ADR-003 — Hybrid simulation

**Status:** Accepted in principle  
**Decision:** Aggregate consumer cohorts and small businesses; individually simulate major companies and institutions.  
**Consequences:** Balances realism and computational cost. Requires clear boundaries between aggregate and agent-based models.

## ADR-004 — PostgreSQL is source of truth

**Status:** Accepted  
**Decision:** PostgreSQL stores authoritative world, financial, inventory, order and simulation state. Redis is used for queues/cache/coordination only.  
**Consequences:** Critical operations must be transactionally safe and idempotent.

## ADR-005 — Professional application-style interface

**Status:** Accepted  
**Decision:** Browser UI resembles business/financial software, not a conventional game HUD. No 2.5D or 3D rendering in initial product direction.  
**Consequences:** Gameplay is driven through business screens, reports, decisions and market interfaces.

## ADR-006 — Deterministic simulation target

**Status:** Accepted as a design goal  
**Decision:** Store random seed and model version; make simulation calculations reproducible for identical inputs.  
**Consequences:** Stable ordering, explicit rounding and controlled random streams are required. Parallel execution must preserve deterministic results where exact replay is promised.

## ADR-007 — Double-entry accounting

**Status:** Accepted  
**Decision:** Financial transactions are recorded as balanced journal entries and ledger postings. Posted entries are immutable; corrections use reversals.  
**Consequences:** Financial actions require transactional posting and reconciliation.

## ADR-008 — Periodic market clearing first

**Status:** Proposed  
**Decision:** Start with periodic wholesale order matching and aggregate retail demand allocation.  
**Consequences:** Easier to reason about and test than a fully continuous exchange. Revisit per market type after prototype validation.
