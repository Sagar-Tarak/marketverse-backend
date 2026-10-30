# MV-007 — AI Companies & Market Engine

**Version:** 0.1.0 | **Status:** Proposed decision and trading model

## 1. AI company design goals

AI companies should behave like constrained economic organizations, not scripted price generators.

Each major AI company has:
- Identity and industry.
- Strategy/personality.
- Cash and financial statements.
- Assets and liabilities.
- Facilities and capacity.
- Inventory.
- Employees or workforce aggregates.
- Supplier/customer relationships.
- Products and markets.
- Decision schedule.
- Risk limits.

AI decisions must obey the same economic constraints as player decisions. AI must not create money, inventory or capacity without a recorded mechanism.

## 2. AI company archetypes

Initial strategy templates:

| Archetype | Primary objective | Typical behavior |
|---|---|---|
| Cost leader | Low unit cost | Efficiency, bulk procurement, price competition |
| Premium specialist | Quality and margin | Product quality, brand investment, selective markets |
| Aggressive expander | Growth | Capacity investment, borrowing within risk limits |
| Conservative operator | Resilience | Cash buffers, low leverage, cautious expansion |
| Innovator | Productivity | Research and process improvement |
| Opportunist | Short-term return | Responds strongly to shortages and price gaps |

Archetypes are parameter sets, not hardcoded personalities with arbitrary exceptions.

## 3. AI decision cycle

For each eligible company:
1. Load a bounded decision context.
2. Evaluate cash, working capital and debt.
3. Review inventory and expected demand.
4. Review production capacity and utilization.
5. Review supplier reliability and input prices.
6. Review competitor and market data.
7. Generate candidate actions.
8. Estimate outcomes over a defined horizon.
9. Score actions using strategy weights and risk limits.
10. Select a feasible action.
11. Submit through the same command/domain services used by the player.
12. Record decision rationale and realized outcome.

Candidate actions:
- Change price.
- Submit buy order.
- Submit sell order.
- Change production plan.
- Hire or reduce workforce.
- Purchase inputs.
- Expand capacity.
- Improve efficiency.
- Borrow or repay.
- Enter/exit a market.
- Acquire a business (later).

## 4. Decision scoring

A candidate action can be scored using a weighted objective:

`score = expected_profit_weight × expected_profit + growth_weight × expected_growth - risk_weight × risk - cash_penalty - constraint_penalties`

All terms must be normalized or calibrated to avoid one scale dominating. Feasibility constraints should reject impossible actions before scoring.

The first version should use deterministic rules and scoring. Machine learning or LLM decision-making is not required.

## 5. AI constraints

AI companies must respect:
- Available cash and credit.
- Inventory.
- Production capacity.
- Labor availability.
- Supplier capacity.
- Market access.
- Delivery lead times.
- Regulatory requirements.
- Risk tolerance.

AI must not see hidden player information unless the game explicitly models public information leakage or intelligence.

## 6. Market types

Initial market types:
- Wholesale periodic market.
- Retail consumer allocation market.
- Contract market for recurring supply agreements.

Later:
- Auction market.
- Commodity futures.
- Financial securities market.
- Cross-border market.

## 7. Order lifecycle

Proposed order states:
`DRAFT -> OPEN -> PARTIALLY_FILLED -> FILLED`

Other terminal states:
`CANCELLED`, `EXPIRED`, `REJECTED`.

A sell order must reserve available inventory. A buy order must reserve funds or a defined credit amount. Reservation release must occur on cancellation, expiry or rejection.

Order quantity invariants:
- Original quantity > 0.
- Remaining quantity >= 0.
- Filled quantity = original minus remaining.
- Filled quantity cannot exceed original quantity.
- A trade references eligible open orders.
- Each trade is settled once.

## 8. Market clearing algorithm

Initial periodic market:
1. Gather open orders for a market and clearing period.
2. Validate participants, price, quantity, reservations and expiry.
3. Sort buy orders by highest limit price, then time priority.
4. Sort sell orders by lowest limit price, then time priority.
5. Match while best bid >= best ask.
6. Determine execution price using documented rule (initial proposal: resting order price).
7. Create trade and settlement instruction.
8. Settle inventory and funds transactionally.
9. Update order quantities/status.
10. Release residual reservations where appropriate.
11. Calculate market statistics.

For high volume, matching can be performed in memory over a consistent order snapshot, but settlement must be transactionally safe. A unique trade key and order fill constraints prevent duplicate execution.

## 9. Retail allocation

Retail demand is allocated across stores using a share model. Inputs may include:
- Price competitiveness.
- Stock availability.
- Distance/accessibility.
- Quality.
- Brand preference.
- Store capacity.
- Cohort preferences.

The model returns quantities allocated to each store. It must respect total demand and store stock. Unserved demand is recorded as lost sales or redirected to substitutes according to configured rules.

## 10. AI competition

Track:
- Market share by product/region.
- Relative price.
- Product availability.
- Quality/reputation.
- Capacity utilization.
- Customer satisfaction proxy.
- Cost position.
- Financial resilience.

Market share should derive from actual sales or allocated demand, not be manually assigned.

## 11. Failure and bankruptcy

A company may become distressed when it cannot meet obligations. Use explicit states:
- Operating.
- Distressed.
- Restructuring.
- Insolvent.
- Closed.

Bankruptcy rules must define:
- Trigger conditions.
- Grace period.
- Asset liquidation.
- Employee separation.
- Supplier settlement priority.
- Loan loss treatment.
- Inventory disposal.
- Market exit.

Do not silently delete a failed company. Its historical trades and accounting must remain available.

## 12. Explainability

For major AI decisions, store a concise rationale:
- Observed conditions.
- Candidate actions.
- Chosen action.
- Key constraints.
- Expected outcome.
- Actual outcome after the relevant period.

The player-facing interface can summarize this as “Novara Foods increased production because demand exceeded available supply and it had sufficient working capital.”
