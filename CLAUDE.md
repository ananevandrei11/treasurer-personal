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

- `master` is always deployable; every change lives in its own branch off `master`.
- Branch names: `<type>/<short-description>` (e.g., `feat/add-categories-page`, `fix/auth-refresh-token`).
- **Before creating a feature branch**: always switch to local `master` and pull the latest changes (`git checkout master && git pull`). Never branch off a stale local `master` — it leads to avoidable merge conflicts and re-reviewing already-merged code.
- Before merging: run lint + typecheck (see [Commands](#commands)) and manually verify the feature works.
- Merge with `git merge --no-ff` to preserve branch history, then delete the branch.

```bash
git checkout master && git pull   # mandatory: sync local master before branching
git checkout -b feat/my-feature
# ...work, commit incrementally...
git checkout master
git merge --no-ff feat/my-feature
git push
git branch -d feat/my-feature
```

## Commit Convention

Use the `/commit` skill — it encodes all rules, scopes, and constraints for this project.
See [`.claude/skills/commit/SKILL.md`](.claude/skills/commit/SKILL.md) for the full specification.

## Language

The app UI is **English-only**. All product-facing strings — button labels, validation messages, headings, placeholders, aria-labels, error copy, page titles — must be in English. The app has no i18n framework; do not add one.

## Implementation Status

The project is in early scaffold stage. Most service methods (auth, users, accounts, categories, transactions) throw `Error('Not implemented')`. Prisma models have not yet been added to the schema.

## Update docs
When adding functionality, check .claude/docs/*.
Update files when architecture or API changes or database changes. also update the dev-guide if there are global changes.