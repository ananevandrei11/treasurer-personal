# Feature template — `features/<domain>/<action>/`

A "feature" in this project is a single user action: log in, register, create transaction, delete account, etc. The canonical reference is `frontend/src/features/auth/login/`. Replicate its shape one-to-one.

## Directory shape

```
features/<domain>/<action>/
├── index.ts                  # public API of the slice
├── model/
│   └── <action>.ts           # zod schema + inferred TS type (NO logic)
├── api/
│   └── <action>-action.ts    # 'use server' Server Action
└── ui/
    └── <Action>Form.tsx      # 'use client' form using useActionState
```

- File names are **domain-based**. Not `schema.ts` — use `<action>.ts`. Not `action.ts` — use `<action>-action.ts`. The repeated name is intentional because slice paths get aliased away by barrels.
- Component file is `PascalCase` and matches the export name.

## index.ts — public API

Re-export the UI component and the Server Action (with its state type, since the consumer needs the type for the initial state).

```ts
export { LoginForm } from './ui/LoginForm'
export { loginAction, type LoginState } from './api/login-action'
```

Consumers import only via the slice root:

```ts
import { LoginForm, loginAction, type LoginState } from '@/features/auth/login'
```

## model/<action>.ts — zod schema

Schema + inferred type. English error messages. No business logic, no side effects.

```ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter a password'),
})

export type LoginSchema = z.infer<typeof loginSchema>
```

## api/<action>-action.ts — Server Action

```ts
'use server'

import { redirect } from 'next/navigation'
import { backendFetch, ApiError } from '@/shared/api'
import { setSession } from '@/shared/lib'
import { loginSchema } from '../model/login'
import type { AuthResponse } from '@/shared/api'

export type LoginState = {
  fieldErrors: Partial<Record<'email' | 'password', string[]>>
  formError: string | null
}

const initialState: LoginState = { fieldErrors: {}, formError: null }

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      formError: null,
    }
  }

  try {
    const data = await backendFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    })
    await setSession(data)
  } catch (err) {
    if (err instanceof ApiError) {
      const msg =
        err.status === 401 ? 'Invalid email or password' : `Server error: ${err.message}`
      return { ...initialState, formError: msg }
    }
    return { ...initialState, formError: 'Something went wrong. Please try again.' }
  }

  redirect('/')
}
```

### Rules that are easy to miss

- **`'use server'` is the first line.** Not after imports — first line.
- **Signature is `(prev: State, formData: FormData) => Promise<State>`** so it works with `useActionState`. Even if you don't use `prev`, name it `_prev`.
- **`State` shape**: `{ fieldErrors: Partial<Record<FieldName, string[]>>, formError: string | null }`. `fieldErrors` is keyed by form field; `formError` is the top-level banner. Field arrays come straight from `zod.flatten().fieldErrors`.
- **Validation first, network second.** Use `safeParse`. On failure return `fieldErrors` only (leave `formError: null`).
- **Catch only `ApiError`.** Map known statuses to specific English messages, fall back to `Server error: ${err.message}` for other API errors and `Something went wrong. Please try again.` for non-API failures.
- **`redirect()` outside the try/catch.** `redirect` throws a special Next error; if it's inside the catch the error handling will swallow it.
- **Auth actions call `setSession` from `@/shared/lib`.** Tokens are httpOnly cookies — never return them to the client.
- **Imports go through barrels** (`@/shared/api`, `@/shared/lib`) — never deep paths.

## ui/<Action>Form.tsx — client form

```tsx
'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { loginAction, type LoginState } from '../api/login-action'

const initialState: LoginState = { fieldErrors: {}, formError: null }

const inputCls =
  'w-full rounded-xl border border-input bg-background px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/30'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initialState)

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.formError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.formError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={state.fieldErrors.email ? 'true' : undefined}
          className={inputCls}
        />
        {state.fieldErrors.email && (
          <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      {/* …more fields… */}

      <SubmitButton />
    </form>
  )
}
```

### Rules that are easy to miss

- **`'use client'` is the first line.**
- **`useActionState` is from `react`** (React 19). **`useFormStatus` is from `react-dom`.** Don't mix them up.
- **Submit button lives in its own subcomponent** so `useFormStatus` works — the hook only sees the pending state of its parent form when called from inside the form's tree, *not* from the same component that holds the `useActionState` call.
- **`<form action={action}>`** — pass the action directly. Not `onSubmit`.
- **`noValidate`** — disable browser validation; zod is the source of truth.
- **`aria-invalid={state.fieldErrors.X ? 'true' : undefined}`** — string `'true'`, not boolean.
- **Field errors render the first message** (`fieldErrors.email[0]`).
- **All copy in English.** Buttons, labels, placeholders, error messages — English. The app is `lang="en"`.
- **Inputs use plain Tailwind classes**, not the `<Input />` from `shared/ui` for auth forms — the design uses a custom `inputCls` constant. For non-auth forms, prefer `<Input />` and `<Label />` from `@/shared/ui` unless you have a specific visual reason.

## Where the form gets rendered

The form does **not** render its own page chrome (no card wrapper, no title, no gradient background) — that belongs to the view or the layout. Keep the form component focused on the form itself. (The auth form examples in the repo include a card wrapper because there is no separate `widgets/` slice for it yet; for new features, prefer keeping the form lean and put chrome in the view.)
