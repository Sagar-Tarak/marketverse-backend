# MV-002 — Novara World & Economic Model

**Version:** 0.1.0 | **Status:** Initial world proposal

## 1. Purpose

This document defines the fictional country that hosts the simulation. World configuration should be data-driven so different scenarios can reuse the same simulation engine with different starting conditions.

Novara is a fictional, medium-sized, diversified economy. It has agriculture, mining, manufacturing, services, retail, logistics and financial institutions. It is not intended to reproduce any particular real country.

## 2. Geography

Proposed initial geography: five regions and eight cities. Names and specializations are balancing inputs and may change.

| Region | Main characteristics | Cities | Initial opportunities |
|---|---|---|---|
| Northvale | Fertile plains, moderate population | Greenford, Millhaven | Wheat, dairy, food processing |
| Eastport | Industrial corridor and seaport | Eastport, Ironhaven | Steel, machinery, imports |
| Westbridge | Dense commercial population | Westbridge, Fairview | Retail, wholesale, services |
| Southbay | Port, energy and logistics | Southbay, Port Azure | Fuel, shipping, warehousing |
| Centralia | Administrative and financial center | Centralia | Banking, government, professional services |

Geography should affect transport cost, delivery time, local wages, resource access and demand. Avoid arbitrary bonuses that cannot be explained.

### 2.1 Geography data

A region should have:
- Name and code.
- Country/world relationship.
- Terrain and climate profile.
- Population and workforce aggregates.
- Infrastructure capacity.
- Resource availability.
- Industry capacity.
- Transport connections.
- Local tax and regulatory modifiers, if applicable.

A city should belong to a region and contain population cohorts, commercial demand, facilities and infrastructure capacity.

## 3. Initial world scale

Proposed prototype-scale values:
- 5 regions.
- 8 cities.
- 3 to 5 consumer cohorts per region.
- 5 to 10 individually simulated major companies.
- 20 to 50 aggregate small-business participants.
- 5 initial products for the first economic experiment.
- 30 to 50 products for the first broader playable economy.
- 5 to 8 industries for the initial playable release.

Do not create hundreds of detailed agents before the core market has been validated.

## 4. Population model

Population is represented by cohorts, not one database row per citizen.

A cohort groups households with similar:
- Income range and income distribution.
- Household size.
- Consumption basket.
- Price sensitivity.
- Preferences.
- Savings propensity.
- Employment status.
- Region.

Population state should distinguish:
- Total households.
- Employed workforce.
- Unemployed workforce.
- Disposable income.
- Essential spending.
- Discretionary spending.
- Savings and debt aggregates.

Population changes through births, migration and scenario adjustments at a low frequency. The first prototype may hold population constant.

## 5. Economic actors

### 5.1 Households

Households supply labor, receive wages and other income, pay taxes, save and consume goods. Aggregate household behavior creates demand.

### 5.2 Companies

Companies produce goods or services, employ workers, buy inputs, sell outputs, borrow, invest and compete. Major companies are individual AI agents; small businesses may be represented by aggregate industry participants.

### 5.3 Government

Government collects taxes, purchases goods and services, provides subsidies, maintains infrastructure and changes policy. Government actions must be funded and recorded.

### 5.4 Banks and financial institutions

Banks accept deposits, provide loans, assess credit and receive interest. The initial version can use simplified lending rules. Bank balance sheets must not create unlimited money without an explicit monetary model.

### 5.5 Suppliers and logistics operators

Suppliers provide inputs. Logistics operators move goods between regions. Transport capacity, cost and delay can constrain trade.

## 6. Industry classification

Proposed initial industries:

| Industry | Typical outputs | Typical inputs |
|---|---|---|
| Agriculture | Wheat, cotton, vegetables, livestock | Land, labor, water, fuel, fertilizer |
| Mining and extraction | Iron ore, coal, minerals | Labor, machinery, energy |
| Energy and utilities | Electricity, refined fuel | Fuel, generation assets, labor |
| Food processing | Flour, bread, packaged food | Agricultural inputs, energy, packaging |
| Textiles | Fabric, clothing | Cotton, dyes, energy, labor |
| Basic materials | Steel, processed materials | Ore, coal, energy |
| Furniture | Furniture | Timber, components, labor |
| Retail and distribution | Consumer sales and distribution services | Inventory, labor, facilities, logistics |

Additional industries such as electronics, automotive, construction, healthcare and financial services can be introduced after the core economy works.

## 7. Product catalog

Products are global definitions; prices, supply and inventory are world-specific state.

A product definition should include:
- Stable code and name.
- Category.
- Unit of measure.
- Product type: raw material, intermediate, finished good or service.
- Shelf-life behavior, if perishable.
- Storage requirements.
- Quality attributes.
- Reference/base price used for initialization, not as a forced market price.
- Substitution group, where applicable.
- Whether it is tradable between regions.

Initial prototype products:
1. Wheat — agricultural raw material.
2. Flour — processed intermediate.
3. Bread — finished consumer good.
4. Electricity — utility input.
5. Fuel — energy and logistics input.

The wider catalog should be developed from recipes and supply-chain relationships, not selected as an arbitrary list.

## 8. Production network

Production recipes define input-output relationships. For example:

- Flour mill: wheat + electricity + labor -> flour.
- Bakery: flour + electricity + packaging + labor -> bread.
- Textile mill: cotton + electricity + labor -> fabric.
- Furniture factory: timber + components + labor -> furniture.

A recipe should specify:
- Required inputs per production batch.
- Expected outputs.
- By-products or waste, if modeled.
- Base processing duration.
- Labor requirement.
- Energy requirement.
- Quality parameters.
- Capacity and efficiency modifiers.

The first prototype should use fixed recipes and deterministic output. Quality, waste and machine degradation can be added later.

## 9. Initial economic conditions

A new world should be created from a versioned scenario template.

The template specifies:
- Starting simulation date.
- Currency and minor-unit precision.
- Population by region and cohort.
- Initial company roster and strategies.
- Initial inventories and production capacities.
- Household income and savings aggregates.
- Government budget and policy.
- Bank lending conditions.
- Transport capacity.
- Initial market reference prices.
- Seeded event configuration.
- Random seed and model version.

Initial prices are starting conditions, not permanent prices. Market prices must subsequently be derived from trading and market rules.

## 10. Regional specialization and trade

Regions should have comparative advantages, but specialization must not make other industries impossible.

Trade between regions incurs:
- Transport cost.
- Delivery time.
- Capacity usage.
- Possible spoilage or damage.
- Tariffs or fees, if configured.

A region may import a product when local supply is insufficient. Import/export to external fictional markets can be represented as boundary markets in a later phase.

## 11. World configuration versus world state

Keep reusable definitions separate from mutable world state.

Definitions:
- Product catalog.
- Industry catalog.
- Recipe definitions.
- Building/facility types.
- AI strategy templates.
- Scenario templates.

World state:
- Company cash and inventory.
- Regional population.
- Market orders and prices.
- Production schedules.
- Active events.
- Government policy.
- Loans and accounting records.

## 12. World initialization

World creation should be reproducible:
1. Select a scenario template.
2. Create world and clock.
3. Create regions and cities.
4. Initialize population cohorts.
5. Instantiate AI companies and facilities.
6. Initialize inventories and production capacities.
7. Create initial markets and reference state.
8. Initialize financial accounts and opening ledger balances.
9. Store random seed and economic model version.
10. Validate world invariants before marking it playable.

A world must not become playable if its opening accounting entries do not balance or required market and inventory state is missing.
