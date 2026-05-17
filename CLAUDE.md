# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal expense tracker (Treasurer). Monorepo with pnpm workspaces.

## Commands

```bash
# Start the database
docker compose up -d

# Install dependencies
pnpm install

# Start in development mode
pnpm dev:api   # backend → http://localhost:3001/api
pnpm dev:web   # frontend → http://localhost:3000

# Build
pnpm build:api
pnpm build:web

# Lint
pnpm --filter frontend lint   # eslint src (next lint was removed in Next.js 16)
pnpm --filter backend lint

# Typecheck (both packages)
pnpm typecheck

# Prisma
pnpm --filter backend prisma:migrate   # apply migrations
pnpm --filter backend prisma:generate  # regenerate client
pnpm --filter backend prisma:studio    # database GUI
```

## Architecture

### Backend (NestJS 11, port 3001)

- All routes are served under the `/api` global prefix
- Modules: `auth`, `users`, `accounts`, `categories`, `transactions`
- `PrismaModule` is global — injected into all modules
- Auth: JWT access (15m) + refresh (7d) via `passport-jwt`; strategies in `src/modules/auth/strategies/`
- Input validation — `class-validator` / `class-transformer` via global `ValidationPipe` (whitelist + forbidNonWhitelisted)
- ORM — Prisma 7 (schema: `backend/prisma/schema.prisma`), models: User, Account, Category, Transaction

### Frontend (Next.js 16, port 3000)

- App Router, TypeScript, Tailwind CSS 4, shadcn/ui (base-nova style, `@base-ui/react`)
- HTTP client — `backendFetch` in `frontend/src/shared/api/http.ts`; base URL from `NEXT_PUBLIC_API_URL`
- Auth tokens stored as httpOnly cookies via Server Actions (`shared/lib/session.ts`)

#### Architecture — Feature-Sliced Design (FSD)

> For any FSD-related task (layer placement, where code belongs, public API, cross-imports, migration, auth/API/Redux/TanStack Query patterns, Next.js App Router integration) — use the `feature-sliced-design` skill (`.claude/skills/feature-sliced-design/SKILL.md`).
>
> **Project-specific override**: the FSD `pages` layer is named `views/` here to avoid clashing with Next.js's `app/` routing conventions. When the skill refers to `pages`, apply it to `views/`.

Layers (top imports only from below):

```
app/        → Next.js App Router (thin page shells, layouts, metadata)
views/      → FSD pages layer (renamed from "pages" to avoid Next.js conflict)
widgets/    → composite UI blocks (future)
features/   → user-action slices, e.g. features/auth/login/{model,api,ui}
shared/     → reusable infra: shared/ui (shadcn), shared/api, shared/lib, shared/config
```

Rules:
- Each slice has `index.ts` as its public API — only import via index
- `app/` renders `views/`, `views/` composes `features/` and `widgets/`
- **No `entities/` layer** — auth/user DTO types (`User`, `AuthResponse`) live in `shared/api/auth.ts`, re-exported via `shared/api/index.ts`
- **Segment barrels**: every `shared/` segment has an `index.ts`; consumers import via barrel (`@/shared/api`, `@/shared/lib`, `@/shared/ui`, `@/shared/config`), never via internal paths (`@/shared/api/http`, `@/shared/lib/utils`, etc.)
- **Exception**: `shared/ui/*.tsx` import `cn` from `@/shared/lib/class-names` directly (avoids barrel circular dependency within the same layer)
- **Domain-based naming**: no `types.ts`, `schema.ts`, `utils.ts` — use domain names instead (`login.ts`, `register.ts`, `class-names.ts`)
- shadcn/ui components live in `shared/ui/`; `cn` utility in `shared/lib/class-names.ts`

### Environment Variables

Backend (`backend/.env`): `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `PORT`, `NODE_ENV`, `FRONTEND_URL`

Frontend (`frontend/.env.local`): `NEXT_PUBLIC_API_URL`

## Git Workflow (GitHub Flow)

This project uses **GitHub Flow** — a lightweight branch-based workflow.

### Rules

- `main` is always deployable (stable, working code only)
- Every feature, fix, or experiment lives in its own branch
- Branch names follow the pattern: `<type>/<short-description>` (e.g., `feat/add-categories-page`, `fix/auth-refresh-token`)
- Work on the branch; commit as often as needed
- Before merging: run lint, typecheck, and manually verify the feature works
- Merge into `main` only when the branch is complete and verified
- Delete the branch after merging

### Step-by-step

```bash
# 1. Start from an up-to-date main
git checkout main && git pull

# 2. Create a feature branch
git checkout -b feat/my-feature

# 3. Work, commit incrementally
git add <files>
git commit -m "feat(scope): description"

# 4. Verify before merging
pnpm typecheck
pnpm --filter frontend lint
pnpm --filter backend lint

# 5. Merge into main
git checkout main
git merge --no-ff feat/my-feature   # --no-ff keeps branch history visible
git push

# 6. Clean up
git branch -d feat/my-feature
```

> `--no-ff` (no fast-forward) creates a merge commit even when it isn't strictly required, which preserves the fact that a branch existed and groups all its commits together in the history.

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

Format: `<type>(<scope>): <description>`

**Types:** `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`

**Scope** (optional): module or layer affected — `auth`, `transactions`, `accounts`, `categories`, `ui`, `prisma`, `config`

```
feat(transactions): add create transaction endpoint
fix(auth): handle expired refresh token
refactor(ui): extract button to shared/ui
chore(prisma): add Transaction model migration
```

Rules:
- Description in imperative mood, lowercase, no period at the end
- Breaking change: append `!` after type/scope → `feat(auth)!: change token format`
- Body/footer optional; use for breaking changes or issue references

## Implementation Status

The project is in early scaffold stage. Most service methods (auth, users, accounts, categories, transactions) throw `Error('Not implemented')`. Prisma models have not yet been added to the schema.
