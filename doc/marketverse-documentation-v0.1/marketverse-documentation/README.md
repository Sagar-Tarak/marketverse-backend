# MARKETVERSE — Engineering Blueprint

**Documentation release:** 0.1.0  
**Date:** 30 October 2026  
**Product:** Browser-based, single-player-first business and economic simulation  
**Working world:** Novara  
**Status:** Foundational specification; decisions marked `PROPOSED` require validation during prototyping.

## What this repository contains

This documentation defines Marketverse as a persistent simulated economy in which the player operates businesses alongside AI-controlled companies, aggregate consumers, suppliers, financial institutions and government entities.

It is intentionally written before implementation. It describes product behavior, economic assumptions, simulation lifecycle, database domains, backend boundaries, interfaces, testing, operations and a staged implementation plan.

## Document index

| ID | Document | Purpose |
|---|---|---|
| MV-001 | [Product & Game Design](docs/01-product-and-game-design.md) | Product vision, gameplay, modes, progression and scope |
| MV-002 | [Novara World & Economy](docs/02-novara-world-and-economy.md) | Geography, population, industries, resources and initial world |
| MV-003 | [Economic Models](docs/03-economic-models.md) | Demand, supply, production, pricing, labor, finance and shocks |
| MV-004 | [Simulation Engine](docs/04-simulation-engine.md) | Time, daily cycle, deterministic execution, AI scheduling and recovery |
| MV-005 | [Database Architecture](docs/05-database-architecture.md) | Logical schema, relationships, constraints, indexes and persistence |
| MV-006 | [Backend Architecture & API](docs/06-backend-architecture-and-api.md) | NestJS modules, domain boundaries, API contracts and jobs |
| MV-007 | [AI Companies & Market Engine](docs/07-ai-companies-and-market-engine.md) | Company decision-making, orders, market clearing and competition |
| MV-008 | [Frontend & UI/UX](docs/08-frontend-and-ui-ux.md) | Professional application-like game interface |
| MV-009 | [Testing, Operations & Security](docs/09-testing-operations-and-security.md) | Quality, observability, deployment, backup and security |
| MV-010 | [Development Roadmap](docs/10-development-roadmap.md) | Milestones, acceptance criteria and delivery order |
| ADRs | [Architecture decisions](docs/decisions/README.md) | Explicit decisions and trade-offs |

## How to use these documents

1. Read MV-001 and MV-002 to understand the product and fictional world.
2. Review MV-003 and MV-004 before implementing any economic calculations.
3. Review MV-005 and MV-006 before creating migrations or NestJS modules.
4. Use MV-007 to implement market behavior and AI company policies.
5. Build the first economic prototype using the acceptance criteria in MV-010.
6. Update documents when a decision changes. Do not silently diverge from the specification.

## Important status and assumptions

- This is a design baseline, not proof that every economic formula is calibrated.
- Values such as population, company counts, prices and production volumes are illustrative balancing inputs.
- The first release is single-player. The model supports multiple participants per world conceptually, but shared-world multiplayer is not part of the initial implementation.
- Use a modular monolith, not microservices, for the first release.
- Use aggregate consumer cohorts and individually simulated material companies. Do not simulate every citizen or microbusiness as a separate agent initially.
- The game economy is fictional and simplified. It is not a real-world forecasting or financial product.
- Economic formulas must be versioned and validated through experiments before they become persistent game rules.

## Glossary

- **World:** An isolated persistent game simulation.
- **Tick:** A logical unit of simulation progress. A daily tick is the initial economic processing unit.
- **Cohort:** An aggregate group of households with similar economic characteristics.
- **Agent:** An individually simulated company or institution that makes decisions.
- **Market:** A mechanism that brings buyers and sellers together for a product and trading location.
- **Order:** A request to buy or sell a quantity under specified conditions.
- **Market clearing:** The process that matches eligible supply and demand.
- **Snapshot:** A recoverable checkpoint of world state.
- **Ledger:** An immutable accounting record of balanced debit and credit postings.
- **Simulation event:** A recorded occurrence that changes or explains world state.
- **External event:** A scenario input such as drought, policy change or port disruption.
- **AI policy:** Deterministic decision rules and scoring used by simulated companies.
