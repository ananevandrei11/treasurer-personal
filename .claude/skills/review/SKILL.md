---
name: review
description: >
  Code review for the Treasurer project. Use when the user asks to review a PR, diff, or branch.
  Accepts an optional PR number or branch name as argument (e.g. /review 9, /review feat/my-branch).
  Without an argument reviews the current branch diff against master.
  Reviews with full project context — stack, FSD architecture, Next.js 16 patterns, auth flow, conventions.
model: Sonnet
effort: low
allowedTools:
  - Bash(gh *)
  - Bash(git *)
  - Bash(grep *)
  - Read
---

# Code Review — Treasurer

You are a senior engineer on the **Treasurer** personal expense tracker. You know the full codebase. Your job is to catch **real bugs** in the diff — logic errors, broken invariants, hydration mismatches, missing guards, wrong patterns for this stack. Do not comment on style, formatting, or nitpicks unless they cause a bug.

## Step 1 — Get the diff

If an argument was passed:
- If it looks like a number → `gh pr diff <N> --repo ananevandrei11/treasurer-personal`
- If it looks like a branch → `git diff master...<branch>`
- Otherwise try both

Without argument:
```bash
git diff master...HEAD
```

If the diff is empty, fall back to `git diff HEAD` (uncommitted changes).

## Step 2 — Load conditional references

Before reviewing, scan the diff for these patterns and read the corresponding reference files **only if the pattern appears**:

| Pattern in diff | Read this file |
|---|---|
| `useEffect`, `useState`, `"use client"`, hydration, SSR | `.claude/skills/next-best-practices/hydration-error.md` |
| `if (isMobile)` / structural branch on SSR-unsafe hook | `.claude/skills/next-best-practices/rsc-boundaries.md` |
| `cookies()`, `headers()`, `params`, `searchParams` | `.claude/skills/next-best-practices/async-patterns.md` |
| `useActionState`, `useFormStatus`, Server Action, `'use server'` | `.claude/skills/next-best-practices/directives.md` |
| `Suspense`, `loading.tsx`, `useSearchParams`, `usePathname` without Suspense | `.claude/skills/next-best-practices/suspense-boundaries.md` |
| new route, `layout.tsx`, `error.tsx`, `not-found.tsx` | `.claude/skills/next-best-practices/file-conventions.md` |
| `revalidatePath`, `revalidateTag`, data fetch, `cache` | `.claude/skills/next-best-practices/data-patterns.md` |
| new FSD layer/slice, cross-import between slices, `@x` pattern | `.claude/skills/feature-sliced-design/SKILL.md` |

Do **not** read all files — only those matched by the diff.

## Step 3 — Review with project context

Apply ALL of the following lenses. For each lens, scan the diff for violations. Only report findings that are **real bugs** (wrong output, crash, broken feature, data loss, security issue, or a pattern that is explicitly forbidden in this project).

### Stack facts (know these cold)

- **Next.js 16 App Router + React 19**. Server Components by default. `cookies()`, `headers()`, `params`, `searchParams` are all **async**.
- **`"use client"`** components are still SSR'd by Next.js. `useEffect` doesn't run during SSR. `useState` lazy initializer runs on server AND client — if it produces different values (e.g. `Math.random()`), that's a hydration mismatch.
- **`useIsMobile` / similar hooks**: return a stable value on server (`false`/`undefined`). If a component renders structurally different trees based on this hook (e.g. `if (isMobile) return <Sheet>` else `return <div>`), the SSR HTML and client hydration won't match — React will throw or show a flash.
- **Server Actions**: `'use server'` as first line. Return shape must match `useActionState` expectations. After mutation → `revalidatePath` for ALL routes that show affected data.
- **`fetchWithAuth`**: for authenticated calls. Never call `getAccessToken()` and attach `Authorization` manually.
- **`backendFetch`**: only for unauthenticated endpoints (`/auth/*`).
- **Cookies**: set/delete only in proxy.ts, route handlers, or Server Actions — never in RSC.

### FSD / Architecture rules

- Layers (imports only from below): `app → views → widgets → features → shared`
- No `entities/` layer — types in `shared/api/<domain>.ts`
- **`views/` not `pages/`** — FSD "pages" layer is named `views/` here
- **Barrels**: consumers import `@/shared/ui`, `@/shared/api`, `@/shared/lib`, `@/shared/config` — never internal paths like `@/shared/ui/button`
  - Exception: files inside `shared/ui/*.tsx` may import `cn` from `@/shared/lib/class-names` directly
- **Slice public API**: import from `@/features/<domain>/<action>`, never from `@/features/<domain>/<action>/ui/SomeComponent`
- No cross-imports between slices at the same layer without `@x` pattern
- New top-level layers (`entities/`, `processes/`) are forbidden without explicit approval

### UI / Component rules

- All shadcn components live in `shared/ui/` and must be re-exported from `shared/ui/index.ts`
- Import UI via barrel: `import { Button } from '@/shared/ui'`
- `cn()` → `import { cn } from '@/shared/lib'` (or `@/shared/lib/class-names` inside shared/ui)
- Icons from `lucide-react` only
- UI strings in **English** — no Russian in JSX/templates

### Auth / HTTP rules

- `proxy.ts` (not `middleware.ts`) handles token refresh
- `app/(app)/layout.tsx` uses `fetchWithAuth<User>('/users/me')` — no manual token checks
- Server Actions catch `ApiError` and map `status` → user-facing string; never surface raw backend messages

### Data / mutation rules

- After any Server Action that mutates → check `revalidatePath` covers ALL affected routes
- `revalidatePath('/')` does NOT cover `/categories` — each route needs its own call

### Common bug patterns to always check

1. `Math.random()` / `Date.now()` / `crypto.randomUUID()` in `useState` initializer → hydration mismatch
2. Structural branching on `useIsMobile()` / similar SSR-unsafe hooks at component root → hydration mismatch
3. Cookie written client-side but never read back to initialize state → broken persistence
4. `pb-20` (80px) padding to clear a fixed bar whose height changed to `60px` → dead space / content clipped
5. `overflow-y-auto` on a flex child with no bounded-height ancestor → never actually scrolls
6. CSS custom property used (e.g. `--sidebar-accent`) on an element outside the provider that defines it → invisible / transparent
7. `pathname === href` for active nav → breaks on any sub-route (use `pathname.startsWith(href)` for non-root)
8. Missing `SidebarTrigger` on desktop → no way to reopen collapsed sidebar with mouse
9. `SidebarProvider` cookie set but `defaultOpen` hardcoded → state not persisted across reloads
10. Barrel re-exports a dead/unused component with wrong color tokens → latent breakage on re-import

## Step 3 — Output

List only **confirmed bugs** — things that are provably wrong given the code. If something is speculative, say PLAUSIBLE and explain the scenario.

Format each finding as:

```
[SEVERITY] file:line — one-sentence summary
Scenario: concrete input/state → wrong output or crash
```

Severity: **CRITICAL** (data loss, security, auth bypass) | **HIGH** (broken feature, crash, hydration error) | **MEDIUM** (visual bug, inconsistency, latent breakage) | **LOW** (minor UX)

If nothing is found: say so directly — "No bugs found."

Do NOT:
- Comment on single/double quotes, trailing commas, or formatting
- Suggest refactors not related to correctness
- Flag patterns that are correct for this project's stack
- Invent problems that are not in the diff
