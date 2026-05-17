# План: Главный экран (Dashboard)

## Context

Аутентификация (login/register), CRUD транзакций и категорий уже реализованы (см. [auth-frontend.md](auth-frontend.md), [transactions.md](transactions.md), [categories.md](categories.md)). Сейчас в `app/page.tsx` пустая заглушка. Цель — собрать **главный экран** трекера: защищённый layout с навигацией (Транзакции / Категории / Профиль), пагинированным списком транзакций (10 на страницу по дефолту) и кнопкой быстрого добавления транзакции.

Решения, согласованные с пользователем:
- **Пагинация — серверная** (page/limit) на бэкенде, чтобы масштабироваться.
- **Роут** — `/` внутри группы `(app)` с проверкой токена в `layout.tsx`.
- **Навигация** — top-bar на desktop + bottom tab-bar на мобилке.
- **На дашборде** — только список транзакций + CTA «Добавить транзакцию» (Sheet).

---

## Часть 1. Backend — пагинация транзакций

### 1.1. Обновить `ListTransactionsQueryDto`
Файл: `backend/src/modules/transactions/dto/list-transactions-query.dto.ts`

Добавить опциональные поля:
- `page?: number` — `@IsInt() @Min(1) @Type(() => Number)`, default `1`
- `limit?: number` — `@IsInt() @Min(1) @Max(100) @Type(() => Number)`, default `10`

### 1.2. Обновить `ListTransactionsDto` (response)
Файл: `backend/src/modules/transactions/dto/list-transactions.dto.ts`

Добавить блок `pagination`:
```ts
pagination: { page: number; limit: number; total: number; totalPages: number }
```
Сохранить `transactions` и `summary` как есть. `summary` считается по ВСЕМ записям периода (не по странице).

### 1.3. Обновить `ListTransactionsQuery` + handler
Файлы:
- `backend/src/modules/transactions/queries/list-transactions.query.ts`
- `backend/src/modules/transactions/queries/list-transactions.handler.ts`

В handler:
- Использовать `prisma.transaction.findMany` с `skip: (page-1)*limit`, `take: limit`, `orderBy: { date: 'desc' }`.
- Параллельно `prisma.transaction.count(where)` для `total`.
- `summary` считать через `groupBy` по типу (как сейчас, без `skip/take`).
- Вернуть `{ transactions, summary, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } }`.

### 1.4. Repository
Файл: `backend/src/modules/transactions/repositories/transactions.repository.ts`

Добавить метод `findManyPaginated(userId, { where, page, limit })` либо расширить существующий `findMany`. Не плодить касты — типы Prisma 7 уже корректны (см. memory `feedback_sonnet_type_casts_in_prisma`).

### 1.5. Контроллер
Файл: `backend/src/modules/transactions/transactions.controller.ts` — изменений не требует (DTO валидируется автоматически).

---

## Часть 2. Frontend — DTO и API-клиент

### 2.1. DTO транзакций в shared/api
Создать `frontend/src/shared/api/transactions.ts`:
```ts
export type TransactionType = 'INCOME' | 'EXPENSE'

export type Transaction = {
  id: string
  amount: string
  type: TransactionType
  description: string | null
  date: string
  categoryId: string
  userId: string
  createdAt: string
  updatedAt: string
}

export type TransactionsSummary = {
  totalIncome: string
  totalExpense: string
  balance: string
  count: number
}

export type Pagination = { page: number; limit: number; total: number; totalPages: number }

export type ListTransactionsResponse = {
  transactions: Transaction[]
  summary: TransactionsSummary
  pagination: Pagination
}

export type ListTransactionsParams = {
  page?: number
  limit?: number
  month?: number
  year?: number
}
```

Реэкспорт в `frontend/src/shared/api/index.ts`.

### 2.2. Аналогично — категории
Создать `frontend/src/shared/api/categories.ts` с типом `Category` (id, name, color, icon, userId, createdAt, updatedAt). Понадобится, чтобы отобразить категорию рядом с транзакцией.

---

## Часть 3. Frontend — защищённый layout и навигация

### 3.1. Route group `(app)`
Структура:
```
frontend/src/app/(app)/
  ├── layout.tsx          # auth-guard + AppHeader + MobileTabBar
  ├── page.tsx            # = DashboardView
  ├── categories/page.tsx # заглушка
  └── profile/page.tsx    # заглушка
```

`app/(app)/layout.tsx` (RSC):
- В начале вызвать `getAccessToken()` из `@/shared/lib`. Если нет токена — `redirect('/login')` (через `next/navigation`).
- Рендерит `<AppHeader />` сверху, `<main>{children}</main>`, `<MobileTabBar />` снизу.

### 3.2. Виджет AppHeader
`frontend/src/widgets/app-header/ui/AppHeader.tsx` + `index.ts`.
- Слева логотип «Treasurer».
- Центр (desktop, `hidden md:flex`): ссылки `Транзакции (/)`, `Категории (/categories)`.
- Справа: DropdownMenu с email пользователя, пункт «Выйти» (Server Action, чистит куки и редиректит на /login).
- Активная ссылка подсвечивается через `usePathname()` → `'use client'` для этого подкомпонента, либо передать `pathname` пропом из RSC.

Данные пользователя получает RSC layout: `backendFetch<User>('/users/me', { headers: { Authorization: 'Bearer …' }})`, прокидывает в `AppHeader`.

### 3.3. Виджет MobileTabBar
`frontend/src/widgets/mobile-tab-bar/ui/MobileTabBar.tsx` + `index.ts`.
- Фиксированная панель снизу, `fixed bottom-0 inset-x-0 md:hidden`.
- Три таба: Транзакции, Категории, Профиль (иконки из `lucide-react`, который тащит shadcn).
- `'use client'` ради `usePathname()`.

### 3.4. Server Action «Выйти»
`frontend/src/features/auth/logout/api/logout-action.ts` + `model` пустая + `index.ts`.
- `'use server'`, вызвать `backendFetch('/auth/logout')` с токеном, затем `clearSession()`, `redirect('/login')`.

---

## Часть 4. Frontend — список транзакций с пагинацией

### 4.1. Feature `transactions/list`
Структура:
```
frontend/src/features/transactions/list/
  ├── api/get-transactions.ts        # RSC fetcher
  ├── ui/TransactionsList.tsx        # RSC, рендерит элементы
  ├── ui/TransactionItem.tsx         # одна строка
  ├── ui/TransactionsPagination.tsx  # 'use client', ссылки ?page=N
  └── index.ts
```

**api/get-transactions.ts** (RSC):
- `export async function getTransactions(params: ListTransactionsParams): Promise<ListTransactionsResponse>`
- Тянет токен из `getAccessToken()`, делает `backendFetch<ListTransactionsResponse>` с query string.

**TransactionsList.tsx** (RSC):
- Принимает `{ page: number }`.
- Вызывает `getTransactions({ page, limit: 10 })`.
- Параллельно `getCategories()` (для рендеринга названий категорий).
- Маппит `categoryId → Category` и передаёт в `TransactionItem`.
- Внизу — `<TransactionsPagination pagination={data.pagination} />`.

**TransactionItem.tsx**:
- Строка с датой, описанием, бэйджем категории (`color`/`icon`), суммой (зелёная для INCOME, красная для EXPENSE).

**TransactionsPagination.tsx** (`'use client'`):
- `useSearchParams`, `useRouter` для перехода `?page=N`.
- Кнопки Prev / номера / Next из `shared/ui/Button`.

### 4.2. View — DashboardView
`frontend/src/views/dashboard/ui/DashboardView.tsx` + `index.ts`.
- Принимает `{ page: number }` (из searchParams).
- Заголовок «Транзакции» + кнопка `<AddTransactionTrigger />` справа.
- `<TransactionsList page={page} />`.

### 4.3. `app/(app)/page.tsx`
```tsx
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams
  const pageNum = Math.max(1, Number(page) || 1)
  return <DashboardView page={pageNum} />
}
```

---

## Часть 5. Frontend — Sheet «Добавить транзакцию»

### 5.1. Установить shadcn Sheet
```bash
pnpm --filter frontend dlx shadcn@latest add sheet
```
Это создаст `shared/ui/sheet.tsx` (на base-ui). Также понадобится `dropdown-menu` для AppHeader и `avatar` (опционально):
```bash
pnpm --filter frontend dlx shadcn@latest add dropdown-menu
```

### 5.2. Feature `transactions/create`
```
frontend/src/features/transactions/create/
  ├── api/create-transaction-action.ts   # 'use server', Server Action
  ├── model/create-transaction.ts        # zod-схема
  ├── ui/CreateTransactionForm.tsx       # 'use client', useActionState
  ├── ui/AddTransactionTrigger.tsx       # 'use client', Sheet + кнопка
  └── index.ts
```

**model/create-transaction.ts**:
```ts
z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  categoryId: z.string().uuid(),
  date: z.string().datetime(),
  description: z.string().max(500).optional(),
})
```

**api/create-transaction-action.ts**:
- Зеркало `login-action.ts`: FormData → zod → `backendFetch('/transactions', POST)` → `revalidatePath('/')`.

**ui/CreateTransactionForm.tsx**:
- Поля: тип (radio), сумма, категория (select из загруженных категорий), дата, описание.
- Категории нужно подгрузить — принять пропом `categories: Category[]` от родителя (RSC передаёт).

**ui/AddTransactionTrigger.tsx**:
- `'use client'`, открывает Sheet с `CreateTransactionForm`.
- Категории передаются пропом из RSC (`DashboardView` загружает их).

---

## Часть 6. Заглушки `/categories` и `/profile`

Чтобы навигация работала «из коробки», создать минимальные RSC-страницы:
- `app/(app)/categories/page.tsx` — заголовок «Категории» + текст «Скоро». Реальная реализация — в отдельном плане.
- `app/(app)/profile/page.tsx` — заголовок «Профиль» + email пользователя из `/users/me` + кнопка «Выйти».

---

## Критичные файлы

**Backend:**
- `backend/src/modules/transactions/dto/list-transactions-query.dto.ts`
- `backend/src/modules/transactions/dto/list-transactions.dto.ts`
- `backend/src/modules/transactions/queries/list-transactions.{query,handler}.ts`
- `backend/src/modules/transactions/repositories/transactions.repository.ts`

**Frontend (новые):**
- `frontend/src/app/(app)/{layout.tsx,page.tsx,categories/page.tsx,profile/page.tsx}`
- `frontend/src/shared/api/{transactions.ts,categories.ts}` (+ обновить `index.ts`)
- `frontend/src/widgets/app-header/` (новый слой!)
- `frontend/src/widgets/mobile-tab-bar/`
- `frontend/src/features/transactions/list/`
- `frontend/src/features/transactions/create/`
- `frontend/src/features/auth/logout/`
- `frontend/src/views/dashboard/`
- `frontend/src/shared/ui/{sheet.tsx,dropdown-menu.tsx}` (через shadcn CLI)

**Frontend (правки):**
- `frontend/src/app/page.tsx` — удалить (роут переедет в `(app)/page.tsx`).
- `frontend/src/shared/api/index.ts` — реэкспорт новых DTO.

---

## Соглашения, которые соблюдаем (важно)

- **FSD layers**: `app → views → widgets → features → shared`. `widgets/` появляется впервые — следовать тем же правилам (один `index.ts` на slice).
- **Сегментные барреллы**: всё внешнее через `@/shared/api`, `@/shared/ui`, `@/shared/lib`. Внутри `shared/ui` — импорт `cn` напрямую из `@/shared/lib/class-names`.
- **Domain-based имена**: никаких `types.ts`, `utils.ts`, `schema.ts`.
- **RSC по умолчанию**, `'use client'` только где нужен interactivity (Sheet, pagination, dropdown, табы).
- **NestJS DTO**: `import { … }` без `import type` для `@Body()`/провайдеров (см. memory).
- **Никаких лишних кастов** над Prisma-типами.

---

## Верификация

1. **Backend** — пагинация:
   ```bash
   pnpm --filter backend typecheck
   curl 'http://localhost:3001/api/transactions?page=1&limit=10' -H "Authorization: Bearer $TOKEN"
   ```
   В ответе должен быть `pagination: { page, limit, total, totalPages }`.

2. **Frontend** — типы и линт:
   ```bash
   pnpm typecheck
   pnpm --filter frontend lint
   ```

3. **Ручная проверка** (dev-сервера держит пользователь):
   - Открыть `/` без токена → редирект на `/login`.
   - Залогиниться → попасть на дашборд со списком транзакций.
   - Создать через бэкенд/сид ≥ 11 транзакций → убедиться, что показаны 10, появилась пагинация, переход `?page=2` грузит остаток.
   - Кликнуть «Добавить транзакцию» → открывается Sheet, форма сабмитится, список обновляется (revalidate).
   - Через DropdownMenu в хедере — «Выйти» → редирект на `/login`, куки очищены.
   - На мобильной ширине (<768px): хедер сворачивается, появляется bottom tab-bar.
   - Перейти на `/categories` и `/profile` через табы — открываются заглушки.

---

## Чек-лист исполнения

### Backend
- [ ] Обновить `ListTransactionsQueryDto` (page/limit)
- [ ] Обновить `ListTransactionsDto` (pagination)
- [ ] Обновить `ListTransactionsHandler` (skip/take + count)
- [ ] Обновить `TransactionsRepository`
- [ ] `pnpm --filter backend typecheck` green

### Frontend — DTO
- [ ] `shared/api/transactions.ts`
- [ ] `shared/api/categories.ts`
- [ ] Обновить `shared/api/index.ts`

### Frontend — layout / навигация
- [ ] Установить `sheet`, `dropdown-menu` через shadcn CLI
- [ ] `app/(app)/layout.tsx` (+ auth guard)
- [ ] `widgets/app-header/`
- [ ] `widgets/mobile-tab-bar/`
- [ ] `features/auth/logout/`

### Frontend — dashboard
- [ ] `features/transactions/list/` (api + ui + pagination)
- [ ] `features/transactions/create/` (Sheet + form + action)
- [ ] `views/dashboard/`
- [ ] `app/(app)/page.tsx`
- [ ] Заглушки `categories/page.tsx` и `profile/page.tsx`
- [ ] Удалить старый `app/page.tsx`

### Финал
- [ ] `pnpm typecheck` green
- [ ] `pnpm --filter frontend lint` green
- [ ] Ручная проверка по списку из «Верификация»
