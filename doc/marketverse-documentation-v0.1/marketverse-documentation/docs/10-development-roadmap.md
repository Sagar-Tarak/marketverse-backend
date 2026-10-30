# MV-010 — Development Roadmap

**Version:** 0.1.0 | **Status:** Proposed sequence

## 1. Strategy

Build a small, working economic world before building the entire game. Each milestone must produce a testable vertical slice. Avoid implementing every domain table or every screen before the first market transaction works.

## 2. Milestone 0 — Repository and engineering foundation

Deliver:
- Monorepo structure.
- TypeScript configuration.
- Formatting/linting.
- Test framework.
- Docker Compose for PostgreSQL and Redis.
- Environment configuration.
- CI pipeline.
- Documentation baseline.

Acceptance:
- Fresh clone can install and run.
- Tests and lint pass.
- Database can be started locally.
- Secrets are not committed.

## 3. Milestone 1 — World and catalog

Deliver:
- User and world model.
- World initialization.
- World clock.
- Regions/cities.
- Product and industry catalog.
- Recipe catalog.
- Scenario seed.

Acceptance:
- Create a world from a versioned scenario.
- Validate initial world consistency.
- Load world state.
- Pause/resume clock.

## 4. Milestone 2 — Minimal companies and accounting

Deliver:
- Companies.
- Player company.
- AI company profile.
- Financial accounts.
- Journal entries and ledger postings.
- Opening balances.
- Basic company reports.

Acceptance:
- Every posted entry balances.
- Cash is derived from ledger state/projection.
- Company financial summary reconciles.

## 5. Milestone 3 — Inventory and production

Deliver:
- Warehouses.
- Inventory balances and movements.
- Production recipes.
- Production lines and jobs.
- Input reservations and output creation.

Acceptance:
- A factory consumes wheat and electricity to produce flour.
- No production can consume the same inventory twice.
- Inventory movement history reconciles to balances.

## 6. Milestone 4 — Wholesale market

Deliver:
- Markets.
- Buy/sell orders.
- Reservations.
- Matching algorithm.
- Trades.
- Settlement.
- Market statistics.

Acceptance:
- Orders match according to documented price/time priority.
- Partial fills work.
- Duplicate processing cannot duplicate trades.
- Money and inventory reconcile after settlement.

## 7. Milestone 5 — Consumers and retail demand

Deliver:
- Population cohorts.
- Household budget model.
- Product demand.
- Retail businesses.
- Retail allocation and sales.
- Price response.

Acceptance:
- Demand is budget constrained.
- Sales cannot exceed stock or allocated demand.
- Price changes have expected directional effects.

## 8. Milestone 6 — Simulation worker

Deliver:
- Tick state machine.
- Daily phase pipeline.
- BullMQ worker.
- Database claim/lease.
- Retry and idempotency.
- World snapshots.
- Offline catch-up.

Acceptance:
- A 90-day scenario completes.
- Worker failure can be retried without duplicate effects.
- World can be restored/resumed.
- Tick results are reproducible for fixed seed and model version.

## 9. Milestone 7 — AI companies

Deliver:
- Strategy templates.
- Decision context.
- Candidate actions.
- Scoring and constraints.
- Procurement/production/pricing decisions.
- Decision logs.

Acceptance:
- AI companies act without player input.
- AI actions use the same domain constraints as player actions.
- AI companies can make profit or loss.
- AI does not create free inventory or money.

## 10. Milestone 8 — Economic events and reporting

Deliver:
- Event definitions and activation.
- Supply shocks.
- Price/market indicators.
- Industry reports.
- News generated from simulation events.
- Company and world dashboards.

Acceptance:
- A drought changes agricultural capacity.
- Downstream impacts are calculated through the economy.
- Reports agree with underlying state.

## 11. Milestone 9 — Playable first release

Deliver:
- Story chapter and missions.
- Sandbox configuration.
- Business creation and upgrades.
- Retail and manufacturing experience.
- Finance and competitor screens.
- Save/load and onboarding.
- UI polish and accessibility.

Acceptance:
- A new player can start, operate a business, expand and complete the first campaign objectives.
- All financial and inventory changes are authoritative and auditable.
- The game remains understandable and responsive.

## 12. Future milestone — Advanced economy

Potential additions:
- Labor market depth.
- Banking and credit risk.
- Government policy.
- International trade.
- Financial securities.
- Mergers and acquisitions.
- More industries and regions.
- Advanced logistics and product substitution.

## 13. Future multiplayer milestone

Only after the single-player game is stable:
- Shared worlds.
- Membership and permissions.
- Player-to-player trading.
- Shared market concurrency.
- Fair scheduling and synchronization.
- Anti-exploit and abuse protections.

## 14. Definition of done

A feature is done when:
- Requirements and domain rules are documented.
- Database constraints and migrations are reviewed.
- Unit and integration tests cover invariants.
- API contract is documented.
- Errors and logs are actionable.
- UI handles loading, stale data and failure.
- Financial/inventory side effects are auditable.
- Performance is measured for the intended scale.
- Documentation is updated.
