# View + Page template

A view composes features/widgets into a screen. A page is a thin Next.js route shell that mounts the view.

## Directory shape

```
views/<name>/
├── index.ts                 # public API
└── ui/
    └── <Name>View.tsx       # composition; can be RSC or 'use client' (default: RSC)

app/<route-path>/page.tsx    # Next.js route — mounts the view, exports metadata
```

## views/<name>/index.ts

```ts
export { LoginView } from './ui/LoginView'
```

## views/<name>/ui/<Name>View.tsx

A view is normally a Server Component. Compose features and (in the future) widgets. Keep it tiny — composition only, no business logic.

```tsx
import { LoginForm } from '@/features/auth/login'

export function LoginView() {
  return <LoginForm />
}
```

When the view needs to fetch read data, do it here (RSC), then pass props down:

```tsx
import { backendFetch } from '@/shared/api'
import { AccountsList } from '@/features/accounts/list'
import type { Account } from '@/shared/api'

export async function AccountsView() {
  const accounts = await backendFetch<Account[]>('/accounts')
  return <AccountsList accounts={accounts} />
}
```

## app/<route>/page.tsx

Pages are thin shells. **No data fetching, no logic, no JSX beyond `<View />`.** Just metadata and a mount.

```tsx
import type { Metadata } from 'next'
import { LoginView } from '@/views/login'

export const metadata: Metadata = { title: 'Sign in — Treasurer' }

export default function LoginPage() {
  return <LoginView />
}
```

### Rules that are easy to miss

- **`import type { Metadata } from 'next'`** — type-only import.
- **`metadata.title` is in English** and follows `Page name — Treasurer` format.
- **The view is imported via the slice barrel** `@/views/<name>`, not the file path.
- **No layout JSX here** — wrap layouts using `app/<route-group>/layout.tsx` (e.g. the `(auth)` group has a layout that paints the gradient background).
- **Route groups** like `(auth)` are used to share a layout without affecting the URL. Don't put logic in the group folder name.

## Where the page chrome (titles, cards, gradients) goes

| Concern                     | Lives in                                              |
| --------------------------- | ----------------------------------------------------- |
| Auth gradient background    | `app/(auth)/layout.tsx`                               |
| Page title in browser tab   | `app/.../page.tsx` `metadata.title`                   |
| Heading + intro copy        | The view (`views/<name>/ui/<Name>View.tsx`)           |
| Form fields and submit      | The feature (`features/<domain>/<action>/ui/...Form.tsx`) |
| Reusable button/card/input  | `shared/ui/`                                          |
