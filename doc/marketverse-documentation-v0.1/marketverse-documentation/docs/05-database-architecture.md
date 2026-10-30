# MV-005 — Database Architecture

**Version:** 0.1.0 | **Status:** Logical design; physical schema to follow

## 1. Database strategy

PostgreSQL is the authoritative store for world state, companies, inventories, orders, trades, accounting and simulation progress. Redis is an operational cache/queue dependency, not a source of truth.

Use Prisma for schema/migrations and ordinary application persistence. Use Kysely or parameterized SQL for complex reporting, batch operations and carefully reviewed market/simulation queries.

The schema is relational and normalized for transactional state. Analytical read models may be added separately when justified.

## 2. Data categories

### Global definitions
Reusable across worlds:
- Product categories and products.
- Industry definitions.
- Recipe definitions and recipe versions.
- Facility types.
- AI strategy templates.
- Scenario templates.
- Units of measure and conversion rules.

### World-scoped state
Belongs to a game world:
- Regions and cities instantiated in the world.
- Population cohorts.
- Companies and businesses.
- Facilities and employees.
- Inventories and shipments.
- Markets, orders and trades.
- Accounts, loans and ledger entries.
- Active policies and events.
- Simulation clock and snapshots.

### Historical/append-oriented records
- Inventory movements.
- Trades.
- Journal entries and postings.
- Simulation events.
- AI decision logs.
- Price observations.
- Tick and phase records.

## 3. Core logical entities

### 3.1 Identity and world

**User**
- id
- email/identity provider fields
- status
- created_at

**GameWorld**
- id
- owner_user_id
- name
- scenario_id/version
- status
- currency_code
- random_seed
- model_version
- created_at

**WorldParticipant**
- id
- world_id
- user_id
- role
- joined_at

Initial rule: one human participant per world. The relationship is modeled separately so future shared-world membership does not require redesigning all world entities.

**WorldClock**
- world_id
- current_tick
- calendar_year/month/day
- simulation_speed
- paused
- last_completed_at
- last_real_activity_at

Use a single authoritative clock record per world.

### 3.2 Geography and population

**WorldRegion**
- id, world_id, region_definition_id, name/code, modifiers

**WorldCity**
- id, world_id, region_id, city_definition_id, name, infrastructure state

**PopulationCohort**
- id, world_id, city_id, cohort_definition_id, household_count, income distribution, employment and preference state

A cohort is an aggregate. Do not create a row per citizen in the initial release.

### 3.3 Catalog and production

**Product**
- id, code, name, category_id, unit_id, product_type, shelf_life configuration, reference price

**Industry**
- id, code, name, description

**ProductionRecipe**
- id, recipe_code, version, output product, batch duration, status

**RecipeInput**
- recipe_id, input_product_id, quantity_per_batch

**RecipeOutput**
- recipe_id, output_product_id, quantity_per_batch

Recipes should be versioned. Existing production jobs must retain the recipe version under which they started.

### 3.4 Companies and facilities

**Company**
- id, world_id, company_code, name, company_type, status, headquarters_city_id, founded_tick

Company type distinguishes player, AI and institutional entities. Do not store AI behavior only as an unstructured text field.

**AICompanyProfile**
- company_id, strategy_template_id, risk_tolerance, planning parameters, decision cadence

**CompanyOwnership**
- id, world_id, company_id, owner_type, owner_id, ownership_percentage, effective_from_tick, effective_to_tick

The initial player may own 100% of their company. Future share ownership should use a more formal equity/ownership model.

**Business**
- id, world_id, company_id, business_type, name, city_id, status

**Facility**
- id, world_id, company_id, business_id, facility_type, city_id, capacity, status

**ProductionLine**
- id, world_id, facility_id, recipe_id/version, capacity, efficiency, status

### 3.5 Inventory and logistics

**Warehouse**
- id, world_id, facility_id, capacity and location

**InventoryBalance**
- id, world_id, warehouse_id, product_id, quantity_on_hand, quantity_reserved, version

Unique key: `(world_id, warehouse_id, product_id)`.

**InventoryMovement**
- id, world_id, product_id, source_location, destination_location, quantity, movement_type, reference_type/id, tick_number, created_at

Movements are append-only. Balance changes and movement insertion must occur in one transaction.

**Shipment**
- id, world_id, origin, destination, carrier, status, dispatch_tick, expected_arrival_tick, actual_arrival_tick

### 3.6 Procurement and markets

**SupplierRelationship**
- id, world_id, buyer_company_id, supplier_company_id, product_id, terms, status

**SupplyContract**
- id, world_id, buyer_id, seller_id, product_id, quantity, price, delivery schedule, status

**Market**
- id, world_id, product_id, market_type, region_id, status

**MarketOrder**
- id, world_id, market_id, participant_company_id or cohort reference, side, quantity_total, quantity_remaining, limit_price, status, created_tick, expiry_tick, time_priority

**MarketTrade**
- id, world_id, market_id, buy_order_id, sell_order_id, buyer_id, seller_id, quantity, unit_price, gross_amount, fees, settlement_status, tick_number

Order matching and settlement must be transactional and idempotent.

### 3.7 Finance

**FinancialAccount**
- id, world_id, owner_type, owner_id, account_code, account_type, currency_code, status

**JournalEntry**
- id, world_id, transaction_reference, entry_date/tick, description, status, posted_at

**LedgerPosting**
- id, world_id, journal_entry_id, financial_account_id, debit_minor_units, credit_minor_units, currency_code

For each posted journal entry and currency, total debits must equal total credits. Use a posting service and database transaction. Posted entries are immutable; corrections use reversal entries.

**Loan**
- id, world_id, lender_company_id, borrower_company_id, principal, outstanding_principal, interest_rate, start_tick, maturity_tick, status

**LoanPayment**
- id, world_id, loan_id, due_tick, principal_due, interest_due, paid amounts, status

### 3.8 Simulation

**SimulationTick**
- id, world_id, tick_number, status, model_version, started_at, completed_at, error_code

Unique key: `(world_id, tick_number)`.

**SimulationPhaseRun**
- id, world_id, tick_number, phase_name, status, attempt, operation_count, started_at, completed_at

Unique key: `(world_id, tick_number, phase_name)` if phases are single-run; otherwise use a run/attempt model with a separate canonical completion record.

**SimulationEvent**
- id, world_id, tick_number, sequence, event_type, schema_version, aggregate_type/id, payload, correlation_id

**WorldSnapshot**
- id, world_id, tick_number, schema_version, model_version, storage_reference or payload, checksum, status

**AIDecisionLog**
- id, world_id, company_id, tick_number, decision_type, input_summary, alternatives_summary, chosen_action, expected_outcome, result_reference

Do not store enormous raw model inputs in decision logs. Keep enough information to explain and debug a decision.

## 4. Key relationships

- User 1..N GameWorld (ownership).
- GameWorld 1..N WorldParticipant.
- GameWorld 1..N Company.
- Company 1..N Business.
- Company 1..N Facility.
- Facility 1..N Warehouse/ProductionLine.
- Warehouse 1..N InventoryBalance.
- Product 1..N InventoryBalance across worlds and warehouses.
- Product 1..N Market per world/region/market type.
- Market 1..N MarketOrder.
- MarketTrade references one buy order and one sell order.
- Company 1..N FinancialAccount.
- JournalEntry 1..N LedgerPosting.
- GameWorld 1..N SimulationTick.
- SimulationTick 1..N SimulationPhaseRun.
- GameWorld 1..N SimulationEvent and WorldSnapshot.

## 5. World isolation and constraints

Every mutable world-owned table must contain `world_id` directly or through a strictly enforced parent relationship. For critical cross-entity references, use composite foreign keys such as `(world_id, company_id)` to prevent cross-world references.

Examples:
- An order's company must belong to the same world as the order.
- A warehouse and inventory balance must belong to the same world.
- A trade's orders and market must belong to the same world.
- A business and its parent company must belong to the same world.

Application checks alone are insufficient for critical isolation.

## 6. Money and quantity types

- Store currency as a world currency code and integer minor units where currency precision is fixed.
- If multi-currency or fractional rates are required, use PostgreSQL NUMERIC with explicit precision and scale.
- Use integer or NUMERIC quantities with unit-of-measure metadata.
- Avoid JavaScript `number` for monetary settlement.
- Define rounding rules for tax, interest, unit price and partial fills.

## 7. Inventory invariants

- `quantity_on_hand >= 0`.
- `quantity_reserved >= 0`.
- `quantity_reserved <= quantity_on_hand`.
- Available quantity = on hand minus reserved.
- A committed trade cannot consume inventory twice.
- Every adjustment has a movement record and reference.
- Transfers reduce source and increase destination atomically, or use an in-transit state.

## 8. Accounting invariants

- Posted journal entries balance per currency.
- Every financial account belongs to an owner and world.
- Posted entries cannot be edited or deleted through normal application operations.
- Reversals reference the original entry.
- Financial reports derive from ledger postings or reconciled accounting projections.
- Cash balance is not an independently editable number; it is an account balance derived from postings or a reconciled projection.

## 9. Indexing strategy

Initial candidates:
- `companies(world_id, status)`
- `businesses(world_id, company_id, status)`
- `inventory_balances(world_id, warehouse_id, product_id)` unique
- `market_orders(world_id, market_id, side, status, limit_price, created_tick)`
- `market_trades(world_id, market_id, tick_number)`
- `ledger_postings(world_id, financial_account_id, journal_entry_id)`
- `simulation_ticks(world_id, tick_number)` unique
- `simulation_events(world_id, tick_number, sequence)` unique
- `world_snapshots(world_id, tick_number)` unique or versioned

Validate indexes with real query plans. Avoid indexing every column.

## 10. Partitioning and retention

Do not partition at the start. First measure volume and query patterns.

Potential future partition candidates:
- Market price observations.
- Simulation events.
- AI decision logs.
- High-volume trade history.

Use retention/archival policies for verbose diagnostic data. Financial ledger records should follow stricter retention and integrity requirements.

## 11. Prisma and Kysely responsibilities

Prisma:
- Schema definitions.
- Migrations.
- Standard CRUD.
- Relations and transaction orchestration where supported.

Kysely/SQL:
- Complex reports.
- Bulk simulation updates.
- Market order selection.
- Analytical aggregations.
- Carefully optimized operations.

Do not maintain two competing schema definitions. Prisma migrations remain the canonical schema history; raw SQL changes must be included in reviewed migrations.

## 12. Migration order

1. Identity and worlds.
2. Geography and population.
3. Product/industry catalogs and recipes.
4. Companies and facilities.
5. Inventory.
6. Markets and orders.
7. Trades and settlement.
8. Finance and ledger.
9. Simulation ticks/events/snapshots.
10. AI profiles and decision logs.
11. Story and missions.

Create migrations only after the corresponding domain specification is accepted.
