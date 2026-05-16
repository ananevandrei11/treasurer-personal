# Treasurer

Personal expense tracker.

## Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Frontend | Next.js 16 (App Router, TypeScript) |
| Styles | Tailwind CSS |
| Backend | Nest.js 11 (TypeScript) |
| ORM | Prisma |
| Database | PostgreSQL 17 |
| Auth | JWT (access + refresh) |

## Structure

```
frontend/   — Next.js 16
backend/    — Nest.js 11
```

## Local setup

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Copy environment variables
cp .env.example backend/.env
cp .env.example frontend/.env.local

# 3. Install dependencies
pnpm install

# 4. Apply migrations
pnpm --filter backend prisma:migrate

# 5. Start the apps
pnpm dev:api   # http://localhost:3001
pnpm dev:web   # http://localhost:3000

# 6. (optional) Database GUI
pnpm --filter backend prisma:studio
```

## Development URLs

| What | URL |
|-----|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001/api |
| Prisma Studio | http://localhost:5555 (run: `pnpm studio`) |
