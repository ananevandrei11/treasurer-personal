# CLAUDE.md

<!-- last reviewed: 2026-05-17 -->
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal expense tracker (Treasurer). Monorepo with pnpm workspaces.

- Backend: NestJS 11 — see [`backend/CLAUDE.md`](backend/CLAUDE.md)
- Frontend: Next.js 16 — see [`frontend/CLAUDE.md`](frontend/CLAUDE.md)

## Commands

All commands are run from the repo root.

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
```

Package-specific commands (Prisma, etc.) live in the subdirectory `CLAUDE.md` files.

## IMPORTANT: Git Workflow (GitHub Flow)

This project uses **GitHub Flow** — a lightweight branch-based workflow.

- `main` is always deployable; every change lives in its own branch off `main`.
- Branch names: `<type>/<short-description>` (e.g., `feat/add-categories-page`, `fix/auth-refresh-token`).
- Before merging: run lint + typecheck (see [Commands](#commands)) and manually verify the feature works.
- Merge with `git merge --no-ff` to preserve branch history, then delete the branch.

```bash
git checkout main && git pull
git checkout -b feat/my-feature
# ...work, commit incrementally...
git checkout main
git merge --no-ff feat/my-feature
git push
git branch -d feat/my-feature
```

<important if="Нужно написать коммит / commit">
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

</important>

## Language

The app UI is **English-only**. All product-facing strings — button labels, validation messages, headings, placeholders, aria-labels, error copy, page titles — must be in English. The app has no i18n framework; do not add one.

## Implementation Status

The project is in early scaffold stage. Most service methods (auth, users, accounts, categories, transactions) throw `Error('Not implemented')`. Prisma models have not yet been added to the schema.
