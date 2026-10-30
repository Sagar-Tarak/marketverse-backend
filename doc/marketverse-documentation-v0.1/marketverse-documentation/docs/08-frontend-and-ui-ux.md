# MV-008 — Frontend & UI/UX Specification

**Version:** 0.1.0 | **Status:** Initial design direction

## 1. Design direction

Marketverse is a browser-based, interface-driven simulation. It does not use 2.5D, 3D, isometric rendering or a traditional gaming HUD.

The visual language should resemble a premium business intelligence and financial management application, while retaining game-specific objectives, progression, reports and decisions.

## 2. Design principles

- Professional, restrained and information-rich.
- Dark theme default; light theme available.
- Clear hierarchy and predictable navigation.
- Use charts and tables for operational insight.
- Use business language rather than arcade terminology.
- Avoid decorative game meters, cartoon assets and excessive animation.
- Explain economic changes with source/context.
- Responsive layout, desktop-first.
- Accessibility: keyboard navigation, contrast, semantic controls and readable chart alternatives.

## 3. Main navigation

1. Overview
2. My Companies
3. Businesses
4. Industries
5. Marketplace
6. Supply Chain
7. Production
8. Finance & Banking
9. Economy
10. Competitors
11. News & Events
12. Objectives
13. Settings

Navigation may be grouped into Company, Markets, World and Reports sections.

## 4. Global application shell

Persistent header:
- World name.
- Simulation date.
- Pause/play state.
- Speed selector.
- Available company cash (clearly distinguish selected company from total personal wealth).
- Notifications.
- User menu.

Sidebar:
- Primary destinations.
- Current selected world.
- Contextual navigation.

Main content:
- Page title and context.
- Key actions.
- Summary metrics.
- Charts, tables and details.

Do not display metrics without definitions, units and time ranges.

## 5. Core screens

### 5.1 World overview
- Current simulation date.
- Player company summary.
- Revenue/profit trend.
- Cash and liquidity.
- Active businesses.
- Market opportunities.
- Recent news.
- Current objectives.
- Key economic indicators.

### 5.2 Company profile
- Overview.
- Income statement.
- Balance sheet.
- Cash flow.
- Ownership.
- Businesses and facilities.
- Employees.
- Debt and credit.
- Transactions.

### 5.3 Business detail
- Operational status.
- Sales and demand.
- Price and margin.
- Inventory.
- Employees.
- Suppliers.
- Production or service capacity.
- Expenses.
- Upgrade/expansion actions.

### 5.4 Marketplace
- Product search and filters.
- Market price history.
- Best bid/ask where relevant.
- Supply and demand statistics.
- Buy/sell order entry.
- Open orders.
- Trade history.
- Regional availability.

### 5.5 Production
- Facilities and lines.
- Recipes.
- Input availability.
- Capacity utilization.
- Scheduled jobs.
- Output inventory.
- Unit cost and yield.

### 5.6 Supply chain
- Suppliers.
- Purchase orders.
- Contracts.
- Shipments.
- Delivery schedule.
- Supplier reliability.
- Input cost trends.

### 5.7 Economy
- Inflation/CPI proxy.
- Employment and wages.
- Industry output.
- Regional indicators.
- Interest rate and policy.
- Trade statistics.
- Economic event timeline.

### 5.8 Competitors
- Company directory.
- Industry and region.
- Market share.
- Public financial summary.
- Products and prices.
- Recent strategic actions.
- Credit/distress status where visible.

### 5.9 News and events
News must be generated from actual simulation events and data. Each article should link to the underlying event or report. Avoid fabricated headlines that contradict the simulation.

### 5.10 Objectives
- Chapter and mission.
- Prerequisites.
- Measurable progress.
- Optional objectives.
- Rewards and funding source.
- Completion history.

## 6. Data visualization

Every chart should specify:
- Metric definition.
- Unit.
- Time range.
- World/region/company scope.
- Data freshness.
- Whether values are actual, estimated or forecast.

Forecasts must be visually distinguished from historical actuals.

Use accessible tables or summaries alongside important charts.

## 7. Interaction design

Actions that affect money, inventory or world state should:
- Show required resources.
- Show cost and expected impact.
- Validate constraints.
- Require confirmation for high-impact irreversible actions.
- Return authoritative backend results.
- Handle stale data and concurrency conflicts.

The frontend must never calculate authoritative market prices, balances or production output.

## 8. Frontend technology

- React + TypeScript.
- Tailwind CSS.
- shadcn/ui.
- TanStack Query for server state.
- Zustand for local UI state.
- Recharts or another accessible charting library.
- React Router.
- Zod for client-side form validation, with backend validation remaining authoritative.

## 9. State management

Server state:
- Company data.
- Inventory.
- Market data.
- Orders.
- Reports.
- Simulation status.

Local state:
- Open panels.
- Selected filters.
- Draft form inputs.
- Theme and layout preferences.

Do not duplicate large server datasets in a global client store.

## 10. Loading and stale data

Show:
- Last updated tick.
- Loading state.
- Stale-data indicator where relevant.
- Simulation paused/running state.
- Pending command state.
- Clear errors and retry behavior.

A realtime event is an invalidation/update hint. The client should refetch authoritative state where needed.

## 11. Design system deliverables

Before detailed frontend implementation, define:
- Color tokens.
- Typography.
- Spacing scale.
- Borders and shadows.
- Tables and data density.
- Form patterns.
- Status indicators.
- Chart conventions.
- Empty states.
- Error states.
- Responsive breakpoints.
- Accessibility rules.
