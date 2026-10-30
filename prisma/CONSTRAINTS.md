# Constraints Prisma cannot express

The executable version is `prisma/constraints.sql`, applied by `pnpm db:sync` after every `db push`.
This file is the readable summary; keep both in step. There are no migration files: local
development uses `pnpm db:sync`. Cut a baseline migration (including `constraints.sql`) before
the first shared database.
All columns are snake_case as in the generated SQL.

## CHECK constraints

| Table | Rule |
|---|---|
| `world_clocks` | `current_tick >= 0`; `calendar_month BETWEEN 1 AND 12`; `calendar_day BETWEEN 1 AND 31`; `simulation_speed > 0` |
| `game_worlds` | `currency_code ~ '^[A-Z]{3}$'` |
| `inventory_balances` | `quantity_on_hand >= 0`; `quantity_reserved >= 0`; `quantity_reserved <= quantity_on_hand` |
| `inventory_reservations` | `quantity > 0` |
| `inventory_movements` | `quantity > 0`; source or destination not both null |
| `shipment_lines` | `quantity > 0` |
| `market_orders` | `quantity_total > 0`; `quantity_remaining >= 0`; `quantity_remaining <= quantity_total`; `limit_price_minor > 0`; `reserved_funds_minor >= 0` |
| `market_trades` | `quantity > 0`; `unit_price_minor > 0`; `gross_amount_minor >= 0`; `fees_minor >= 0`; `buy_order_id <> sell_order_id`; `buyer_company_id <> seller_company_id` |
| `ledger_postings` | `debit_minor_units >= 0`; `credit_minor_units >= 0`; exactly one of the two is `> 0` |
| `financial_accounts` | exactly one of `company_id`, `cohort_id` is not null |
| `company_ownerships` | exactly one of `owner_user_id`, `owner_company_id` is not null; matches `owner_type`; `ownership_percentage BETWEEN 0 AND 100` |
| `population_cohorts` | `household_count >= 0`; `employed_workforce >= 0`; `unemployed_workforce >= 0` |
| `loans` | `principal_minor > 0`; `outstanding_principal_minor BETWEEN 0 AND principal_minor`; `maturity_tick > start_tick` |
| `facility_workforces` | `headcount >= 0` |
| `supply_contracts` | `quantity_per_delivery > 0`; `unit_price_minor > 0`; `delivery_interval_ticks > 0` |
| `production_jobs` | `batches > 0`; `due_tick >= start_tick` |
| `transport_routes` | `distance_km >= 0`; `transit_ticks >= 0`; `from_city_id <> to_city_id` |

### Gap-filling additions

| Table | Rule |
|---|---|
| `labor_pools` | `workforce >= 0`; `employed BETWEEN 0 AND workforce`; `wage_rate_minor >= 0`; `productivity > 0` |
| `facility_workforces` | `headcount >= 0` |
| `products` | `transport_factor >= 0` |
| `companies` | `credit_score BETWEEN 0 AND 1000` |
| `world_clocks` | `max_catch_up_ticks >= 0` |
| `game_worlds` | `starting_capital_minor >= 0` |
| `tax_assessments` | `rate >= 0`; `amount_minor >= 0`; `taxable_base_minor >= 0`; `period_end_tick >= period_start_tick` |
| `research_definitions` | `cost_minor >= 0`; `duration_ticks > 0` |

## Partial / special indexes

- `company_licenses`: unique `(world_id, company_id, license_id)` WHERE `region_id IS NULL`.
- `simulation_ticks`: unique `(world_id)` WHERE `status = 'RUNNING'`. One active tick per world.
- `world_participants`: unique `(world_id)` WHERE `role = 'OWNER'`. One owner per world.
- `journal_entries`: unique `(world_id, reverses_entry_id)` already exists. Add `reverses_entry_id IS NULL OR status <> 'DRAFT'` as a CHECK if reversals must be posted.

## Triggers (database-level invariants)

- **Journal balance**: deferred constraint trigger on `ledger_postings`. At commit, for each posted `journal_entry_id` and `currency_code`, `SUM(debit_minor_units) = SUM(credit_minor_units)`.
- **Immutability**: block `UPDATE` and `DELETE` on `ledger_postings` and `inventory_movements`; block changes to a `journal_entries` row once `status = 'POSTED'` (except moving to `REVERSED`).

## Known limits

- `markets` unique key includes nullable `region_id`. Postgres treats NULLs as distinct, so world-wide uniqueness per `(product, market_type)` is enforced in the service layer, or by a second partial unique index WHERE `region_id IS NULL`.
- `economic_indicators` has the same nullable `region_id` in its unique key. Add the same partial index.
- "One human participant per world" is a service rule, deliberately not a constraint (shared worlds later).
