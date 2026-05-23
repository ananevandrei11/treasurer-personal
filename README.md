# Treasurer

Personal expense tracker. Monorepo with pnpm workspaces.

## Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Monorepo   | pnpm 9 workspaces, Node 22                        |
| Frontend   | Next.js 16 · React 19 · TypeScript 6              |
| Styles     | Tailwind CSS 4 · shadcn/ui (base-nova)            |
| Backend    | NestJS 11 · CQRS · TypeScript 6                   |
| ORM        | Prisma 7 (driver: `@prisma/adapter-pg`)           |
| Database   | PostgreSQL 17                                     |
| Auth       | JWT — access (15 min) + refresh (7 d), httpOnly cookies |
| Validation | class-validator (backend) · zod (both)            |
| Docs       | Swagger / OpenAPI (`@nestjs/swagger`)             |

## Requirements

- Node 22 (`volta` pin in `package.json`)
- pnpm 9.15+
- Docker & Docker Compose (for PostgreSQL)

## Quick Start

### 1. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL 17 on port `5432` with:
- user: `treasurer`
- password: `treasurer`
- database: `treasurer_db`

To stop the database:

```bash
docker compose stop        # stop containers, keep data
docker compose down        # stop and remove containers (data preserved in volume)
docker compose down -v     # stop, remove containers AND wipe all data
```

### 2. Environment variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

**`backend/.env`**

| Variable             | Default / Example                     | Purpose                         |
|----------------------|---------------------------------------|---------------------------------|
| `DATABASE_URL`       | `postgresql://treasurer:treasurer@localhost:5432/treasurer_db` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET`  | *(generate a strong random string)*   | HMAC secret for access tokens   |
| `JWT_REFRESH_SECRET` | *(generate a strong random string)*   | HMAC secret for refresh tokens  |
| `JWT_ACCESS_TTL`     | `15m`                                 | Access token lifetime           |
| `JWT_REFRESH_TTL`    | `7d`                                  | Refresh token lifetime          |
| `PORT`               | `3001`                                | HTTP port                       |
| `NODE_ENV`           | `development`                         | Runtime environment             |
| `FRONTEND_URL`       | `http://localhost:3000`               | CORS allowed origin             |

**`frontend/.env.local`**

| Variable              | Default                    | Purpose                      |
|-----------------------|----------------------------|------------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001`    | Backend base URL             |

### 3. Install dependencies

```bash
pnpm install
```

### 4. Run database migrations

```bash
pnpm --filter backend prisma:migrate
```

### 5. Start dev servers

```bash
pnpm dev:api   # backend  → http://localhost:3001/api
pnpm dev:web   # frontend → http://localhost:3000
```

## Development URLs

| What           | URL                                              |
|----------------|--------------------------------------------------|
| Frontend       | http://localhost:3000                            |
| API            | http://localhost:3001/api                        |
| Swagger UI     | http://localhost:3001/api/docs                   |
| Prisma Studio  | http://localhost:5555 (`pnpm studio`)            |

## Project Structure

```
treasurer-personal/
├── backend/                   NestJS 11 API
│   ├── prisma/
│   │   ├── schema.prisma      Prisma schema (User, Category, Transaction)
│   │   └── migrations/
│   └── src/
│       ├── main.ts            Bootstrap (global prefix /api, helmet, CORS, throttler)
│       ├── app.module.ts
│       ├── config/            Zod-based env validation
│       ├── prisma/            PrismaModule + PrismaService
│       ├── common/            Shared utils
│       └── modules/
│           ├── auth/          Register, login, refresh, logout
│           ├── users/         User profile
│           ├── transactions/  CRUD + filtering/pagination
│           ├── categories/    User-scoped categories CRUD
│           └── accounts/      Scaffold only
│
├── frontend/                  Next.js 16 App Router (FSD architecture)
│   └── src/
│       ├── app/               Route shells, layouts, metadata
│       ├── views/             FSD pages layer (dashboard, login, register)
│       ├── widgets/           Composite UI (app-header, mobile-tab-bar)
│       ├── features/          User-action slices (auth, transactions)
│       └── shared/            api, config, lib, ui (shadcn components)
│
├── docker-compose.yml         PostgreSQL 17
├── package.json               Root scripts + pnpm workspace config
└── pnpm-workspace.yaml
```

Each backend domain module follows `controller → service → CommandBus/QueryBus → handler → repository → Prisma`.

## API Endpoints

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <accessToken>`.

### Auth — `/api/auth`

| Method | Path               | Auth | Description                              |
|--------|--------------------|------|------------------------------------------|
| POST   | `/register`        | —    | Create account (rate-limited: 5 req/60s) |
| POST   | `/login`           | —    | Obtain token pair (rate-limited: 10 req/60s) |
| POST   | `/refresh`         | refresh token | Rotate token pair             |
| POST   | `/logout`          | JWT  | Invalidate refresh token                 |

### Users — `/api/users`

| Method | Path   | Auth | Description          |
|--------|--------|------|----------------------|
| GET    | `/me`  | JWT  | Get current user     |

### Transactions — `/api/transactions`

| Method | Path    | Auth | Description                                          |
|--------|---------|------|------------------------------------------------------|
| GET    | `/`     | JWT  | List transactions (filter: `month`, `year`; paginated) |
| POST   | `/`     | JWT  | Create transaction                                   |
| GET    | `/:id`  | JWT  | Get transaction by ID                                |
| PATCH  | `/:id`  | JWT  | Update transaction                                   |
| DELETE | `/:id`  | JWT  | Delete transaction                                   |

### Categories — `/api/categories`

| Method | Path    | Auth | Description              |
|--------|---------|------|--------------------------|
| GET    | `/`     | JWT  | List user categories      |
| POST   | `/`     | JWT  | Create category           |
| GET    | `/:id`  | JWT  | Get category by ID        |
| PUT    | `/:id`  | JWT  | Update category           |
| DELETE | `/:id`  | JWT  | Delete category           |

> Deleting a category is restricted while any transaction references it.

## Useful Commands

```bash
# Lint all packages
pnpm lint

# Typecheck all packages
pnpm typecheck

# Format code
pnpm format

# Prisma
pnpm --filter backend prisma:generate   # regenerate Prisma client
pnpm --filter backend prisma:migrate    # apply migrations
pnpm --filter backend prisma:studio     # database GUI on :5555

# Build
pnpm build:api
pnpm build:web
```
