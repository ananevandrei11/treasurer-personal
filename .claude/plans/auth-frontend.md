# Страницы Login и Registration (Next.js 16 + FSD + shadcn/ui)

## Context

Backend Auth уже реализован через CQRS (`backend/src/modules/auth/*`): `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`. Все возвращают `{ user, accessToken, refreshToken }` (см. `dto/auth-response.dto.ts`). Бэкенд держит CORS с `credentials: true` и origin = `FRONTEND_URL`.

Фронтенд сейчас в зачаточном состоянии: `src/app/page.tsx` с заголовком, `src/lib/api.ts` с примитивным `apiFetch` (без `/api` в пути, без обработки токенов), пустые `src/components/`, `src/types/`. Tailwind 4 подключён через `@tailwindcss/postcss`, но `globals.css` использует v3-директивы — потребуется миграция при `shadcn init`.

Цель — реализовать страницы `/login` и `/register` поверх существующего API. Архитектура — **Feature-Sliced Design**. Управление формами — **Server Actions + useActionState + zod**. Хранение токенов — **httpOnly cookies**, выставляемые Server Action через `next/headers`.

## Архитектурные решения

- **FSD-слой страниц** называем `views/` (Next.js занимает имя `app/`, поэтому слой `pages` переименован — распространённое соглашение FSD+Next).
- **Server Actions** (`'use server'`) валидируют форму через zod и проксируют запрос на NestJS, кладут токены в httpOnly cookies (`accessToken`, `refreshToken`), затем `redirect('/')`.
- **shadcn/ui** ставится в `src/shared/ui/` (override defaults в `components.json`). Используем `Button`, `Input`, `Label`, `Card`, `Alert` (без shadcn `Form`, так как RHF не используем).
- **HTTP-клиент** в `src/shared/api/`: серверный helper для вызова бэкенда (читает cookies, добавляет `Authorization: Bearer`), плюс утилита для сессионных cookies.

## Целевая структура

```
frontend/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx           → <LoginView />
│   │   └── register/page.tsx        → <RegisterView />
│   ├── layout.tsx                   (русская локаль, body className)
│   ├── globals.css                  (Tailwind v4 + shadcn theme)
│   └── page.tsx
├── views/
│   ├── login/{ui/LoginView.tsx, index.ts}
│   └── register/{ui/RegisterView.tsx, index.ts}
├── features/
│   └── auth/
│       ├── login/
│       │   ├── ui/LoginForm.tsx          (client component, useActionState)
│       │   ├── model/schema.ts           (zod-схема ровно как backend LoginDto)
│       │   ├── api/login-action.ts       ('use server')
│       │   └── index.ts
│       └── register/
│           ├── ui/RegisterForm.tsx
│           ├── model/schema.ts           (email + name min 2 + password min 8)
│           ├── api/register-action.ts
│           └── index.ts
├── entities/
│   └── user/
│       ├── model/types.ts                (User, AuthResponse — зеркало UserDto/AuthResponseDto)
│       └── index.ts
└── shared/
    ├── ui/                                (shadcn компоненты: button/input/label/card/alert)
    ├── lib/
    │   ├── utils.ts                       (cn — сгенерирует shadcn init)
    │   └── session.ts                     (setSession/clearSession/getAccessToken через next/headers)
    ├── api/
    │   └── http.ts                        (серверный fetch для backend, добавляет /api и Bearer)
    └── config/
        └── env.ts                         (API_URL из process.env)
```

Удалить: `src/components/.gitkeep`, `src/types/.gitkeep`, `src/lib/api.ts` (заменяется на `shared/api/http.ts`).

## Контракт API (для типов и zod)

```ts
// entities/user
type User = { id: string; email: string; name: string; createdAt: string; updatedAt: string }
type AuthResponse = { user: User; accessToken: string; refreshToken: string }

// features/auth/login — zod
z.object({ email: z.string().email(), password: z.string().min(1) })

// features/auth/register — zod (повторяет class-validator RegisterDto)
z.object({ email: z.string().email(), name: z.string().min(2), password: z.string().min(8) })
```

## Поток Server Action (login/register одинаково)

1. Client `<form action={action}>` + `useActionState(action, initialState)`.
2. Action принимает `(prevState, formData)`, парсит zod-схемой. Ошибки полей → возвращаются в `state.fieldErrors`.
3. Успешный parse → `fetch(${API_URL}/api/auth/{login|register}, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, cache: 'no-store' })`.
4. `401/409` → возврат `state.formError` с сообщением.
5. `200/201` → `cookies().set('accessToken', token, { httpOnly: true, sameSite: 'lax', secure: NODE_ENV==='production', path: '/', maxAge: 60*15 })`, аналогично `refreshToken` (maxAge 7d). Затем `redirect('/')`.

`shared/lib/session.ts` инкапсулирует константы имён cookie и `cookies()` API.

## Чек-лист реализации

### 1. Зависимости и инициализация shadcn/ui
- [x] `pnpm --filter frontend add zod`
- [x] `shadcn@latest init` — стиль base-nova (вместо New York), aliases настроены корректно.
- [x] `components.json`, `src/shared/lib/utils.ts`, `globals.css` (Tailwind v4), `tailwind.config.ts` — на месте.
- [x] `pnpm dlx shadcn@latest add button input label card alert`
- [x] Удалены `src/components/`, `src/types/`.

### 2. `shared/`
- [x] `shared/config/env.ts` — экспортирует `API_URL`.
- [x] `shared/api/http.ts` — `backendFetch(path, init)`. **Исправлен баг**: `.env.local` содержал `NEXT_PUBLIC_API_URL=http://localhost:3001/api`, а `http.ts` добавлял `/api` ещё раз → двойной `/api/api/`. Убрали лишний `/api` из `http.ts`; теперь URL строится как `${API_URL}${path}`.
- [x] `shared/lib/session.ts` — `setSession`, `clearSession`, `getAccessToken` через `cookies()`.
- [x] Удалён `src/lib/api.ts` (вся директория `src/lib/` удалена).

### 3. `entities/user`
- [x] `entities/user/model/types.ts` — типы `User`, `AuthResponse`. Re-export через `index.ts`.

### 4. `features/auth/login`
- [x] `model/schema.ts` — `loginSchema` (zod: email + password min 1).
- [x] `api/login-action.ts` — `loginAction(prev, formData)` с zod, backendFetch, ApiError, setSession, redirect.
- [x] `ui/LoginForm.tsx` — `'use client'`, `useActionState`, `useFormStatus`, кастомные инпуты (shadcn-компоненты не использованы, но функционально эквивалентно).
- [x] `index.ts` — public API.

### 5. `features/auth/register`
- [x] `registerSchema` (email/name min 2/password min 8), `registerAction` (409 → «Пользователь уже существует»), `RegisterForm`.

### 6. `views/`
- [x] `views/login/ui/LoginView.tsx` — рендерит `<LoginForm />` (заголовок и ссылка на /register встроены в форму).
- [x] `views/register/ui/RegisterView.tsx` — рендерит `<RegisterForm />`.

### 7. `app/`
- [x] `app/(auth)/login/page.tsx` — `metadata.title = 'Вход — Treasurer'`, рендерит `<LoginView />`.
- [x] `app/(auth)/register/page.tsx` — `metadata.title = 'Регистрация — Treasurer'`, рендерит `<RegisterView />`.
- [x] `app/(auth)/layout.tsx` — центрирующий контейнер с градиентным фоном.

### 8. CLAUDE.md
- [x] Добавлен блок «Architecture — Feature-Sliced Design» со всеми слоями и правилами.

### 9. Проверка
- [x] `pnpm --filter frontend typecheck` — без ошибок.
- [x] `pnpm --filter frontend lint` — чисто.
- [x] Регистрация нового пользователя → редирект на `/`, Set-Cookie: `accessToken` (HttpOnly, 15m) + `refreshToken` (HttpOnly, 7d) в ответе.
- [x] Логин с верными данными → редирект на `/`.
- [x] Кейсы ошибок:
  - Пустая форма register → подсветка всех трёх полей с сообщениями zod.
  - Повторный register → «Пользователь с таким email уже существует» (409).
  - Неверный пароль login → «Неверный email или пароль» (401).
- [ ] Логаут не реализуется в этом плане — отдельная задача.

## Файлы, которые будут изменены/созданы

- Изменения: `frontend/package.json`, `frontend/src/app/layout.tsx` (возможно, шрифт), `frontend/src/app/globals.css` (Tailwind v4 + shadcn-токены), `frontend/tailwind.config.ts`, `frontend/tsconfig.json` (paths уже включают `@/*`), `CLAUDE.md`.
- Создаются: `frontend/components.json`, всё дерево `frontend/src/{views,features,entities,shared}/...` из секции «Целевая структура».
- Удаляются: `frontend/src/lib/api.ts`, `frontend/src/components/.gitkeep`, `frontend/src/types/.gitkeep`, директории `src/lib`, `src/components`, `src/types`.

## Вне scope

- Refresh-логика (middleware/Route Handler `/api/refresh`) и автоматический logout по 401.
- Защищённые маршруты (middleware с проверкой cookie).
- Страница профиля, форма logout.
- E2E-тесты.
