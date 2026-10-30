# MV-001 — Product & Game Design

**Version:** 0.1.0 | **Status:** Baseline proposal

## 1. Product vision

Marketverse is a browser-based, single-player-first business tycoon and economic simulation. The player starts with limited capital, establishes businesses, buys and sells goods, manufactures products, manages employees and capital, and competes with AI-controlled companies inside a persistent fictional economy.

The player does not control the economy. The player participates in it. Other companies continue to make decisions, consumers continue to spend within their budgets, markets continue to clear, and economic events can create opportunities or risks.

The interface should resemble a sophisticated business and financial management application, not a conventional game HUD. Game progression is communicated through business objectives, market reports, unlocks, licenses, reputation and story events.

## 2. Product pillars

1. **A coherent living economy:** Supply, demand, production, inventory, labor, finance and policy influence one another.
2. **Meaningful business decisions:** The player must make trade-offs involving price, capacity, cash, quality, inventory and risk.
3. **Competition:** AI companies have distinct strategies, constraints and financial outcomes.
4. **Readable complexity:** The simulation can be deep internally while the interface explains consequences in accessible language.
5. **Persistent progression:** Worlds can be saved, resumed and advanced after absence under defined offline rules.
6. **Expandable architecture:** Initial worlds are private single-player worlds; the domain model should not assume that a world can only ever have one human participant.

## 3. Target experience

The player should feel like an entrepreneur and corporate owner operating in a functioning economy. They should be able to answer:
- What is happening in the market?
- Why did a price change?
- Which products are profitable?
- Where are supply bottlenecks?
- What are competitors doing?
- Can the company afford expansion?
- What will happen if a supplier fails?
- Is it better to grow, conserve cash or acquire another business?

The game must explain important outcomes. Avoid unexplained random penalties.

## 4. Game modes

### 4.1 Story campaign

A guided campaign introduces systems gradually. Missions are objectives layered on top of the live simulation, not scripts that suspend economic rules.

Proposed chapters:
1. First Venture — establish a small retail business.
2. Market Entry — procure goods and compete on price and availability.
3. Expansion — open additional branches and hire staff.
4. Manufacturing — create a factory and production recipes.
5. Supply Network — negotiate supply contracts and manage warehouses.
6. Market Leader — compete for market share and improve efficiency.
7. Financial Power — use loans, investments and acquisitions.
8. Economic Crisis — maintain solvency during a downturn.
9. Regional Expansion — enter additional regions.
10. Global Trade — unlock imports and exports in a later content release.

Missions must define prerequisites, measurable objectives, optional objectives, rewards and failure/expiry behavior. Rewards must be funded by a documented source such as a campaign grant, not created without accounting treatment.

### 4.2 Sandbox

The player configures starting capital, difficulty, starting region, economic conditions and optional event frequency. Configuration is stored as immutable world-start settings.

### 4.3 Future modes

Challenge scenarios and multiplayer are future expansions. They are not required for the first playable release.

## 5. Core gameplay loop

1. Observe market reports, company performance and economic conditions.
2. Identify a business opportunity or risk.
3. Choose a business action: procure, price, produce, hire, invest, borrow, expand or divest.
4. Submit the action to the authoritative backend.
5. The simulation validates and processes it.
6. Observe financial, operational and market consequences.
7. Reinvest, adjust strategy or protect cash.

The player should not be forced to click continuously. Strategic decisions may be made between simulation ticks.

## 6. Player business progression

Initial business categories:
- Retail: grocery, general store, clothing, electronics.
- Wholesale and distribution: food, materials, consumer goods.
- Manufacturing: food processing, textiles, furniture, steel products, electronics assembly.
- Services: logistics, repair, hospitality and professional services (later).
- Finance and technology: later expansion.

A business is an operating unit owned by a company. A company may own multiple businesses and facilities. A facility is a physical or operational site such as a store, factory or warehouse.

## 7. Game economy and progression

Progression should be based on capability, reputation, licenses, capital and operational track record—not only an abstract level.

Possible unlock conditions:
- Revenue or profitability milestones.
- Required reputation.
- Completed campaign objectives.
- Required research.
- Available capital and creditworthiness.
- Region-specific licenses or capacity.

A player may fail. Bankruptcy, insolvency, loan default and business closure must be possible, but the game should provide clear warnings and recovery paths appropriate to the selected difficulty.

## 8. User experience principles

- Professional, restrained, information-dense interface.
- Dark theme default; light theme supported.
- No 2.5D or 3D world rendering.
- No conventional health/XP HUD.
- Use charts, tables, business profiles, market depth, reports and notifications.
- Important economic changes must have explanations and traceable source data.
- Every action with financial consequences should preview cost, expected impact and risk where practical.
- Do not imply forecasts are guaranteed.

## 9. Initial release scope

Required:
- Account and private world creation.
- One country with a small number of regions.
- Products, industries and production recipes.
- Aggregate consumer demand.
- Individually simulated major AI companies.
- Player-owned retail and manufacturing.
- Inventory and procurement.
- Wholesale market and retail allocation.
- Company accounting and cash flow.
- Economic indicators and basic external events.
- Daily simulation and offline progression.
- Story campaign foundation and sandbox setup.
- Save, resume and recovery.

Not required:
- Real-time multiplayer.
- Player chat or matchmaking.
- Fully individual citizens.
- Full stock exchange or complex derivatives.
- Full international trade.
- Every real-world tax and regulatory detail.
- 3D or 2.5D rendering.
- LLM-driven company decisions.

## 10. Success criteria

A playable prototype is successful when:
- A player can create a company and operate a store or factory.
- Production consumes inputs and creates outputs.
- Consumers generate demand constrained by purchasing power.
- Orders are matched and settled consistently.
- Prices respond to changing market conditions.
- AI companies make decisions under financial constraints.
- Company profit/loss and balance sheet reconcile.
- A supply shock produces explainable downstream effects.
- A world can be saved and resumed without duplicating money or inventory.
- The same initial state, model version and random seed produce reproducible results.

## 11. Out of scope and guardrails

Marketverse is an entertainment simulation. It must not present fictional financial outputs as real financial advice. All currency values, economic statistics, companies and events in Novara are fictional. Avoid using real-world company branding without a clear licensing basis.
