# Marketverse backend — conventions

NestJS 12 (Express) · Prisma 7 (schema, CRUD) · Kysely (planned: complex/bulk SQL) · PostgreSQL · Redis/BullMQ · Vitest · oxlint + Prettier. ESM: relative imports end in `.js`.
Module structure follows the office `nest-backend` project: flat modules, services call Prisma directly, no repository layer.
Design docs: `doc/` (product), `doc/module-map.md` (tables → modules), `prisma/SEED_DESIGN.md`, `prisma/CONSTRAINTS.md`.

## Commands

```bash
pnpm gen:module <kebab-name>  # new module skeleton (module, controller, service, spec)
pnpm check                    # typecheck + lint + unit/architecture tests — run before finishing
pnpm db:sync                  # db push + generate + prisma/constraints.sql (after EVERY schema change)
pnpm db:seed                  # all seeders; or: pnpm db:seed units products
pnpm test:integration         # real Postgres (<db>_test); runs `db push --accept-data-loss` — run it yourself
pnpm test:e2e                 # boots the app against DATABASE_URL (read-only health check)
pnpm format
```

## Layout

```
src/
  main.ts, app.module.ts
  config/            env validation (add every new env var here + .env.example), configureApp()
  common/            only code ≥2 modules use: pagination/, filters/, interceptors/, utils/
  health/            GET /api/v1/health (DB ping, 503 if down)
  infrastructure/    database/ (PrismaService, TransactionClient, seeds/), queue/
  modules/<name>/    one business area, flat (see below)
  simulation/        pure engine: no NestJS/Prisma/Redis imports
prisma/              schema/*.prisma (one file per domain), constraints.sql, docs. No TypeScript here.
scripts/             new-module.mjs
test/                integration/ (needs DB), architecture/ (no import cycles), app.e2e-spec.ts
```

## A module (flat, like the office project)

```
modules/<name>/
  <name>.module.ts      imports, providers, exports
  <name>.controller.ts  routes only; delegates to the service
  <name>.service.ts     business logic + Prisma/Kysely calls + transactions
  <name>.service.spec.ts  unit test beside the service; stub PrismaService (`new Service(prisma as never)`)
  schemas/<name>.schema.ts  request DTOs (class-validator) + response view types — create when first needed
  configs/              only when a list endpoint uses a query-engine whitelist (not built yet)
```

- `catalog` is the reference module. `pnpm gen:module` creates the empty skeleton.
- Add a file only when a role above has no file yet. Big service? Split into `services/` by real concern (office `gps/` style); pure rules go in `functions/*.functions.ts`. No `repository/`, `entity/`, `mapper/`, `ports/` or layer folders.
- Other modules import a module's `*.module.ts` and its exported service, never its internals. `test/architecture` fails on import cycles between modules; fix a cycle by extracting the shared piece.

## Rules

- Controllers: route + DTO + one service call. Return plain data; `ResponseEnvelopeInterceptor` wraps it as `{ statusCode, data, message }` (`Page` adds `count`, `paginationMetadata`). Strings and a handler's own `statusCode` objects pass through.
- Errors: `throwAppError(message, HttpStatus.X)` / `AppError` (`common/utils/app-error.util.ts`) or standard Nest exceptions. No other custom exception classes. `AllExceptionsFilter` shapes every error; unknown errors become a generic 500.
- Lists: always paginate (`PaginationQueryDto`, `skipTake()`, `toPage()`) with a stable `orderBy`.
- Money = integer minor units (`BigInt`), quantities = `Decimal`. In JSON both are strings (`.toString()` in the view mapper). A raw Prisma row with `BigInt` crashes JSON serialisation: always map to a view type.
- Tenancy: every world-owned row carries `world_id`; reference parents with composite keys `(world_id, id)`. Take the world from the route/auth, never from the body.
- Multi-write operations use one `$transaction`; pass `tx` (`TransactionClient`) to helpers. No external calls inside. One unit of work uses one data tool: Prisma and Kysely transactions cannot be joined, so money/stock paths use Kysely only.
- Validation: `class-validator` DTOs + the global `ValidationPipe`, at the boundary only. `no-explicit-any` is an error in lint.
- New env var: add to `config/environment.validation.ts` (+ spec) and `.env.example`; read through `ConfigService`.
- Reuse before writing. No abstraction for one use.

## Recipes (copy from `src/modules/catalog`)

**List endpoint**
```ts
// controller
@Get() list(@Query() query: PaginationQueryDto): Promise<Page<WorldView>> { return this.worlds.list(query); }

// service
async list(request: PageRequest): Promise<Page<WorldView>> {
  const [total, rows] = await this.prisma.$transaction([
    this.prisma.gameWorld.count(),
    this.prisma.gameWorld.findMany({ orderBy: { createdAt: 'desc' }, ...skipTake(request) }),
  ]);
  return toPage(rows.map(toWorldView), total, request);
}
```

**Get one / not found** — `if (!row) throwAppError(\`World ${id} not found.\`, HttpStatus.NOT_FOUND);`

**Create with several writes**
```ts
return this.prisma.$transaction(async (tx) => {
  const world = await tx.gameWorld.create({ data });
  await this.seedClock(tx, world.id); // helper takes `tx: TransactionClient`
  return toWorldView(world);
});
```

**View mapper** — one `toXView(row)` const in the service file; `BigInt`/`Decimal` → `.toString()`.

**Unit test** — `new Service({ model: { findUnique: () => Promise.resolve(row) } } as never)`; cover not-found, each business-rule failure, and money-as-string.

**HTTP test** — one `test/integration/<name>.int-spec.ts`. Set `process.env.DATABASE_URL` to the test DB, then `await import('../../src/app.module.js')` (ConfigModule captures env when AppModule is imported).

## Database workflow (no migration files yet)

- Hand-written invariants (CHECK, triggers, partial indexes) live in `prisma/constraints.sql`; summary in `prisma/CONSTRAINTS.md`. A bare `prisma db push` drops the partial indexes — use `db:sync`.
- New seeder: export a `Seeder` (idempotent upserts), append to `seeds/seeders.ts` in parent-first order.
- Prisma blocks `--accept-data-loss` for AI agents; the user runs those commands.

## Not built yet (build when the first module needs it, not before)

| Need | Office equivalent | Waits for |
|---|---|---|
| Auth: `JwtAuthGuard`, `@Public()`, `@CurrentUser()`, `AuthenticatedUser` | `modules/auth`, `common/decorators` | Supabase decision (`identity` module) |
| Permissions: `@CheckPermissions` | `common/guards/permissions.guard.ts` | auth |
| Kysely + query engine + `configs/*-query.config.ts` | `database/kysely`, `database/query-engine` | first heavy list/report (markets, finance) |
| Cache (`CacheService`, Redis, TTL + tags) | `database/redis` | a measured hot read |
| Idempotency service (table `idempotency_keys` exists) | `common/idempotency` | first retried mutation (orders, payments) |
| Structured logging (pino, redaction, requestId) | `config/logger.config.ts` | before production |
| Queues/processors (BullMQ) | `jobs/`, module-local processors | simulation shell |
| CI (typecheck, lint, test, integration with Postgres service) | — | a remote repository |

## New module checklist

1. Tables exist in `prisma/schema/` and `doc/module-map.md` names the module.
2. `pnpm gen:module <name>`, then follow its printed steps (register in `app.module.ts`).
3. Controller thin, service owns logic and data access, `schemas/` holds DTOs and view types.
4. Tests: service spec (stub Prisma) and one `test/integration/*.int-spec.ts` for the HTTP surface.
5. `pnpm check` green.
