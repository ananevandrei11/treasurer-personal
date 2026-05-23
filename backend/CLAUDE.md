# Backend — CLAUDE.md

NestJS 11 backend for Treasurer. See the root [`CLAUDE.md`](../CLAUDE.md) for project-wide rules (git workflow, commits, language).

## MANDATORY RULES — read before every change

1. **Changed `schema.prisma` → create a migration immediately.**
   Any added, removed, or modified field/model requires `pnpm --filter backend prisma:migrate` (or `--create-only` + `migrate resolve --applied` if the DB is already ahead). No migration = PR is not done.

2. **Changed API or schema → update `.claude/docs/`.**
   After any endpoint, DTO, or Prisma model change, update `.claude/docs/api.md` and/or `.claude/docs/database.md`. These docs are the source of truth for the frontend.

3. **Before implementing → read `.claude/docs/api.md` and `.claude/docs/database.md`.**
   Do not implement from memory. Read the current contracts first, then write code.

## Stack

- **NestJS 11** with **CQRS** (`@nestjs/cqrs`) for command/query separation
- **Prisma 7** ORM + PostgreSQL (via `pg` + `@prisma/adapter-pg`)
- **Passport** (`passport-jwt`) — JWT access + refresh strategies
- **bcrypt** — password and refresh-token hashing
- **class-validator** / **class-transformer** — DTO validation
- **zod** — runtime env validation (`src/config/env.validation.ts`)
- **helmet** + CORS — security headers and cross-origin
- **`@nestjs/throttler`** — rate limiting (global guard + per-endpoint overrides)

## Bootstrap (`src/main.ts`)

- Global prefix: `/api`
- Global `ValidationPipe`: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- `helmet()` middleware
- CORS: origin from `FRONTEND_URL` (fallback `http://localhost:3000`), `credentials: true`
- Default port: `3001` (override via `PORT`)

## Module Layout

```
src/
  main.ts                  → bootstrap
  app.module.ts            → root module wiring
  config/env.validation.ts → zod-based env schema
  prisma/                  → global PrismaModule + PrismaService
  common/                  → shared utils (currently empty)
  modules/
    auth/
    users/
    transactions/
    categories/
    accounts/              → scaffold only
```

Each domain module follows the same internal layout:

```
modules/<domain>/
  <domain>.controller.ts
  <domain>.service.ts
  <domain>.module.ts
  dto/                     → request + response DTOs (class-validator)
  commands/                → write-side: CreateX/UpdateX/DeleteX command classes
    handlers/              → @CommandHandler implementations
  queries/                 → read-side: GetXByY query classes
    handlers/              → @QueryHandler implementations
  repositories/            → Prisma access layer (one repo per aggregate)
```

The controller delegates to the service; the service dispatches commands/queries via `CommandBus` / `QueryBus`; handlers call repositories; repositories own all Prisma calls. **Do not call Prisma directly from services or handlers** — always go through a repository.

## Domain Modules

| Module         | Responsibility                                                  | Status        |
| -------------- | --------------------------------------------------------------- | ------------- |
| `auth`         | Register, login, refresh, logout. JWT pair issuance.            | Implemented   |
| `users`        | User CRUD primitives consumed by `auth`.                        | Implemented   |
| `transactions` | List (filtered by month/year, paginated), create, update, delete. | Implemented |
| `categories`   | User-scoped categories CRUD.                                    | Implemented   |
| `accounts`     | Placeholder — methods throw `Error('Not implemented')`.         | Scaffold only |

## Authentication

- **Access token**: 15 min (`JWT_ACCESS_TTL`), signed with `JWT_ACCESS_SECRET`
- **Refresh token**: 7 days (`JWT_REFRESH_TTL`), signed with `JWT_REFRESH_SECRET`
- Refresh token is stored hashed (bcrypt) in `User.refreshTokenHash` and rotated on every `/auth/refresh`
- Strategies live in `src/modules/auth/strategies/`:
  - `jwt.strategy.ts` → `AuthGuard('jwt')` — protects normal endpoints
  - `jwt-refresh.strategy.ts` → `AuthGuard('jwt-refresh')` — used only on `/auth/refresh`
- `req.user` shape after `AuthGuard('jwt')`: `{ userId: string; email: string }`
- `req.user` shape after `AuthGuard('jwt-refresh')`: `{ userId, email, refreshToken }` (raw token included for hash comparison)

**Rate limits** (Throttler):
- Global default: 60 req / 60s
- `POST /auth/register`: 5 req / 60s
- `POST /auth/login`: 10 req / 60s

## Database (Prisma)

Schema: [`prisma/schema.prisma`](prisma/schema.prisma). Provider: `postgresql`.

Models:

- **User** — `id (uuid)`, `email (unique)`, `name`, `passwordHash`, `refreshTokenHash?`, timestamps
- **Category** — `id`, `name`, `color`, `userId` (FK → User, cascade), timestamps, `@@index([userId])`
- **Transaction** — `id`, `amount (Decimal(12,2))`, `type (INCOME | EXPENSE)`, `description?`, `date`, `categoryId` (FK → Category, restrict), `userId` (FK → User, cascade), timestamps, indexes `[userId, date]` and `[categoryId]`

Notes:
- Deleting a `Category` is restricted if any `Transaction` references it.
- All money is `Decimal(12, 2)` — never coerce to `number` in code paths that touch totals; use `Prisma.Decimal` or string serialization.
- Migrations live in `prisma/migrations/`.

## Configuration

`backend/.env`:

| Variable             | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string             |
| `JWT_ACCESS_SECRET`  | HMAC secret for access tokens            |
| `JWT_REFRESH_SECRET` | HMAC secret for refresh tokens           |
| `JWT_ACCESS_TTL`     | Access token TTL (e.g. `15m`)            |
| `JWT_REFRESH_TTL`    | Refresh token TTL (e.g. `7d`)            |
| `PORT`               | HTTP port (default `3001`)               |
| `NODE_ENV`           | `development` / `production` / `test`    |
| `FRONTEND_URL`       | CORS origin (default `http://localhost:3000`) |

Validated at startup by `validateEnv` (zod). Missing or malformed values crash the process before Nest boots.

## Commands

Run from the repo root:

```bash
pnpm --filter backend prisma:migrate   # apply migrations (prisma migrate dev)
pnpm --filter backend prisma:generate  # regenerate client
pnpm --filter backend prisma:studio    # database GUI on :5555
pnpm --filter backend lint
pnpm --filter backend typecheck        # tsc --noEmit
```

## Conventions

- **DTOs**: input DTOs are validated by global `ValidationPipe`. Response DTOs expose a static `fromEntity(...)` factory (see `TransactionDto`) — controllers map Prisma rows through it before returning.
- **CQRS naming**: `<Verb><Aggregate>Command` / `<Verb><Aggregate>Handler`; `Get<Aggregate>By<Key>Query` / `...Handler`.
- **Ownership checks**: every read/write that touches user-scoped data must filter by `userId` — both in the repository query and in any "find then mutate" flow. Never trust IDs from the request body alone.
- **No direct Prisma imports outside repositories.** Services and handlers depend on repositories.
- **`import type`** for type-only imports — but **never** for NestJS DI providers or `@Body()` DTO parameters (kills reflection metadata).
- **Errors**: throw Nest built-ins (`NotFoundException`, `UnauthorizedException`, `ForbiddenException`, `BadRequestException`); the global filter maps them to HTTP responses.

## Documentation

- When changing service or handler methods — update JSDoc accordingly.
- For DTOs and controllers — add or update Swagger decorators (`@ApiProperty`, `@ApiOperation`, `@ApiResponse`, etc.).
