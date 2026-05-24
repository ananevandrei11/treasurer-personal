---
name: frontend-engineer
description: Project-specific frontend engineer for the Treasurer Next.js 16 app (FSD, React 19 Server Actions, shadcn/ui base-nova, Tailwind 4, zod). Use for ANY change under `frontend/src/` — new page, form, FSD slice, shared/ui component, import refactor, or one-file tweak. Encodes the project's non-obvious rules (segment barrels, `views/` not `pages/`, domain-based names, RSC/'use client' split, error-mapping) so the result matches the canonical `features/auth/{login,register}` example.
---

# Frontend Engineer — Treasurer

You are working on the **Treasurer** personal expense tracker. The frontend lives in `frontend/` and is built with a specific stack and a strict layout that you must follow. This skill is your single source of truth for any change inside `frontend/`.

For pure FSD methodology questions (what layer for what code, cross-imports, `@x` pattern, etc.), defer to the `feature-sliced-design` skill. This skill complements it with project-specific templates and conventions.

## Before you start (mandatory — do all before writing any code)

### 1. Git branch
This project uses **GitHub Flow**: every change lives in its own branch off `master`.

check current branch - !`git branch --show-current`
sync first - !`git pull`
```bash
git checkout -b feat/<short-description>   # branch name: <type>/<short-description>
```

Do **not** commit directly to `master`. If the user hasn't named a branch, derive one from the task (e.g. `feat/add-categories-page`). Ask the user to confirm the branch name only if the scope is ambiguous.

### 2. Read current API and schema
Before touching any file that communicates with the backend, read:
- `.claude/docs/api.md` — current request/response shapes for all endpoints
- `.claude/docs/database.md` — current Prisma models and field names

This prevents implementing against a stale schema. These docs are the source of truth for what the backend accepts and returns.

### 3. Load relevant Next.js reference
Check which scenario matches the task and read the file from `.claude/skills/next-best-practices/`:

| Scenario | File |
|---|---|
| `'use client'` / `'use server'` / Server Action form | `directives.md`, `rsc-boundaries.md` |
| React 19 form reset, controlled vs uncontrolled inputs | `rsc-boundaries.md`, `data-patterns.md` |
| `cookies()`, `headers()`, async `params`/`searchParams` | `async-patterns.md` |
| New route, layout, error boundary, not-found | `file-conventions.md`, `error-handling.md` |
| Data fetching, waterfall, `Promise.all`, Suspense | `data-patterns.md`, `suspense-boundaries.md` |
| `useSearchParams` / `usePathname` without Suspense | `suspense-boundaries.md` |
| Modal with intercepting routes | `parallel-routes.md` |
| Hydration mismatch | `hydration-error.md` |

## Stack — exact versions and what they mean

- **Next.js 16** (App Router only; no Pages Router). `next lint` was removed — use `pnpm --filter frontend lint` which runs `eslint src`.
- **React 19**. Server Components by default. Use `useActionState` (React 19, replaces `useFormState`) and `useFormStatus` (from `react-dom`) for forms. `cookies()`, `headers()` are **async** in Next 16.
- **TypeScript 6** with `"moduleResolution": "bundler"`. Path alias: `@/* → frontend/src/*`.
- **Tailwind CSS 4** (no `tailwind.config.js` runtime — config via `tailwind.config.ts` + CSS variables). Custom tokens live in `app/globals.css` (oklch colors, base-nova).
- **shadcn/ui** with style `base-nova` and primitives from `@base-ui/react` (not Radix). Components live in `shared/ui/`. CLI alias: `@/shared/ui`.
- **zod** for schemas (used in form `model/` files).
- **No global state library** (no Redux/Zustand/TanStack Query yet). Server Actions handle mutations; RSC fetches handle reads.
- **Auth**: httpOnly cookies set by Server Actions. JWT access (15m) + refresh (7d).

## Architecture — Feature-Sliced Design (project flavor)

Layers, top imports only from below:

```
app/        Next.js App Router (thin page shells: metadata + <View />)
views/      FSD pages layer (renamed to avoid clash with Next's app/)
widgets/    composite UI blocks (not used yet — create if needed)
features/   user-action slices: features/<domain>/<action>/{model,api,ui}
shared/     reusable infra: shared/{ui, api, lib, config, hooks}
```

### Non-obvious project rules

These differ from "vanilla FSD" or default shadcn setup. **Easy to miss — always apply.**

1. **No `entities/` layer.** Domain DTO types (`User`, `AuthResponse`, etc.) live in `shared/api/<domain>.ts` and are re-exported via `shared/api/index.ts`.
2. **`views/` not `pages/`**, because Next's `app/` is already the routing layer. When the FSD skill talks about "pages", it means our `views/`.
3. **Segment barrels are mandatory.** Every `shared/` segment has an `index.ts`. Consumers import via the barrel:
   - ✅ `import { backendFetch, ApiError } from '@/shared/api'`
   - ✅ `import { cn, setSession } from '@/shared/lib'`
   - ❌ `import { backendFetch } from '@/shared/api/http'` (forbidden)
4. **Exception**: files inside `shared/ui/*.tsx` import `cn` directly from `@/shared/lib/class-names` to avoid an intra-layer barrel cycle. This is the only allowed deep import.
5. **Slice public API.** Every slice (`features/<domain>/<action>/`, `views/<name>/`) exposes an `index.ts`. Consumers import only via the slice root: `import { LoginForm } from '@/features/auth/login'`.
6. **Domain-based file names**, no `types.ts` / `schema.ts` / `utils.ts`. Use the domain: `login.ts`, `register.ts`, `class-names.ts`, `session.ts`.
7. **`import type` is fine for plain types, but never for NestJS DI / `@Body()` params** (backend rule — but if you ever wire shared DTO types across packages, keep this in mind).
8. **App Router pages are thin shells**: a `metadata` export and a single `<View />` from `@/views/<name>`. No data fetching, no logic.

## The canonical feature template

The repo's canonical reference is `features/auth/{login,register}`. **Copy that shape exactly** when adding a new user-action feature. Read [references/feature-template.md](references/feature-template.md) for the full file-by-file template with the exact conventions for:

- `model/<action>.ts` — zod schema + inferred type
- `api/<action>-action.ts` — `'use server'` Server Action with `useActionState`-compatible signature, `safeParse`, `backendFetch`, error mapping by HTTP status, `redirect` on success
- `ui/<Action>Form.tsx` — `'use client'`, `useActionState` + `useFormStatus`, accessible `<form>` with `aria-invalid`, field errors, submit pending state
- `index.ts` — public API re-exporting the UI component and the action + state type

For a new view + Next route, read [references/view-and-page.md](references/view-and-page.md) — it shows the minimal shape for `views/<name>/` and `app/.../page.tsx`.

For anything else (HTTP, session, error handling, shadcn install, styling), read [references/conventions.md](references/conventions.md).

## Decision flow for any frontend task

Before editing, decide:

1. **What kind of change is this?**
   - New user action (form, mutation, login, create something) → new feature slice. Template: [references/feature-template.md](references/feature-template.md).
   - New route → new `views/<name>/` + thin `app/.../page.tsx`. Template: [references/view-and-page.md](references/view-and-page.md).
   - Reusable UI primitive → goes to `shared/ui/`. Prefer `pnpm dlx shadcn@latest add <component>` (style `base-nova`) over hand-writing — see [references/conventions.md#shadcn](references/conventions.md#adding-a-shadcn-component).
   - HTTP/session utility → `shared/api/` or `shared/lib/`, then re-export through the segment `index.ts`.
   - Pure tweak (style, copy, prop) → edit the file directly, but verify the import paths still go through barrels.

2. **Server or client component?** Default is Server. Add `'use client'` only when you need hooks, event handlers, or browser APIs. Form components that use `useActionState`/`useFormStatus` must be `'use client'`. Server Actions must start with `'use server'`.

3. **Where does data come from?**
   - **Mutations** (POST/PUT/DELETE) → Server Action in `features/<x>/api/<x>-action.ts`, calls `backendFetch`.
   - **Reads** for a page → fetch in the RSC (`views/<name>/ui/<Name>View.tsx` server component or the page itself), pass data down as props.
   - **Reads triggered by user interaction** → if needed in client code, create a Server Action that wraps `backendFetch` and call it from the client. (No client-side `fetch` to the backend — tokens are httpOnly.)

4. **What do you import and from where?** Check [references/conventions.md#imports](references/conventions.md#imports) — the barrel rules are strict.

## Verification checklist before you finish

Run through this list and fix anything you missed:

- [ ] Every new slice has an `index.ts` public API; consumers only import from it.
- [ ] Every shared segment touched still has its `index.ts` up-to-date (added new exports if you added new files).
- [ ] No deep imports like `@/shared/api/http` outside of `shared/ui/*.tsx`.
- [ ] Server Actions start with `'use server'` at the very top of the file.
- [ ] Client components start with `'use client'` at the very top of the file.
- [ ] Form actions use the `(prev: State, formData: FormData) => Promise<State>` shape and validate via `zod.safeParse`.
- [ ] Errors from `backendFetch` are caught as `ApiError` and mapped to user-friendly messages by HTTP status.
- [ ] File names are domain-based, not generic (`login.ts`, not `schema.ts`).
- [ ] All UI strings, metadata titles, validation messages, and error copy are in English (`lang="en"`).
- [ ] No `next lint` invocations — only `pnpm --filter frontend lint`.
- [ ] After changes: `pnpm --filter frontend lint` and `pnpm typecheck` are clean.
- [ ] If any API endpoint shape or Prisma model changed: updated `.claude/docs/api.md` and/or `.claude/docs/database.md`.

## When the user asks something this skill doesn't cover

- Pure FSD methodology question → `feature-sliced-design` skill.
- Backend (NestJS, Prisma, auth strategies) → out of scope of this skill; check the backend section of `CLAUDE.md`.
- Adding a new shadcn primitive → see [references/conventions.md#adding-a-shadcn-component](references/conventions.md#adding-a-shadcn-component).

## Quick-reference paths

- Canonical feature: `frontend/src/features/auth/login/` and `.../register/`
- Canonical view: `frontend/src/views/login/`
- Canonical page: `frontend/src/app/(auth)/login/page.tsx`
- HTTP client: `frontend/src/shared/api/http.ts` (re-exported via `@/shared/api`)
- Session cookies: `frontend/src/shared/lib/session.ts` (re-exported via `@/shared/lib`)
- shadcn config: `frontend/components.json` (style `base-nova`, aliases pointed at `shared/`)
