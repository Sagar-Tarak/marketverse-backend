# MV-006 — Backend Architecture & API

**Version:** 0.1.0 | **Status:** Proposed modular monolith

## 1. Architecture overview

Initial architecture:
- React web client.
- NestJS API application.
- TypeScript simulation/domain packages.
- Simulation worker process.
- PostgreSQL.
- Redis and BullMQ.

The API handles authenticated player commands and queries. The worker advances simulation ticks. The domain engine contains economic and business rules.

## 2. Architectural boundaries

Use a modular monolith with explicit domain modules. Modules communicate through exported application interfaces or domain events, not by reaching into another module's private persistence implementation.

Proposed backend modules:
1. Identity
2. Worlds
3. Geography
4. Catalog
5. Population
6. Companies
7. Businesses
8. Inventory
9. Production
10. Procurement
11. Markets
12. Trading
13. Finance
14. Banking
15. Government
16. Economy
17. AI Companies
18. Simulation
19. Story and Missions
20. Reporting
21. Notifications

Do not create all modules at once. Start with the domains required for the economic prototype.

## 3. Layering

Within a module:
- **Domain:** entities, value objects, policies, invariants and domain events.
- **Application:** use cases, commands, queries and orchestration.
- **Infrastructure:** Prisma/Kysely repositories, queues and external adapters.
- **Presentation:** NestJS controllers, DTOs and guards.

Avoid putting economic formulas in controllers or ORM hooks.

## 4. Simulation package boundaries

The simulation engine should not import NestJS, Prisma, Redis or HTTP libraries.

It should accept explicit inputs and return outputs/events. Infrastructure adapters load state and persist results.

Suggested packages:
- `game-domain`
- `economic-models`
- `market-engine`
- `simulation-engine`
- `ai-engine`
- `shared-types`

Keep package count modest. Packages are boundaries for reuse and testing, not a reason to create excessive abstractions.

## 5. API conventions

Base path: `/api/v1`.

Use:
- JSON request/response.
- UUID identifiers.
- ISO-8601 timestamps for real-world timestamps.
- Explicit simulation tick/date fields for game time.
- Pagination for collections.
- Stable error codes.
- Request validation.
- Authorization on every world-scoped route.

World-scoped routes should make world context explicit, for example `/worlds/{worldId}/companies`.

Do not trust a `worldId` supplied by the client until membership/ownership has been verified.

## 6. Example endpoint groups

### Identity
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`

Authentication implementation details should be decided in a dedicated security design. Never store plaintext passwords or expose secrets.

### Worlds
- `POST /worlds`
- `GET /worlds`
- `GET /worlds/{worldId}`
- `GET /worlds/{worldId}/status`
- `POST /worlds/{worldId}/pause`
- `POST /worlds/{worldId}/resume`
- `POST /worlds/{worldId}/speed`

### Companies and businesses
- `GET /worlds/{worldId}/companies`
- `GET /worlds/{worldId}/companies/{companyId}`
- `POST /worlds/{worldId}/businesses`
- `GET /worlds/{worldId}/businesses/{businessId}`
- `POST /worlds/{worldId}/businesses/{businessId}/pricing`
- `POST /worlds/{worldId}/businesses/{businessId}/production-plans`

### Markets
- `GET /worlds/{worldId}/markets`
- `GET /worlds/{worldId}/markets/{marketId}`
- `GET /worlds/{worldId}/markets/{marketId}/orders`
- `POST /worlds/{worldId}/markets/{marketId}/orders`
- `DELETE /worlds/{worldId}/markets/{marketId}/orders/{orderId}`

### Inventory and procurement
- `GET /worlds/{worldId}/warehouses`
- `GET /worlds/{worldId}/inventory`
- `POST /worlds/{worldId}/purchase-orders`
- `GET /worlds/{worldId}/shipments`

### Finance and reports
- `GET /worlds/{worldId}/finance/summary`
- `GET /worlds/{worldId}/finance/accounts`
- `GET /worlds/{worldId}/finance/transactions`
- `GET /worlds/{worldId}/reports/income-statement`
- `GET /worlds/{worldId}/reports/balance-sheet`
- `GET /worlds/{worldId}/reports/cash-flow`

### Simulation and news
- `GET /worlds/{worldId}/simulation`
- `GET /worlds/{worldId}/news`
- `GET /worlds/{worldId}/economic-indicators`
- `GET /worlds/{worldId}/events`

These are endpoint proposals, not a commitment to expose every internal operation directly.

## 7. Commands versus queries

Commands change state:
- Create business.
- Place order.
- Change price.
- Start production.
- Accept loan.
- Expand facility.

Queries read state:
- View company.
- View market.
- View inventory.
- View reports.

A command should return an operation/result identifier and the authoritative outcome. Long-running operations may return an accepted status and be completed asynchronously.

## 8. Idempotency and concurrency

Financial or inventory-changing commands should accept an idempotency key. Store the key scoped to user/world/operation and return the original result for a duplicate request.

Use database transactions and row locking or optimistic concurrency for:
- Order placement and reservation.
- Market settlement.
- Inventory movement.
- Ledger posting.
- Loan payment.
- Production completion.

Use version columns where optimistic concurrency is appropriate. Define retry behavior for serialization/deadlock errors.

## 9. Error model

Return stable machine-readable codes such as:
- `WORLD_NOT_FOUND`
- `WORLD_ACCESS_DENIED`
- `INSUFFICIENT_FUNDS`
- `INSUFFICIENT_INVENTORY`
- `CAPACITY_EXCEEDED`
- `ORDER_NOT_OPEN`
- `INVALID_SIMULATION_STATE`
- `IDEMPOTENCY_CONFLICT`

Do not expose stack traces or internal database details.

## 10. Realtime updates

Realtime updates are optional for the first prototype. Polling or refresh after commands is sufficient.

Later, Socket.IO may deliver:
- Tick completed.
- Trade executed.
- Shipment delivered.
- Economic event activated.
- Mission objective completed.

Realtime messages are notifications, not authoritative state. The client must be able to refetch the current state.

## 11. API documentation

Use OpenAPI/Swagger. Document:
- Authentication.
- Request/response schemas.
- Error codes.
- Idempotency behavior.
- Pagination.
- World authorization.
- Command side effects.
- Simulation timing semantics.

## 12. Initial backend vertical slice

Implement one end-to-end flow:
1. Create a world.
2. Initialize its geography/catalog references.
3. Create a player company.
4. Create a retail business.
5. Initialize a warehouse and opening inventory.
6. Generate consumer demand.
7. Execute retail allocation.
8. Record revenue and inventory movement.
9. Display a company financial summary.

This validates domain boundaries before the full economy is built.
