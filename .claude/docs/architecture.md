# Architecture

## Overview

Monorepo with pnpm workspaces. Two packages: `backend` (NestJS 11 API) and `frontend` (Next.js 16 SPA).

```
client (browser)
    │  httpOnly cookies (accessToken / refreshToken)
    ▼
frontend (Next.js 16, :3000)
    │  Server Actions / RSC fetch
    ▼
backend (NestJS 11, :3001/api)
    │  Prisma 7
    ▼
PostgreSQL 17 (:5432)
```

---

## Backend

### Bootstrap (`src/main.ts`)

- Global prefix `/api`
- `helmet()` — security headers
- CORS: `FRONTEND_URL` (default `http://localhost:3000`), `credentials: true`
- `ValidationPipe`: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- Throttler (global guard): 60 req / 60 s; per-endpoint overrides on auth routes
- Swagger: mounted at `/api/docs`

### Module layout

```
src/
  main.ts
  app.module.ts
  config/env.validation.ts     zod env schema — crashes process if invalid
  prisma/                      PrismaModule (global) + PrismaService
  common/                      shared decorators (CurrentUser)
  modules/
    auth/
    users/
    transactions/
    categories/
    accounts/                  scaffold only — methods throw Error('Not implemented')
```

### Domain module layout

Every domain module follows the same internal structure:

```
modules/<domain>/
  <domain>.controller.ts       HTTP layer — delegates to service
  <domain>.service.ts          orchestrates commands/queries via buses
  <domain>.module.ts           wires providers, imports CqrsModule
  dto/                         input DTOs (class-validator) + response DTOs (static fromEntity)
  commands/
    <verb>-<domain>.command.ts
    handlers/                  @CommandHandler — write side
  queries/
    get-<domain>-by-<key>.query.ts
    handlers/                  @QueryHandler — read side
  repositories/                Prisma access layer — only place allowed to call PrismaService
```

### Request flow

```
Controller
  → Service.method(userId, dto)
      → CommandBus.execute(new CreateXCommand(...))   (write)
      → QueryBus.execute(new GetXByYQuery(...))        (read)
          → Handler
              → Repository
                  → PrismaService
```

Rules:
- **Services and handlers never import PrismaService directly** — all Prisma access goes through a repository.
- **Ownership is enforced at repository level**: every query includes `userId` in the WHERE clause.
- Response DTOs expose `static fromEntity(entity)` — controllers map through it before returning.

### Authentication

- **JWT access token** — 15 min, signed with `JWT_ACCESS_SECRET`
- **JWT refresh token** — 7 days, signed with `JWT_REFRESH_SECRET`
- Refresh token stored hashed (bcrypt) in `User.refreshTokenHash`; rotated on every `/auth/refresh`
- `AuthGuard('jwt')` — protects all normal endpoints; `req.user` → `{ userId, email }`
- `AuthGuard('jwt-refresh')` — used only on `/auth/refresh`; `req.user` → `{ userId, email, refreshToken }`

### Rate limiting (Throttler)

| Endpoint           | Limit       |
|--------------------|-------------|
| Global default     | 60 req/60 s |
| POST /auth/register | 5 req/60 s |
| POST /auth/login   | 10 req/60 s |

---

## Frontend

### Architecture — FSD (Feature-Sliced Design)

Layers (each layer may only import from layers below it):

```
app/        Next.js App Router — thin page shells, layouts, metadata
views/      FSD "pages" layer (renamed to avoid clash with app/)
widgets/    Composite UI blocks (app-header, mobile-tab-bar)
features/   User-action slices: features/<domain>/<action>/{model,api,ui}
shared/     Reusable infra: api, config, lib, ui
```

### Project-specific FSD rules

- `views/` is used instead of `pages/`
- No `entities/` layer — DTO types live in `shared/api/<domain>.ts`
- `shared/` segments have `index.ts` barrels; consumers import via barrel, never internal paths
- Every feature/view/widget exposes `index.ts` as public API
- File naming: components `PascalCase.tsx`, everything else `kebab-case.ts`

### Slice internal layout (features)

```
features/<domain>/<action>/
  index.ts                  public API
  model/<action>.ts         zod schema + inferred type
  api/<action>-action.ts    'use server' Server Action
  ui/<Component>.tsx        'use client' interactive UI
```

### RSC vs client components

- Default: **Server Components** — no `'use client'` unless the component needs interactivity, hooks, or browser APIs
- `'use client'` — interactive leaves in `features/*/ui/*.tsx`
- `'use server'` — first line of every Server Action (`features/*/api/*-action.ts`, `shared/lib/session.ts`)
- `app/dashboard/layout.tsx` is an async RSC that reads cookies, calls `/users/me`, and `redirect('/auth/login')` on failure — this is the auth gate

### HTTP client (`shared/api/http.ts`)

- `backendFetch<T>(path, init?)` — unauthenticated requests only (`/auth/login`, `/auth/register`)
- `fetchWithAuth<T>(path, init?)` — default for all authenticated calls; handles 401 → refresh → retry automatically
- Non-2xx responses throw `ApiError` with `status` and normalized `message`
- Server Actions catch `ApiError` and map `status` → user-facing copy

### Authentication (frontend)

- Tokens stored as **httpOnly cookies** via `shared/lib/session.ts`
  - `accessToken` — 15 min, `httpOnly`, `sameSite: 'strict'`
  - `refreshToken` — 7 days, same flags
- `setSession()` / `clearSession()` called from Server Actions — never from `'use client'`
- `fetchWithAuth` owns the refresh flow — never call `getAccessToken()` manually for authenticated requests
