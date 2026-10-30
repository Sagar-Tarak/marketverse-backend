# MV-009 — Testing, Operations & Security

**Version:** 0.1.0 | **Status:** Engineering baseline

## 1. Testing philosophy

Economic correctness is a product requirement. Tests must verify not only that endpoints respond, but that the world remains internally consistent after many simulation cycles.

## 2. Test layers

### Unit tests
Test pure calculations:
- Demand response.
- Production recipe conversion.
- Price statistics.
- Market matching.
- AI action scoring.
- Tax/interest calculations.
- Cohort budget allocation.

### Domain tests
Test invariants:
- Production cannot consume unavailable inputs.
- Orders cannot fill beyond remaining quantity.
- Inventory cannot become negative.
- Posted journal entries balance.
- Company cannot spend beyond permitted funds/credit.
- Cross-world references are rejected.

### Integration tests
Use a real PostgreSQL instance, preferably through Testcontainers:
- Transactions and rollback.
- Constraints and foreign keys.
- Concurrent order settlement.
- Inventory reservation.
- Ledger posting.
- Simulation phase retry.
- Migration correctness.

### Simulation scenario tests
Run a world for a fixed number of ticks and assert expected directional behavior:
- Supply shock raises shortage pressure.
- Capacity expansion increases feasible output.
- Higher input costs reduce margins if prices do not adjust.
- Recession reduces discretionary demand.
- A supplier failure creates procurement risk.
- A company with sustained negative cash flow may become distressed.

Avoid brittle tests that assert an exact economic result unless the model and seed make that exact result intentional.

### End-to-end tests
- Register/login.
- Create world.
- Start business.
- Purchase inventory.
- Make sales.
- View reports.
- Save and resume.
- Advance simulation.
- Recover after simulated worker failure.

## 3. Economic validation

Maintain scenario fixtures with:
- Initial state.
- Random seed.
- Model version.
- Scenario inputs.
- Expected invariants.
- Expected directional outcomes.
- Recorded metrics.

Compare model versions to identify unintended changes.

## 4. Load and performance testing

Measure:
- Tick duration by phase.
- Number of companies processed.
- Number of orders matched.
- Database queries and rows written.
- Queue lag.
- Memory usage.
- World resume/catch-up time.
- API latency.

Start with a modest prototype world. Define performance budgets after measuring it. Do not claim a target number of companies or worlds until benchmarks support it.

## 5. Observability

Use structured logs with:
- Request ID.
- World ID.
- Tick number.
- Phase name.
- Company/market ID where appropriate.
- Operation/idempotency key.
- Error code.

Metrics:
- Tick duration and failures.
- Phase retries.
- Queue depth and age.
- Orders submitted/matched/rejected.
- Settlement failures.
- Inventory invariant violations.
- Ledger imbalance attempts.
- API latency and error rate.

OpenTelemetry can provide traces. Prometheus/Grafana can provide metrics and dashboards. Keep high-cardinality identifiers out of metric labels; use logs/traces for detailed identifiers.

## 6. Security

- Hash passwords with a modern password hashing algorithm.
- Use secure session/token handling and rotation.
- Validate every request.
- Enforce world ownership/membership on every world-scoped operation.
- Rate-limit authentication and sensitive commands.
- Protect against IDOR and cross-world data access.
- Keep secrets out of source control.
- Use least-privilege database credentials.
- Encrypt transport with TLS in production.
- Audit sensitive financial and ownership actions.
- Do not trust client-supplied balances, prices or simulation results.

## 7. Financial and inventory integrity

Critical commands must be transactional and idempotent.

A market trade settlement should:
1. Verify order states and remaining quantities.
2. Verify reservations.
3. Create trade record with unique operation key.
4. Move inventory.
5. Post balanced ledger entries.
6. Update order quantities/status.
7. Commit atomically.

If any step fails, the transaction must roll back. If settlement spans asynchronous delivery, model it as explicit states and do not treat goods as delivered before arrival.

## 8. Backup and recovery

- Automated PostgreSQL backups.
- Periodic restore drills.
- Point-in-time recovery if supported by hosting.
- Snapshot integrity checks.
- Versioned world snapshots.
- Documented recovery procedure.
- Backup encryption and access restrictions.

A backup is not proven until it has been restored and validated.

## 9. Deployment

Initial deployment can use:
- Static frontend hosting.
- One API service.
- One simulation worker service.
- PostgreSQL.
- Redis.
- Object storage later for large snapshots/assets.

Use Docker for local development and repeatable deployment. CI should run lint, typecheck, unit tests, integration tests and migration validation.

## 10. Operational failure cases

Test:
- Worker crashes during a phase.
- Redis becomes unavailable.
- PostgreSQL connection drops.
- Duplicate queue delivery.
- User retries a command.
- Snapshot is corrupted.
- A tick is stuck in running state.
- A migration fails.
- An old client submits a stale command.

Define a safe repair process. Never manually edit balances to “fix” a financial inconsistency without an auditable correction.
