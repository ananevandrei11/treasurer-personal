# Conventions reference

Project-specific conventions that are easy to miss. Pin this open while editing anything under `frontend/src/`.

## Imports

### Allowed

```ts
import { backendFetch, ApiError, type User } from '@/shared/api'
import { cn, setSession, getAccessToken } from '@/shared/lib'
import { Button, Card, Input } from '@/shared/ui'
import { API_URL } from '@/shared/config'

import { LoginForm } from '@/features/auth/login'
import { LoginView } from '@/views/login'
```

### Forbidden

```ts
// ❌ Deep imports into a segment from outside that file's segment
import { backendFetch } from '@/shared/api/http'
import { cn } from '@/shared/lib/class-names'
import { Button } from '@/shared/ui/button'

// ❌ Deep imports into a slice
import { LoginForm } from '@/features/auth/login/ui/LoginForm'

// ❌ Cross-slice imports between sibling features
import { somethingFromRegister } from '@/features/auth/register/model/register'
```

### One exception

Files inside `shared/ui/*.tsx` import `cn` directly from `@/shared/lib/class-names`. This is the only deep import allowed, and only to avoid a barrel cycle within the `shared/` layer.

```ts
// ✅ allowed only inside shared/ui/*.tsx
import { cn } from '@/shared/lib/class-names'
```

### When you add a new export to a segment

Update the segment's `index.ts` in the same change. Consumers must be able to reach it via the barrel.

## HTTP and errors

`backendFetch<T>(path, init?)` is the only way to call the backend. It is defined in `shared/api/http.ts` and exported from `@/shared/api`.

- Always pass a generic: `backendFetch<AuthResponse>('/auth/login', { ... })`.
- Throws `ApiError(status, message)` on non-2xx.
- Backend `message` may be a string or an array of strings — `backendFetch` joins arrays for you.
- Use it from **Server Components and Server Actions only**. Don't call it from `'use client'` code (no httpOnly cookie access on the client).

Mapping errors to user-friendly copy:

```ts
if (err instanceof ApiError) {
  const msg =
    err.status === 401 ? 'Invalid email or password' :
    err.status === 409 ? 'A user with this email already exists' :
    `Server error: ${err.message}`
  return { ...initialState, formError: msg }
}
return { ...initialState, formError: 'Something went wrong. Please try again.' }
```

## Session and auth

`shared/lib/session.ts` (re-exported from `@/shared/lib`):

- `setSession(tokens)` — writes `accessToken` (15m) and `refreshToken` (7d) as httpOnly cookies. Called by auth Server Actions after a successful `/auth/login` or `/auth/register`.
- `clearSession()` — deletes both cookies.
- `getAccessToken()` — reads the access token. Use in Server Components / Server Actions when forwarding to the backend.

All three are `async` because `cookies()` is async in Next 16.

## Server vs Client

- **Default to Server Components.** No directive needed.
- **`'use client'` only when you need**: hooks (`useState`, `useActionState`, `useEffect`, etc.), event handlers, browser-only APIs (window/document), `useFormStatus`.
- **`'use server'` Server Actions** live in `features/<x>/api/<x>-action.ts`. They run on the server but can be called from client components via `useActionState` / direct invocation.
- **Tokens are httpOnly cookies.** Never accept tokens in client code; never call the backend with `fetch` directly from `'use client'`.

## Naming

| Thing                              | Convention                            | Example                          |
| ---------------------------------- | ------------------------------------- | -------------------------------- |
| Schema file                        | `<action>.ts`                         | `login.ts`                       |
| Action file                        | `<action>-action.ts`                  | `login-action.ts`                |
| Form/UI component                  | `<Action>Form.tsx` / `<Name>View.tsx` | `LoginForm.tsx`, `LoginView.tsx` |
| Re-exported state type             | `<Action>State`                       | `LoginState`                     |
| Shared lib file                    | Domain name                           | `session.ts`, `class-names.ts`   |
| Shared API DTO file                | Domain name                           | `auth.ts`, `transactions.ts`     |
| Tailwind utility helper            | `cn` from `@/shared/lib`              | `cn('p-4', cond && 'bg-red')`    |

Never use `types.ts`, `schema.ts`, `utils.ts`, `helpers.ts`, `constants.ts`. Pick a domain word.

## Styling

- Tailwind CSS 4 with custom tokens in `app/globals.css`. Color names: `background`, `foreground`, `border`, `input`, `ring`, `primary`, `primary-foreground`, `secondary`, `muted`, `muted-foreground`, `destructive`, `card`. Use these, not raw hex.
- Forms use a shared `inputCls` constant inside the form file (see canonical login/register forms).
- Combine classes with `cn()` from `@/shared/lib`. `cn` runs `clsx` + `tailwind-merge`, so later classes override earlier ones reliably.
- Use Lucide icons (`lucide-react`).

## Adding a shadcn component

Use the CLI, do not hand-write. Style is **base-nova**, primitives come from `@base-ui/react`.

```bash
pnpm dlx shadcn@latest add <component>
```

The CLI is configured (see `frontend/components.json`) to output into `@/shared/ui` using `cn` from `@/shared/lib/class-names`. After install:

1. Update `frontend/src/shared/ui/index.ts` to re-export the new component.
2. Verify the file does `import { cn } from '@/shared/lib/class-names'` (the allowed deep import).
3. Consume it as `import { NewThing } from '@/shared/ui'`.

## Validation, lint, typecheck

After any frontend edit:

```bash
pnpm --filter frontend lint    # eslint src
pnpm typecheck                  # both packages
```

`next lint` no longer exists in Next 16 — don't try it.

## Russian / English

The app UI is **English**. Communication with the user (in this Claude session) is **Russian**. Don't confuse the two — when writing strings that end up in the product (button labels, validation messages, metadata, error copy), use English. When explaining what you did to the user in chat, use Russian.

## Things this project deliberately does not have (yet)

If you're tempted to add one of these, stop and ask first:

- No `entities/` FSD layer.
- No client-side state library (Redux, Zustand, TanStack Query). Server Actions + RSC fetches are the model.
- No client-side `fetch` to the backend. All backend calls go through `backendFetch` on the server.
- No i18n framework. The app is English-only.
- No test framework wired up yet.
