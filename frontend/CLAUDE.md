# Frontend — CLAUDE.md

Next.js 16 frontend for Treasurer. See the root [`CLAUDE.md`](../CLAUDE.md) for project-wide rules (git workflow, commits, language).

> When working in `frontend/src/`, also consult the `frontend-engineer` skill — it has the canonical templates and import paths.

## Stack

- **Next.js 16** with App Router + React 19 (Server Components by default)
- **TypeScript 6**, strict
- **Tailwind CSS 4** (`@tailwindcss/postcss`) + `tw-animate-css`
- **shadcn/ui** (`base-nova` style) on **`@base-ui/react`** primitives — see [`components.json`](components.json)
- **lucide-react** — icon library
- **clsx** + **tailwind-merge** → `cn()` in `shared/lib/class-names.ts`
- **zod** — schema validation for forms and env
- **No client-side data layer** (no TanStack Query / SWR / Redux). Data flow is RSC fetch → Server Action mutate → `revalidate*` / `redirect`.

## Architecture — Feature-Sliced Design (FSD)

> For FSD methodology questions — use the `feature-sliced-design` skill (`.claude/skills/feature-sliced-design/SKILL.md`).

Layers (top imports only from below):

```
app/        → Next.js App Router (thin page shells, layouts, metadata)
views/      → FSD pages layer (renamed to avoid clashing with app/)
widgets/    → composite UI blocks (header, tab bar)
features/   → user-action slices: features/<domain>/<action>/{model,api,ui}
shared/     → reusable infra: shared/ui, shared/api, shared/lib, shared/config
```

### Project-specific overrides

- **`views/` instead of `pages/`** — when the FSD skill says `pages`, apply it to `views/` here.
- **No `entities/` layer** — DTO types live in `shared/api/<domain>.ts` and are re-exported via `shared/api/index.ts`.
- **Segment barrels**: every `shared/` segment has an `index.ts`. Consumers import via barrel (`@/shared/api`, `@/shared/lib`, `@/shared/ui`, `@/shared/config`), never via internal paths.
  - Exception: files inside `shared/ui/*.tsx` import `cn` from `@/shared/lib/class-names` directly to avoid a within-layer circular dependency.
- **Domain-based naming**: no `types.ts`, `schema.ts`, `utils.ts`. Use the domain — `login.ts`, `register.ts`, `class-names.ts`, `create-transaction.ts`.
- **Slice public API**: every feature/view/widget exposes an `index.ts`; consumers import from the slice root.

### Slice internal layout

```
features/<domain>/<action>/
  index.ts                 → public API
  model/<action>.ts        → zod schema + inferred type
  api/<action>-action.ts   → 'use server' Server Action
  ui/<Component>.tsx       → 'use client' form / interactive UI
```

Views and widgets follow `<slice>/index.ts` + `ui/<Component>.tsx`. Server-only views (e.g. `DashboardView`) stay as RSC and call the backend directly; client interactivity is delegated to features.

## Directory Map

```
src/
  app/                     → Next.js App Router
    layout.tsx             → root layout (font, html)
    (auth)/                → route group — login/register layout
      login/page.tsx
      register/page.tsx
    (app)/                 → route group — authenticated layout (token check + redirect)
      page.tsx             → dashboard route
      profile/page.tsx
      categories/page.tsx
  views/
    dashboard/             → composes transactions list + create
    login/
    register/
  widgets/
    app-header/            → desktop header with user menu
    mobile-tab-bar/        → mobile bottom navigation
  features/
    auth/{login,register,logout}/
    transactions/{list,create}/
  shared/
    api/                   → DTO types + backendFetch / fetchWithAuth
    config/                → env access
    lib/                   → session (cookies), cn (class-names)
    ui/                    → shadcn/ui components
```

## RSC vs Client Components

- **Default**: Server Components. No `'use client'` unless the component needs interactivity, hooks, or browser APIs.
- **`'use client'`** belongs in `features/*/ui/*.tsx` and similar interactive leaves — keep the client island small.
- **`'use server'`** is the first line of every Server Action file (`features/*/api/*-action.ts` and `shared/lib/session.ts`).
- Layouts under `(app)/` are async RSCs — they read cookies, call the backend, and `redirect()` on auth failure.

## Authentication

- Tokens are stored as **httpOnly cookies** via Server Actions in [`src/shared/lib/session.ts`](src/shared/lib/session.ts):
  - `accessToken` — 15 min, `httpOnly`, `sameSite: 'strict'`, `secure` in production
  - `refreshToken` — 7 days, same flags
- `setSession({ accessToken, refreshToken })` after a successful auth response; `clearSession()` on logout.
- `getAccessToken()` / `getRefreshToken()` read cookies — call them from RSCs and Server Actions, never from `'use client'`. In feature/view/widget code prefer `fetchWithAuth` so you don't have to touch tokens at all.
- Route protection: `app/(app)/layout.tsx` calls `fetchWithAuth<User>('/users/me')`; on failure `fetchWithAuth` itself `redirect('/login')`s. There is no middleware-based protection — the layout is the gate.

## HTTP Client

Two helpers live in [`src/shared/api/http.ts`](src/shared/api/http.ts), both exported from `@/shared/api`:

- **`backendFetch<T>(path, init?)`** — low-level wrapper:
  - Base URL: `API_URL` from `@/shared/config` (reads `NEXT_PUBLIC_API_URL`, defaults to `http://localhost:3001` in dev; **required** in production).
  - Sets `Content-Type: application/json` and `cache: 'no-store'` by default.
  - Non-2xx → throws **`ApiError`** with `status` and a normalized `message` (joins `class-validator` array errors).
  - Use directly **only** for unauthenticated endpoints (`/auth/login`, `/auth/register`).

- **`fetchWithAuth<T>(path, init?)`** — the default for every authenticated call:
  - Reads `accessToken` from cookies and attaches `Authorization: Bearer ${token}`.
  - On `ApiError` with `status === 401` it tries `POST /auth/refresh` with the `refreshToken` cookie. On success — `setSession(newTokens)` and retries the original request once with the fresh access token.
  - On refresh failure (no refresh cookie / non-OK response) — `clearSession()` + `redirect('/login')`.
  - Other errors (non-401, or 401 after a successful retry) bubble up as `ApiError` for the Server Action to map.
  - Example:
    ```ts
    return fetchWithAuth<User>('/users/me')
    ```
  - **Never** call `getAccessToken()` and pass `Authorization` manually for protected endpoints — that bypasses the refresh-flow.

Catch `ApiError` in Server Actions to map status codes to user-facing copy.

## Forms — Canonical Pattern

The reference implementations are [`features/auth/login`](src/features/auth/login) and [`features/auth/register`](src/features/auth/register). Every form follows the same shape:

1. **`model/<action>.ts`** — zod schema + inferred type.
2. **`api/<action>-action.ts`** — `'use server'` Server Action:
   - Parses `FormData` via `schema.safeParse`
   - On validation failure: returns `{ fieldErrors, formError: null }`
   - On success: calls `backendFetch`, then `setSession` / `revalidate*`, then `redirect`
   - On `ApiError`: maps status (e.g. `401 → 'Invalid email or password'`) to `formError`
   - Returns shape: `{ fieldErrors: Partial<Record<Field, string[]>>, formError: string | null }`
3. **`ui/<Form>.tsx`** — `'use client'`:
   - `useActionState(action, initialState)` for state
   - `useFormStatus()` inside a `<SubmitButton>` child for `pending`
   - **Dirty-field pattern**: a local `Set<FieldKey>` clears errors as the user types; errors reappear only after the next submit
   - `<Field data-invalid={...}>` + `<FieldError>` from `shared/ui`

When adding a new form, copy the structure from `login`/`register` rather than inventing a new one.

## UI Components

- All shadcn components live in `src/shared/ui/`, exported via `src/shared/ui/index.ts`.
- shadcn config ([`components.json`](components.json)): `style: base-nova`, `rsc: true`, icons: `lucide`, `baseColor: neutral`, `cssVariables: true`.
- Aliases: `components`/`ui` → `@/shared/ui`, `utils` → `@/shared/lib/class-names`, `lib` → `@/shared/lib`.
- **Always** import UI through the barrel: `import { Button, Card, Field } from '@/shared/ui'`.
- `cn()` utility: `import { cn } from '@/shared/lib'` (or `@/shared/lib/class-names` only from inside `shared/ui/*`).
- Adding a new shadcn component: `pnpm dlx shadcn@latest add <name>` — it lands in `shared/ui/` and you must re-export it from `shared/ui/index.ts`.

## Configuration

`frontend/.env.local`:

| Variable              | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend base URL (required in production, default `http://localhost:3001` in dev) |

Accessed only through `@/shared/config` (`API_URL`). Do not read `process.env` from feature/view/widget code.

## Commands

Run from the repo root:

```bash
pnpm --filter frontend lint        # eslint src (next lint was removed in Next.js 16)
pnpm --filter frontend typecheck   # tsc --noEmit
```

> Don't start `pnpm dev:web` — the user keeps it running.

## Conventions

- **Import via barrels** — `@/shared/ui`, `@/shared/api`, `@/shared/lib`, `@/shared/config`. Internal paths are only legal inside the same segment.
- **Slice public API** — import from `@/features/<domain>/<action>`, never from `@/features/<domain>/<action>/ui/...`.
- **UI strings in English** — labels, placeholders, errors, page titles. No i18n framework; do not introduce one.
- **Server boundary** — `'use server'` for actions, `'use client'` only where needed. Never import a `'use server'` file from another `'use server'` file just to "reuse" — extract a plain function instead.
- **Error mapping** — Server Actions catch `ApiError` and translate `status` → user-facing copy. Do not surface raw backend messages unless they are safe.
- **No new top-level layers** — no `entities/`, no `processes/`. If something doesn't fit `shared / features / widgets / views / app`, ask first.
- **File naming**: components `PascalCase.tsx`, everything else kebab-case (`login.ts`, `class-names.ts`, `login-action.ts`).
