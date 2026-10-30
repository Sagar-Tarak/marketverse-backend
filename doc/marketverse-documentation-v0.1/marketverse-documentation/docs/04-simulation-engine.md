# MV-004 — Simulation Engine Specification

**Version:** 0.1.0 | **Status:** Proposed execution design

## 1. Responsibilities

The simulation engine advances a world from one logical state to another. It owns the ordering and orchestration of economic phases, but domain packages own calculations.

The engine must:
- Advance logical world time.
- Execute phases in a documented order.
- Ensure a tick is not applied twice.
- Record inputs, outputs and events.
- Persist checkpoints and progress.
- Support deterministic replay for supported scenarios.
- Recover safely after worker failure.

## 2. Execution model

Use a discrete daily tick initially. The engine may execute many worlds in batches. Do not create one permanently running process per world.

A tick is identified by `(world_id, tick_number)`. It has a status such as pending, running, completed or failed. A world must have at most one active tick at a time.

A tick should be processed as a sequence of bounded phases. Each phase should be idempotent or protected by a durable phase checkpoint.

## 3. Daily phase order

Proposed phase order:

1. **Load and validate:** Load world version, clock, configuration and required state.
2. **Apply scheduled changes:** Activate/expire events, policies and contracts.
3. **Update external conditions:** Weather/resource/infrastructure modifiers.
4. **Calculate household state:** Income, employment, budgets and savings updates.
5. **Generate demand:** Household and business demand estimates/orders.
6. **AI planning:** Companies evaluate prices, procurement, production, labor and investment.
7. **Procurement:** Submit and process purchase requests.
8. **Production start:** Reserve inputs and capacity; schedule completion.
9. **Production completion:** Complete jobs whose due tick has arrived.
10. **Wholesale market clearing:** Match eligible orders and settle trades.
11. **Retail allocation:** Allocate consumer demand across retail businesses.
12. **Logistics:** Process shipments and deliveries according to schedule.
13. **Financial settlement:** Wages, rent, utilities, taxes, debt payments and other due obligations.
14. **Company accounting:** Close period entries and compute operational results.
15. **Economic indicators:** Calculate market and macro statistics.
16. **Story/objectives:** Evaluate mission conditions and unlocks.
17. **Persist and publish:** Store tick result, world clock, events and notifications.

The exact ordering of procurement, production and clearing may evolve after prototype experiments. It must remain explicit and tested.

## 4. Tick state machine

`PENDING -> RUNNING -> COMPLETED`

Failure path:
`RUNNING -> FAILED -> RETRYABLE or NEEDS_REPAIR`

A retry must not duplicate:
- Trades.
- Ledger postings.
- Inventory movements.
- Production output.
- Taxes.
- Wages.
- Rewards.

Use unique operation keys such as `(world_id, tick_number, phase, operation_key)` and database uniqueness constraints.

## 5. Determinism

Determinism requires:
- A stored random seed and controlled random stream.
- Stable ordering of entities and decisions.
- Explicit rounding rules.
- No dependence on unordered database results.
- No hidden wall-clock reads in domain calculations.
- Versioned economic rules.
- Controlled external inputs.

A simulation run is reproducible only if initial state, seed, model version, event inputs and execution rules are the same.

Parallel processing can introduce nondeterministic ordering. Parallelize only independent calculations, then apply results in a stable order or use deterministic partitioning.

## 6. Domain engine interface

Conceptual interface:

```ts
interface SimulationContext {
  worldId: string;
  tickNumber: number;
  modelVersion: string;
  random: SeededRandom;
}

interface SimulationPhase {
  name: string;
  execute(context: SimulationContext): Promise<PhaseResult>;
}

interface PhaseResult {
  operationCount: number;
  emittedEvents: DomainEvent[];
  metrics: Record<string, number>;
}
```

This is illustrative. Domain calculations should be pure functions where practical. Persistence and orchestration belong in application adapters.

## 7. Scheduling and workers

BullMQ can schedule and distribute work, but PostgreSQL remains the source of truth for tick ownership and completion.

A queue job should contain identifiers, not a large mutable copy of world state. The worker loads authoritative state, claims the tick, executes phases and persists progress.

Use:
- Unique job IDs.
- Database lease/claim with expiry.
- Worker heartbeat or lease renewal for long jobs.
- Retry policy with bounded attempts.
- Dead-letter or repair workflow.
- Metrics for tick duration and backlog.

A Redis lock alone is not sufficient for financial correctness. Database constraints and transactions must protect critical state.

## 8. Offline progression

Store:
- Last completed tick.
- World calendar.
- Last real-world activity time, if offline progression is tied to wall time.
- Catch-up policy.
- Maximum catch-up window.
- Model version.

On resume:
1. Determine eligible elapsed time according to world settings.
2. Convert elapsed time to game ticks.
3. Enqueue bounded catch-up batches.
4. Process ticks in order.
5. Report progress and final state.

Offline progression must not bypass costs, inventory, production constraints or mission rules. The game may cap catch-up or use summarized calculations for long absences, but any approximation must be documented.

## 9. Snapshots and recovery

A snapshot is a consistent checkpoint, not merely a dump of selected tables.

Snapshot metadata:
- World ID.
- Completed tick.
- Schema version.
- Model version.
- Snapshot format version.
- Creation time.
- Checksum.
- Status.

A recovery process restores a snapshot and replays subsequent durable events or state transitions where replay is supported. If the design uses persisted state per tick rather than event sourcing, recovery must instead rely on transactional state and a consistent snapshot. Do not claim full event sourcing unless all required state transitions are captured.

## 10. Event model

Use domain events to describe meaningful changes:
- `InventoryReceived`
- `InventoryConsumed`
- `ProductionCompleted`
- `OrderMatched`
- `TradeSettled`
- `LoanIssued`
- `LoanPaymentDue`
- `CompanyInsolvent`
- `EconomicShockActivated`

Events should have:
- Event ID.
- World ID.
- Aggregate/entity ID.
- Event type and schema version.
- Tick number.
- Occurrence sequence.
- Payload.
- Correlation/causation IDs.

Use a transactional outbox when publishing committed events to external queues or realtime channels.

## 11. Performance strategy

Start with a small world. Measure before optimizing.

Potential optimizations:
- Batch database reads/writes.
- Aggregate cohorts rather than individuals.
- Process major companies individually and microbusinesses statistically.
- Precompute recipe and market lookup data.
- Use incremental indicator calculations.
- Partition by world for independent worlds.
- Keep simulation writes bounded per tick.
- Archive old analytical history when needed.

Do not introduce microservices, distributed databases or complex stream processing before profiling demonstrates a need.

## 12. Operational invariants

After every completed tick:
- No inventory balance is negative unless explicit backorder semantics permit it.
- Every settled trade has matching inventory and financial effects.
- Every posted journal entry balances.
- No order quantity is filled beyond its remaining quantity.
- No production job consumes the same reservation twice.
- World clock and completed tick agree.
- A completed tick cannot be applied again.
