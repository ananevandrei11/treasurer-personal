# План: модуль Transactions

## Context

Центральный модуль учёта доходов и расходов. На бэке уже есть скелет `backend/src/modules/transactions/` (controller, service, module), но все методы — заглушки `throw new Error('Not implemented')`, и модели `Transaction` в Prisma пока нет. Эталонный паттерн полностью реализован в `backend/src/modules/categories/` (CQRS + Repository + JWT-guard) — задача довести transactions до того же уровня, добавив Prisma-модель, миграцию и всю CRUD-логику с агрегацией по периоду.

Итог: пользователь, авторизованный по JWT, может создавать/получать/обновлять/удалять свои транзакции и получать сводку доход/расход/баланс за выбранный месяц.

## Архитектурные решения

- **CQRS в Transactions**: Commands (`Create`, `Update`, `Delete`) и Queries (`GetTransactionsByUser`, `GetTransactionByIdForUser`) с отдельными handler-ами, по образцу `categories`.
- **Repository**: `TransactionRepository` инкапсулирует Prisma-доступ.
- **Связь с Categories через CQRS**: в `CreateTransactionHandler` и `UpdateTransactionHandler` владение `categoryId` проверяется через `queryBus.execute(new GetCategoryByIdForUserQuery(...))` из `categories/queries/` (а не Prisma напрямую). Это и есть требуемое «взаимодействие через CQRS».
- **Авторизация**: `@UseGuards(AuthGuard('jwt'))` на контроллере, `userId` из `req.user` (тип `JwtUser` — как в `categories.controller.ts:22`).
- **Изоляция**: все запросы фильтруются по `userId`. Update/Delete/чтение чужого id → `NotFoundException`. Без модели `Account` — изоляция полностью на `userId`.
- **Валидация**: глобальный `ValidationPipe` (`main.ts`), DTO — `class-validator`.
- **Метод обновления**: `PATCH` (по тексту промпта), `UpdateTransactionDto` со всеми опциональными полями.
- **GET /transactions с агрегацией**: `?month=&year=` → `{ transactions: [...], summary: { totalIncome, totalExpense, balance, count } }`. Без параметров — все транзакции пользователя + сводка по ним. Агрегация в SQL через `prisma.transaction.groupBy({ by: ['type'], _sum: { amount: true } })` одним запросом.
- **`amount`**: `Decimal @db.Decimal(12,2)` — стандарт для денег. В JSON-ответе Prisma.Decimal сериализуется в строку — DTO принимает это явно (`amount: string`).
- **`type`**: Prisma `enum TransactionType { INCOME EXPENSE }`, в DTO — `@IsEnum(TransactionType)`.
- **`description`**: опционально (промпт не уточняет, разумный дефолт).
- **`onDelete` на связи с Category**: `Restrict` — нельзя удалить категорию, если на неё есть транзакции (защищает историю). `User → Transaction` остаётся `Cascade`.

## Модель данных (Prisma)

В `backend/prisma/schema.prisma` добавить:

```prisma
enum TransactionType {
  INCOME
  EXPENSE
}

model Transaction {
  id          String          @id @default(uuid())
  amount      Decimal         @db.Decimal(12, 2)
  type        TransactionType
  description String?
  date        DateTime
  categoryId  String
  category    Category        @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  userId      String
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([userId, date])
  @@index([categoryId])
}
```

И обратные связи в существующих моделях:
- `model User` → добавить `transactions Transaction[]`
- `model Category` → добавить `transactions Transaction[]`

## Структура папок

```
backend/src/modules/transactions/
├── transactions.controller.ts
├── transactions.service.ts          # фасад, делегирует в CommandBus/QueryBus
├── transactions.module.ts
├── dto/
│   ├── create-transaction.dto.ts
│   ├── update-transaction.dto.ts
│   ├── list-transactions-query.dto.ts   # ?month=&year=
│   ├── transaction.dto.ts               # response + fromEntity()
│   ├── transaction-summary.dto.ts       # { totalIncome, totalExpense, balance, count }
│   └── list-transactions.dto.ts         # response wrapper { transactions, summary }
├── commands/
│   ├── create-transaction.command.ts + handler
│   ├── update-transaction.command.ts + handler
│   └── delete-transaction.command.ts + handler
├── queries/
│   ├── get-transactions-by-user.query.ts + handler
│   └── get-transaction-by-id-for-user.query.ts + handler
└── repositories/
    └── transaction.repository.ts
```

## DTO и валидация

`CreateTransactionDto`:
- `amount`: `@IsString() @Matches(/^\d+(\.\d{1,2})?$/)` (десятичная строка, до 2 знаков) — Prisma примет string и сохранит как Decimal
- `type`: `@IsEnum(TransactionType)`
- `description?`: `@IsOptional() @IsString() @MaxLength(500)`
- `date`: `@IsDateString()` (ISO-8601)
- `categoryId`: `@IsUUID()`

`UpdateTransactionDto`: те же поля, все с `@IsOptional()` (PATCH).

`ListTransactionsQueryDto`:
- `month?`: `@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12)`
- `year?`: `@IsOptional() @Type(() => Number) @IsInt() @Min(1970) @Max(2100)`
- Бизнес-правило: оба параметра вместе или оба отсутствуют — проверяется в handler-е, при нарушении `BadRequestException`.

`TransactionDto.fromEntity()` — статический маппер. Поле `amount` сериализуем строкой: `dto.amount = entity.amount.toString()` (у `Prisma.Decimal` есть `toString()`).

`TransactionSummaryDto`: `totalIncome: string`, `totalExpense: string`, `balance: string`, `count: number`.

`ListTransactionsDto`: `{ transactions: TransactionDto[]; summary: TransactionSummaryDto }`.

## Эндпоинты

Все защищены `AuthGuard('jwt')`, базовый префикс `/api/transactions`:

- `GET    /api/transactions[?month=&year=]`  → `{ transactions, summary }`
- `POST   /api/transactions`                 → создать
- `GET    /api/transactions/:id`             → одна транзакция (404 если чужая)
- `PATCH  /api/transactions/:id`             → частично обновить
- `DELETE /api/transactions/:id`             → удалить (204)

## Взаимодействие с Categories через CQRS

`CreateTransactionHandler` и `UpdateTransactionHandler` инжектят `QueryBus`. Перед записью/обновлением, если задан `categoryId`, выполняют `queryBus.execute(new GetCategoryByIdForUserQuery(categoryId, userId))`. При `null` → `NotFoundException('Category not found')`. Импорт из `../../categories/queries/get-category-by-id-for-user.query`.

`TransactionsModule` импортирует `CqrsModule` и `CategoriesModule` (чтобы handler `GetCategoryByIdForUserQuery` был зарегистрирован — handler-ы CQRS в Nest регистрируются глобально, но импорт даёт явность зависимости и гарантирует порядок).

## Критические файлы

- `backend/prisma/schema.prisma` — добавить `enum TransactionType`, модель `Transaction`, обратные связи в `User` и `Category`
- `backend/src/modules/transactions/*` — реализовать всё содержимое
- `backend/src/modules/categories/queries/get-category-by-id-for-user.query.ts` — переиспользовать для валидации владения категорией
- `backend/src/modules/categories/categories.controller.ts` — образец JWT-контроллера
- `backend/src/modules/categories/repositories/category.repository.ts` — образец Repository
- `backend/src/modules/categories/categories.module.ts` — образец регистрации CQRS handler-ов

## Известные подводные камни (на чём здесь спотыкается Sonnet)

Зафиксировано по факту существующей реализации — после написания кода `pnpm typecheck` и `pnpm lint` зелёные, но в IDE и в виде кода есть систематические грабли. Эти правила обязательны для всех следующих итераций:

### А. Prisma 7 + pnpm: «фантомные» ошибки в IDE

Сгенерированный клиент лежит в `node_modules/.pnpm/@prisma+client@7.8.0_…/node_modules/.prisma/client/` — это специфика Prisma 7 в pnpm-workspace. После `pnpm --filter backend prisma:generate` (и после `prisma migrate dev`, который вызывает generate автоматически) **IDE TS Server часто не подхватывает новый location** и показывает фейковые ошибки вроде `Module '"@prisma/client"' has no exported member 'Transaction'` или `Property 'transaction' does not exist on type 'PrismaService'`.

- **Источник истины — `pnpm --filter backend typecheck`**, а не подсветка в IDE.
- Если CLI typecheck зелёный, а IDE красный → `Cmd+Shift+P → TypeScript: Restart TS Server`. **Не править код под фейковую ошибку.**

### Б. Никаких костылей-кастов вокруг `Transaction.amount`

Сгенерированный тип `Transaction` (в `.prisma/client/index.d.ts:30,3682`) уже имеет `amount: Prisma.Decimal`. **Запрещены** конструкции вида:

```ts
// ❌ ЛИШНЕЕ — каст ничего не уточняет, тип уже правильный
TransactionDto.fromEntity(transaction as Transaction & { amount: Prisma.Decimal })

// ❌ ЛИШНЕЕ — двойной каст для groupBy, сигнатура и так корректна
return this.prisma.transaction.groupBy({ ... }) as unknown as Promise<...>
```

Правильно:

```ts
// ✅ Тип Transaction уже содержит amount: Prisma.Decimal
static fromEntity(entity: Transaction): TransactionDto {
  dto.amount = entity.amount.toString()
  ...
}

// ✅ groupBy сам возвращает Promise<Array<{ type, _sum: { amount: Decimal | null } }>>
sumByTypeForUser(userId: string, dateFrom?: Date, dateTo?: Date) {
  return this.prisma.transaction.groupBy({
    by: ['type'],
    where: { userId, ...(dateFrom && dateTo ? { date: { gte: dateFrom, lte: dateTo } } : {}) },
    _sum: { amount: true },
  })
}
```

Если Prisma выдала «странный» тип — сначала смотреть параметры запроса, не кастовать «через unknown».

### В. `import type` vs `import` — единое правило для проекта

В `eslint.config.mjs` явно отключено `consistent-type-imports` с комментарием: NestJS DI требует value-импортов для провайдеров.

| Что | Импорт | Почему |
|---|---|---|
| Provider-классы для DI (`TransactionsService`, `TransactionRepository`, любой handler в `providers: [...]`) | `import { X }` | NestJS читает метаданные конструктора через `emitDecoratorMetadata` — type-only импорт стирается → DI ломается |
| DTO-классы, которые попадают в `@Body()`, `@Query()`, `@Param()` | `import { X }` | `ValidationPipe` нужен runtime-класс, чтобы вызвать `plainToInstance` |
| Enum, который используется в `@IsEnum(TransactionType)` | `import { TransactionType }` (БЕЗ type) | `@IsEnum` — runtime-декоратор |
| `Prisma` namespace, если используется `new Prisma.Decimal(...)` или `Prisma.PrismaClientKnownRequestError` | `import { Prisma }` | runtime-значение |
| Чистые типы из `@prisma/client`: `Transaction`, `Category`, `User`, `TransactionType` как тип возврата | `import type { ... }` | type-only, не попадают в runtime — корректно |
| `ICommandHandler`, `IQueryHandler`, `Request` из express, `OnModuleInit` | `import type { ... }` | interface-only |

Допускается комбо в одной строке: `import { Prisma } from '@prisma/client'` + `import type { Transaction } from '@prisma/client'` — это нормально и применяется уже в `get-transactions-by-user.handler.ts:4-5`.

### Г. `description` — `string | null` vs `string | undefined`

- Prisma-тип: `description: string | null` (поле `String?`).
- DTO принимает: `description?: string` (`string | undefined`).
- В `repository.create({ description })` и `update({ description })` Prisma 7 принимает `string | null | undefined`: `undefined` → не записывает, `null` → пишет NULL. В нашем DTO `null` не приходит, так что `description?: string` в типах репозитория достаточно.
- В `TransactionDto` поле — `description!: string | null`, маппим напрямую `dto.description = entity.description` (без `?? null` и прочего).

### Д. `prisma.transaction.update({ where: { id, userId } })`

Работает в Prisma 7 «из коробки» (extended where unique стал GA). Никаких `previewFeatures` в `schema.prisma` добавлять не нужно. Если когда-нибудь сломается — fallback: `findFirst` для проверки владения + `update({ where: { id } })`.

### Е. Глобальный префикс `/api`

`app.setGlobalPrefix('api')` в `main.ts` уже добавляет префикс. В контроллере: `@Controller('transactions')` → реальный путь `/api/transactions`. Не дублировать `api/` в декораторе.

## Чек-лист задач (актуальное состояние, 2026-05-17)

Базовая реализация уже выполнена; остаётся **чистка костылей**, чтобы код выдерживал планку проекта.

- [x] Добавить `enum TransactionType`, модель `Transaction` и обратные связи в `User`/`Category` в `schema.prisma`
- [x] Сгенерировать миграцию: `pnpm --filter backend prisma migrate dev --name add_transaction` (`20260517084141_add_transaction`)
- [x] `pnpm --filter backend prisma:generate`
- [x] Создать `TransactionRepository` (методы: `create`, `findAllByUser(userId, dateFrom?, dateTo?)`, `sumByTypeForUser(userId, dateFrom?, dateTo?)`, `findByIdForUser`, `update`, `delete`)
- [x] DTO: `CreateTransactionDto`, `UpdateTransactionDto`, `ListTransactionsQueryDto`, `TransactionDto` + `fromEntity`, `TransactionSummaryDto`, `ListTransactionsDto`
- [x] Commands + Handlers: `CreateTransactionHandler` (через `QueryBus` → `GetCategoryByIdForUserQuery`), `UpdateTransactionHandler`, `DeleteTransactionHandler`
- [x] Queries + Handlers: `GetTransactionsByUserHandler` (правило «оба или ни одного» month/year), `GetTransactionByIdForUserHandler`
- [x] `TransactionsService` — тонкий фасад
- [x] `TransactionsController` — JWT guard, `@Patch(':id')`, `userId` из `req.user`
- [x] `TransactionsModule` — импорты `CqrsModule`, `CategoriesModule`; все провайдеры зарегистрированы
- [x] `pnpm --filter backend typecheck` зелёный
- [x] `pnpm --filter backend lint` зелёный
- [ ] **Cleanup**: убрать `as Transaction & { amount: Prisma.Decimal }` в `transactions.controller.ts:46,54,65` и в `dto/transaction.dto.ts:14` (изменить сигнатуру `fromEntity(entity: Transaction)`)
- [ ] **Cleanup**: убрать `as unknown as Promise<...>` в `repositories/transaction.repository.ts:42` — вернуть значение `groupBy` напрямую, тип возврата метода вывести/упростить
- [ ] **Cleanup**: убрать ненужный `as Transaction & { amount: Prisma.Decimal }` в `queries/handlers/get-transactions-by-user.handler.ts:48`
- [ ] **Cleanup**: после правок убрать неиспользуемые `import type { Prisma }` / `import type { Transaction }`, где они остались только ради каста
- [ ] После cleanup: `pnpm --filter backend typecheck` и `lint` должны остаться зелёными

## Верификация

1. `docker compose up -d` и `pnpm --filter backend prisma:migrate` — миграция применилась
2. `pnpm dev:api` запускается без ошибок (бэк пользователь поднимает сам)
3. Через curl/Postman:
   - Логин → access token
   - `POST /api/categories` → создать категорию, получить `categoryId`
   - `POST /api/transactions` `{ amount: "150.50", type: "EXPENSE", date: "2026-05-17T00:00:00Z", categoryId, description: "coffee" }` → 201 + DTO
   - `POST /api/transactions` без токена → 401
   - `POST /api/transactions` с невалидным `type` (например `"FOO"`) → 400
   - `POST /api/transactions` с чужим `categoryId` → 404
   - `GET /api/transactions?month=5&year=2026` → `{ transactions: [...], summary: { totalIncome: "0.00", totalExpense: "150.50", balance: "-150.50", count: 1 } }`
   - `GET /api/transactions?month=5` (без year) → 400
   - `GET /api/transactions/:id` своя → 200, чужая → 404
   - `PATCH /api/transactions/:id` `{ amount: "200.00" }` своя → 200, чужая → 404
   - `DELETE /api/transactions/:id` своя → 204, чужая → 404
4. Создать вторую учётку и убедиться, что списки и summary изолированы
