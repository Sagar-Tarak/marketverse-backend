# Seed data design — scenario `NOVARA_PROTOTYPE` v1

Design only. Source: `doc/.../02-novara-world-and-economy.md`, `03`, `07`. All values are balancing inputs, not facts.

## 1. Two kinds of seed

| Kind | When | Tables | Idempotent by |
|---|---|---|---|
| **A. Reference seed** | `prisma db seed`, any environment | units, conversions, categories, industries, products, facility types, recipes (+inputs/outputs), AI strategy templates, scenario template + region/city/cohort definitions, mission/unlock definitions | upsert on natural key (`code`, or `code`+`version`) |
| **B. World instantiation** | A use case at world creation (doc 02 §12), never a seed script | world clock, world regions/cities, cohorts, routes, companies, businesses, facilities, warehouses, balances, markets, accounts, opening ledger, policies, shocks | one transaction per world; fails if opening ledger unbalanced |

Rule: A is shared and versioned. B copies from A. Editing A never changes an existing world.

## 2. Reference seed (A)

### Units (`units_of_measure`)
| code | name | dimension |
|---|---|---|
| `KG` | kilogram | MASS |
| `T` | tonne | MASS |
| `L` | litre | VOLUME |
| `KWH` | kilowatt-hour | ENERGY |
| `EA` | each | COUNT |
| `HR` | labor-hour | TIME |

Conversions: `T → KG` factor `1000`, `KG → T` factor `0.001`.

### Categories and industries
- Categories: `AGRICULTURE`, `FOOD`, `ENERGY`.
- Industries (prototype subset of doc §6): `AGRICULTURE`, `FOOD_PROCESSING`, `ENERGY_UTILITIES`, `RETAIL_DISTRIBUTION`.

### Currency
`NVR`, 2 minor units. 1.00 NVR = 100 minor. Start date `2030-01-01`.

### Products (`reference_price_minor` per unit)
| code | unit | type | category | ref price | shelf life (ticks) |
|---|---|---|---|---|---|
| `WHEAT` | KG | RAW_MATERIAL | AGRICULTURE | 16 | 180 |
| `FLOUR` | KG | INTERMEDIATE | FOOD | 45 | 90 |
| `BREAD` | EA | FINISHED_GOOD | FOOD | 100 | 3 |
| `ELECTRICITY` | KWH | RAW_MATERIAL | ENERGY | 12 | 1 |
| `FUEL` | L | RAW_MATERIAL | ENERGY | 40 | none |

Electricity is storable with a 1-tick life, so it uses the same inventory path as every other product.

### Labor
Labor is a recipe field (`labor_per_batch`, in labor-hours), not a product. Reference wage: **1500 minor per labor-hour**.

Skill groups (`skill_groups`): `UNSKILLED`, `SKILLED`, `PROFESSIONAL`. Each region gets one `labor_pools` row per group at world creation; the 5-product prototype uses `UNSKILLED` and `SKILLED` only.

### Facility types
`WHEAT_FARM`, `FLOUR_MILL`, `BAKERY`, `POWER_PLANT`, `FUEL_WORKS`, `RETAIL_STORE`.

### Recipes (all version 1, status ACTIVE)
| code | facility | inputs / batch | outputs / batch | labor h | ticks |
|---|---|---|---|---|---|
| `WHEAT_FARM` | WHEAT_FARM | 40 L FUEL | 1000 KG WHEAT | 8 | 5 |
| `FLOUR_MILL` | FLOUR_MILL | 1000 KG WHEAT, 200 KWH ELECTRICITY | 800 KG FLOUR | 8 | 1 |
| `BAKERY_BREAD` | BAKERY | 40 KG FLOUR, 20 KWH ELECTRICITY | 100 EA BREAD | 4 | 1 |
| `POWER_PLANT` | POWER_PLANT | 200 L FUEL | 1000 KWH ELECTRICITY | 2 | 1 |
| `FUEL_WORKS` | FUEL_WORKS | none | 1000 L FUEL | 20 | 2 |

Margins at reference prices (recomputed, wage 1500/h):

| Recipe | Input cost | Labor | Total | Revenue | Margin |
|---|---|---|---|---|---|
| WHEAT_FARM | 40×40 = 1 600 | 8×1500 = 12 000 | 13 600 | 1000×16 = 16 000 | 2 400 (15.0%) |
| FLOUR_MILL | 1000×16 + 200×12 = 18 400 | 12 000 | 30 400 | 800×45 = 36 000 | 5 600 (15.6%) |
| BAKERY_BREAD | 40×45 + 20×12 = 2 040 | 6 000 | 8 040 | 100×100 = 10 000 | 1 960 (19.6%) |
| POWER_PLANT | 200×40 = 8 000 | 3 000 | 11 000 | 1000×12 = 12 000 | 1 000 (8.3%) |
| FUEL_WORKS | 0 | 30 000 | 30 000 | 1000×40 = 40 000 | 10 000 (25.0%) |

Every stage is profitable at start, with no circular dependency (fuel needs only labor).

### AI strategy templates (doc 07 §2)
`COST_LEADER`, `PREMIUM_SPECIALIST`, `AGGRESSIVE_EXPANDER`, `CONSERVATIVE_OPERATOR`, `INNOVATOR`, `OPPORTUNIST`. Each holds `weights` (profit, growth, risk, cash penalty) as JSON; exact weights are calibration work, set after the first simulation experiment.

### Scenario definitions
- 5 regions, 9 cities (see §6 below, the doc says 8).
- 3 cohort definitions: `LOW_INCOME`, `MIDDLE_INCOME`, `HIGH_INCOME`.

| Cohort | household share | household size | income / household / day (minor) | price sensitivity | savings propensity |
|---|---|---|---|---|---|
| LOW_INCOME | 40% | 3.4 | 8 000 | 0.9 | 0.02 |
| MIDDLE_INCOME | 45% | 2.8 | 14 000 | 0.6 | 0.10 |
| HIGH_INCOME | 15% | 2.2 | 28 000 | 0.3 | 0.25 |

(Income is stored in `population_cohorts.disposable_income_minor` at instantiation, not in the definition.)

### Missions (minimal, can be added later)
`M01_FIRST_BATCH`, `M02_FIRST_SALE`, `M03_BREAK_EVEN`. Rewards funded by a government grant entry, never created from nothing.

## 3. Geography (reference + world)

| Region | City | x,y (km) | Households |
|---|---|---|---|
| Northvale | Greenford | 100,400 | 1 200 |
| Northvale | Millhaven | 180,430 | 800 |
| Eastport | Eastport | 520,300 | 1 500 |
| Eastport | Ironhaven | 470,360 | 1 000 |
| Westbridge | Westbridge | 100,120 | 2 000 |
| Westbridge | Fairview | 150,80 | 1 200 |
| Southbay | Southbay | 300,20 | 900 |
| Southbay | Port Azure | 350,40 | 600 |
| Centralia | Centralia | 300,220 | 1 800 |
| | **Total** | | **11 000** |

Households per city split 40/45/15 across the three cohorts, giving 27 `population_cohorts` rows.

Workforce = households × 1.0, employment 92% → 10 120 employed.

**Routes:** one directed route per city pair (72). `distance_km` = straight-line from the coordinates, `transit_ticks = ceil(distance / 400)`, cost = `ceil(distance × 0.05)` minor per unit. Examples: Greenford→Millhaven 85.4 km, 1 tick, 5; Greenford→Port Azure 438.3 km, 2 ticks, 22; Centralia→Southbay 200.0 km, 1 tick, 10.

## 4. World instantiation (B): initial state

### Companies (7 AI + 2 institutions; the player company is created at world start)
| code | type | business | city | recipe | strategy |
|---|---|---|---|---|---|
| `NORTHVALE_GRAIN` | AI | agriculture | Greenford | WHEAT_FARM | COST_LEADER |
| `MILLHAVEN_MILLING` | AI | manufacturing | Millhaven | FLOUR_MILL | CONSERVATIVE_OPERATOR |
| `WESTBRIDGE_BAKERY` | AI | manufacturing + retail | Westbridge | BAKERY_BREAD | AGGRESSIVE_EXPANDER |
| `FAIRVIEW_BAKERY` | AI | manufacturing + retail | Fairview | BAKERY_BREAD | PREMIUM_SPECIALIST |
| `EASTPORT_POWER` | AI | utility | Eastport | POWER_PLANT | CONSERVATIVE_OPERATOR |
| `SOUTHBAY_FUEL` | AI | extraction | Southbay | FUEL_WORKS | OPPORTUNIST |
| `PORT_AZURE_LOGISTICS` | AI | logistics | Port Azure | none (carrier) | COST_LEADER |
| `NOVARA_GOVERNMENT` | INSTITUTION | government | Centralia | none | none |
| `NOVARA_CENTRAL_BANK` | INSTITUTION | financial | Centralia | none | none |

Each AI producer has one business, one facility, one warehouse, one production line. Bakeries also own a retail business and store.

### Markets (10)
- 5 × `WHOLESALE_PERIODIC` (one per product, region null = world-wide).
- 5 × `RETAIL_ALLOCATION` for `BREAD`, one per region.

### Opening capital (one balanced journal entry per company)
`DR cash` / `CR owner equity`, in minor units:

| Holder | Amount | NVR |
|---|---|---|
| each of 7 AI companies | 50 000 000 | 500 000.00 |
| government | 200 000 000 | 2 000 000.00 |
| central bank | 300 000 000 | 3 000 000.00 |
| player company | 10 000 000 | 100 000.00 |

Total equity at world start, excluding the player: 7×50 M + 200 M + 300 M = **850 000 000** (8 500 000.00 NVR).

### Opening inventory rule
Each producer starts with 3 days of its steady-state input needs and 2 days of its output. Computed from the demand model below, not typed by hand.

### Policies
`SALES_TAX` 10%, `CORPORATE_TAX` 20% as `world_policies`, effective tick 0.

## 5. Steady-state sanity check (recomputed)

Assume 0.5 bread per household per day.

| Quantity | Calculation | Value |
|---|---|---|
| Bread demand | 11 000 × 0.5 | 5 500 EA/day |
| Bakery batches | 5 500 / 100 | 55 /day |
| Flour needed | 55 × 40 | 2 200 KG |
| Mill batches | 2 200 / 800 | 2.75 /day |
| Wheat needed | 2.75 × 1000 | 2 750 KG → 2.75 farm batches/day |
| Electricity | 55×20 + 2.75×200 | 1 650 KWH → 1.65 power batches/day |
| Fuel | 1.65×200 + 2.75×40 | 440 L → 0.44 fuel batches/day |
| Labor | 55×4 + 2.75×8 + 2.75×8 + 1.65×2 + 0.44×20 | 276 labor-hours ≈ 34.5 worker-days |

## 6. Problems found in the docs and schema

1. **Doc says 8 cities but lists 9** (Greenford, Millhaven, Eastport, Ironhaven, Westbridge, Fairview, Southbay, Port Azure, Centralia). This design seeds 9. Confirm.
2. **Labor is almost irrelevant.** The 5-product economy needs about 35 worker-days a day, but there are 10 120 employed workers. Household income must be exogenous (cohort aggregates) until more industries exist, or the model shows 99.7% idle labor. Real wages cannot come from these five producers alone.
3. **Transport cost per product — fixed.** `products.transport_factor` now exists. Shipping cost = `route.cost_per_unit_minor × transport_factor × quantity`, rounded up once per shipment line (not per unit). Seed factors: `WHEAT` 0.05, `FLOUR` 0.05, `BREAD` 0.5, `ELECTRICITY` 0 (grid, no shipping cost), `FUEL` 0.1. Example, Greenford→Port Azure (route cost 22): 1000 kg wheat = 22 × 0.05 × 1000 = 1 100 minor (6.9% of the 16 000 cargo value); 100 loaves = 22 × 0.5 × 100 = 1 100 minor (11% of 10 000).
4. **Electricity** modeled as storable with 1-tick life; a real grid is not shipped. Acceptable for the prototype; revisit with a `grid` concept if needed.
5. **Strategy `weights` are placeholders.** Calibration comes after the first simulation run.

## 7. How the seed will run (when implemented)

- `prisma.config.ts` `migrations.seed` points to a seed script; `pnpm exec prisma db seed`.
- Script uses the Prisma client with upserts keyed on natural keys, in dependency order: units → categories/industries → products → facility types → recipes → strategy templates → scenario/definitions → missions.
- World instantiation is a NestJS use case in the worlds module, not part of seeding.
