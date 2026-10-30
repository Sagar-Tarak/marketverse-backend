# Module map — 80 tables → NestJS modules

Modular monolith with flat modules in the office `nest-backend` style. One database, one schema; module boundaries are enforced in code, not by separate databases.

## 1. Modules and the tables they own

| Module | Tables (owner) | # | Weight |
|---|---|---|---|
| `identity` | users, idempotency_keys | 2 | light |
| `worlds` | game_worlds, world_participants, world_clocks, world_policies, economic_shocks | 5 | light |
| `catalog` | units_of_measure, unit_conversions, product_categories, industries, products, facility_types, production_recipes, recipe_inputs, recipe_outputs, skill_groups | 10 | light (read-mostly, seeded) |
| `geography` | scenario_templates, region_definitions, city_definitions, world_regions, world_cities, transport_routes | 6 | light |
| `population` | cohort_definitions, population_cohorts, labor_pools | 3 | medium (batch updates per tick) |
| `companies` | companies, company_ownerships, businesses, facilities, facility_workforces | 5 | light |
| `production` | production_lines, production_jobs | 2 | medium |
| `ai` | ai_strategy_templates, ai_company_profiles, ai_decision_logs | 3 | medium (pure decision functions) |
| `inventory` | warehouses, inventory_balances, inventory_reservations, inventory_movements, shipments, shipment_lines | 6 | **heavy** (invariants) |
| `markets` | markets, market_orders, market_trades, market_price_observations, supplier_relationships, supply_contracts, consumer_demands, retail_allocations | 8 | **heavy** (matching, settlement) |
| `finance` | financial_accounts, account_balances, journal_entries, ledger_postings, loans, loan_payments, tax_assessments, company_period_results | 8 | **heavy** (ledger) |
| `simulation` | simulation_ticks, simulation_phase_runs, simulation_events, outbox_messages, world_snapshots, economic_indicators | 6 | **heavy** (orchestration) |
| `progression` | unlock_definitions, mission_definitions, mission_prerequisites, mission_objective_definitions, mission_rewards, world_missions, world_mission_objectives, world_unlocks, research_definitions, company_researches, license_definitions, company_licenses, company_reputations | 13 | medium |
| `notifications` | notifications, news_articles | 2 | light |
| `audit` | audit_logs | 1 | light |
| | **Total** | **80** | |

Every module is **flat**, like the office `nest-backend` project (section 4). "Heavy" modules are the ones that outgrow one service file: they split into `services/` by real concern and keep pure business rules as plain functions in `functions/`. There are no layer folders, repositories or ports.

## 2. Dependency direction (no cycles)

```
identity   catalog
    └── worlds ──── geography
                       ├── population
                       └── companies ──┬── production
                                       ├── inventory
                                       ├── finance
                                       └── ai
                inventory + finance ──── markets
   everything above ──(events / app interfaces)──► simulation, progression, notifications, audit
```

- A module may depend only on modules above it. It imports their `*.module.ts` and calls their **exported services**, never their internals. `test/architecture` fails on import cycles.
- Going **up** (e.g. markets telling progression a trade settled) is done with **domain events** through the outbox, never with imports.
- Cross-module references are by id only. Database foreign keys (`markets → companies`, composite on `world_id`) are allowed; code imports across module internals are not.
- `simulation` orchestrates by calling phases that each module exposes; it does not contain business rules.

## 3. Prisma vs Kysely

| Use | Tool | Where |
|---|---|---|
| Schema, `db push`, generated types | Prisma | all |
| Simple CRUD and reads | Prisma | identity, worlds, catalog, geography, companies, production, ai profiles, progression, notifications, audit |
| Order selection and matching snapshot | Kysely | markets |
| Trade settlement, inventory balance + movement | Kysely, one transaction | inventory, markets |
| Posting journal entries, balance projection, reports | Kysely | finance |
| Bulk per-tick updates (cohorts, demand, allocations) | Kysely | population, markets |
| Indicators and period results (aggregates) | Kysely | simulation, finance |

**Hard rule:** one unit of work uses **one** tool. A Prisma interactive transaction and a Kysely transaction are different connections and cannot be joined. Anything touching money or stock uses Kysely only, inside a single `trx`. Types for Kysely come from `prisma-kysely` (not installed yet, and it needs a direct `pg` pool).

## 4. Folder layout per module

```
src/modules/<name>/
  <name>.module.ts
  <name>.controller.ts      # routes only
  <name>.service.ts         # logic + Prisma/Kysely + transactions
  <name>.service.spec.ts    # unit test, Prisma stubbed
  schemas/<name>.schema.ts  # request DTOs + response view types
  configs/                  # only for query-engine list whitelists (not built yet)
  services/, functions/     # only when one service outgrows a file (gps/ storage/ style)
  adapters/                 # only for external providers (one adapter per vendor + registry)
```

Reference: `src/modules/catalog/`. Recipes in `CLAUDE.md`.

`src/simulation/` stays a **pure engine** (phase functions, seeded RNG, no NestJS/Prisma/Redis imports, per doc 06). `src/modules/simulation/` is its shell: ticks, leases, outbox, BullMQ scheduling.

## 5. Where the invariants live

| Invariant | Enforced in |
|---|---|
| Debits = credits, posted entries immutable | database triggers (`constraints.sql`) + `finance` posting service |
| Stock never negative, reserved ≤ on hand | database `CHECK` + `inventory` service (optimistic `version`) |
| Cross-world links impossible | composite foreign keys |
| Retried tick does not duplicate effects | unique `operation_key` / `trade_key` + `idempotency_keys` |
| One running tick per world | partial unique index + lease in `simulation` |
| One human owner per world | partial unique index; `worlds` rule for "one participant" |

## 6. Build order

1. `identity`, `catalog` (catalog is already seeded)
2. `worlds`, `geography`
3. `companies`, `population`
4. `inventory`, `finance`, `production`
5. `markets`
6. `simulation` shell + pure engine, `ai`
7. `progression`, `notifications`, `audit`

World creation (doc 02 §12) is one use case in `worlds` that calls exported services of the modules above it, in one transaction.

## 7. Open points

- `test/architecture/module-boundaries.spec.ts` checks for import cycles between modules (Vitest, no extra dependency).
- Kysely needs `kysely`, `pg` and `prisma-kysely` added when the first heavy module starts.
- `audit` and `notifications` could fold into `common/` if they stay this small.
