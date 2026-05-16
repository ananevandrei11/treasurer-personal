# План: модуль Categories

## Context

В проекте уже реализована аутентификация (JWT access/refresh) и модуль `users` на CQRS. Текущий модуль `categories` — скелет: контроллер с CRUD-эндпоинтами без валидации, пустой сервис, нет модели в Prisma. Нужно довести его до рабочего состояния, следуя сложившимся паттернам кодовой базы (CQRS + Repository, как в `users`), и обеспечить взаимодействие с `users`-модулем через QueryBus (а не прямой доступ к таблице User).

Итог: пользователь, авторизованный по JWT, может создавать/получать/обновлять/удалять собственные категории трат. Чужие категории недоступны.

## Архитектурные решения

- **CQRS в Categories**: Commands (`Create`, `Update`, `Delete`) и Queries (`GetAllByUser`, `GetByIdForUser`) с отдельными handler-ами, как в `users`.
- **Repository**: `CategoryRepository` инкапсулирует Prisma-доступ (паттерн из `backend/src/modules/users/repositories/user.repository.ts`).
- **Связь с User-модулем через CQRS**: в `CreateCategoryHandler` валидируем существование пользователя через `GetUserByIdQuery` из `users/queries/` (не через Prisma напрямую). Это и есть требуемое "взаимодействие через CQRS".
- **Авторизация**: `@UseGuards(AuthGuard('jwt'))` на контроллере, `userId` берём из `req.user` (тип `JwtUser`, как в `users.controller.ts:18`).
- **Изоляция данных**: все запросы фильтруются по `userId`. Update/Delete по чужому id → `NotFoundException` (не раскрываем существование).
- **Валидация**: глобальный `ValidationPipe` уже настроен (`main.ts`), DTO — на `class-validator`.

## Модель данных (Prisma)

В `backend/prisma/schema.prisma` добавить:

```prisma
model Category {
  id        String   @id @default(uuid())
  name      String
  color     String   // HEX, например "#FF5733"
  icon      String   // имя иконки
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

В `User` добавить обратную связь: `categories Category[]`.

## Структура папок

```
backend/src/modules/categories/
├── categories.controller.ts
├── categories.service.ts          # фасад, делегирует в CommandBus/QueryBus
├── categories.module.ts
├── dto/
│   ├── create-category.dto.ts
│   ├── update-category.dto.ts
│   └── category.dto.ts            # response + fromEntity()
├── commands/
│   ├── create-category.command.ts + handler
│   ├── update-category.command.ts + handler
│   └── delete-category.command.ts + handler
├── queries/
│   ├── get-categories-by-user.query.ts + handler
│   └── get-category-by-id-for-user.query.ts + handler
└── repositories/
    └── category.repository.ts
```

## DTO и валидация

`CreateCategoryDto`:
- `name`: `@IsString() @MinLength(1) @MaxLength(50)`
- `color`: `@IsString() @Matches(/^#[0-9A-Fa-f]{6}$/)`
- `icon`: `@IsString() @MinLength(1) @MaxLength(50)`

`UpdateCategoryDto`: те же поля через `PartialType(CreateCategoryDto)` из `@nestjs/mapped-types` (или вручную с `@IsOptional()`).

`CategoryDto.fromEntity()` — статический маппер из Prisma-модели, как `UserDto.fromEntity`.

## Эндпоинты

Все защищены `AuthGuard('jwt')`, базовый префикс `/api/categories`:

- `GET    /api/categories`       → список категорий текущего пользователя
- `POST   /api/categories`       → создать
- `GET    /api/categories/:id`   → одна категория (404 если чужая)
- `PUT    /api/categories/:id`   → обновить
- `DELETE /api/categories/:id`   → удалить (204)

## Взаимодействие с Users через CQRS

`CreateCategoryHandler` инжектит `QueryBus`, перед записью выполняет `queryBus.execute(new GetUserByIdQuery(userId))`. При `null` → `NotFoundException('User not found')`. Импорт из `../../users/queries/get-user-by-id.query`.

`CategoriesModule` импортирует `CqrsModule` и `UsersModule` (чтобы хендлер `GetUserByIdQuery` был зарегистрирован).

## Критические файлы

- `backend/prisma/schema.prisma` — добавить модель `Category`
- `backend/src/modules/categories/*` — реализовать всё содержимое
- `backend/src/modules/users/queries/get-user-by-id.query.ts` — переиспользовать
- `backend/src/modules/users/repositories/user.repository.ts` — образец Repository
- `backend/src/modules/users/users.module.ts` — образец регистрации CQRS handler-ов

## Чек-лист задач

- [x] Добавить модель `Category` и обратную связь в `User` в `schema.prisma`
- [x] Сгенерировать миграцию: `pnpm --filter backend prisma migrate dev --name add_category`
- [x] `pnpm --filter backend prisma:generate`
- [x] Создать `CategoryRepository` (методы: `create`, `findAllByUser`, `findByIdForUser`, `update`, `delete`)
- [x] DTO: `CreateCategoryDto`, `UpdateCategoryDto`, `CategoryDto` + `fromEntity`
- [x] Commands + Handlers: `CreateCategoryHandler` (через `QueryBus` → `GetUserByIdQuery`), `UpdateCategoryHandler`, `DeleteCategoryHandler`
- [x] Queries + Handlers: `GetCategoriesByUserHandler`, `GetCategoryByIdForUserHandler`
- [x] `CategoriesService` — тонкий фасад, делегирует в `CommandBus`/`QueryBus`
- [x] `CategoriesController` — заменить `unknown` на DTO, добавить `@UseGuards(AuthGuard('jwt'))`, извлекать `userId` из `req.user`, вернуть `CategoryDto` через `fromEntity`
- [x] `CategoriesModule` — импорты `CqrsModule`, `UsersModule`; провайдеры: сервис, репозиторий, все handler-ы
- [x] Проверки ошибок: `NotFoundException` для чужого/несуществующего id
- [x] `pnpm typecheck` и `pnpm lint` — без ошибок

## Верификация

1. `docker compose up -d` и `pnpm --filter backend prisma:migrate` — миграция применилась ✅
2. `pnpm dev:api` запускается без ошибок ✅
3. Через curl/Postman:
   - Логин → получить access token ✅
   - `POST /api/categories` с валидным body → 201 + объект ✅
   - `POST /api/categories` без токена → 401 ✅
   - `POST /api/categories` с невалидным `color` → 400 ✅
   - `GET /api/categories` → массив только своих категорий ✅
   - `GET /api/categories/:id` чужой → 404 ✅
   - `PUT /api/categories/:id` свой → 200, чужой → 404 ✅
   - `DELETE /api/categories/:id` свой → 204 ✅
4. Создать второго пользователя и убедиться, что списки изолированы ✅
