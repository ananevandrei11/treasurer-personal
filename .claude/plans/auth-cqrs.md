# Авторизация (Auth + Users) через CQRS

## Context

Сейчас в `backend/` каркас NestJS 11: контроллеры/сервисы существуют, но все методы выбрасывают `Not implemented`, в `prisma/schema.prisma` нет моделей, а `@nestjs/cqrs` не установлен. Цель — реализовать регистрацию и логин с JWT (access 15m + refresh 7d), при этом `AuthModule` и `UsersModule` не должны напрямую импортировать сервисы друг друга: всё взаимодействие пойдёт через `CommandBus` / `QueryBus` (`@nestjs/cqrs`).

Решено:
- хранить хэш refresh-токена в таблице User (ротация при каждом refresh, очистка при logout);
- `Users` экспортирует Commands/Queries, `Auth` их диспатчит.

---

## 1. Зависимости ✅

В `backend/package.json` добавить:
- `@nestjs/cqrs@^11` ✅ (установлен)
- `@types/bcrypt` (dev) — уже был установлен ✅

После установки: `pnpm install` ✅

---

## 2. Prisma: модель User ✅

`backend/prisma/schema.prisma` — заменить плейсхолдер на:

```prisma
model User {
  id               String   @id @default(uuid())
  email            String   @unique
  name             String
  passwordHash     String
  refreshTokenHash String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

Затем: `pnpm --filter backend prisma:migrate` (название миграции `init_user`) и `pnpm --filter backend prisma:generate`.

---

## 3. Модуль Users (владелец данных пользователя) ✅

Структура:
```
backend/src/modules/users/
├── users.module.ts
├── users.service.ts
├── users.controller.ts             (GET /api/users/me — оставить заглушкой, реализуем минимально)
├── repositories/
│   └── user.repository.ts
├── commands/
│   ├── create-user.command.ts
│   └── handlers/create-user.handler.ts
├── queries/
│   ├── get-user-by-email.query.ts
│   ├── get-user-by-id.query.ts
│   └── handlers/
│       ├── get-user-by-email.handler.ts
│       └── get-user-by-id.handler.ts
└── dto/
    └── user.dto.ts                 (публичный shape без хэшей)
```

### `UserRepository`
Тонкий слой над `PrismaService` (`backend/src/prisma/prisma.service.ts`, уже глобальный):
- `findByEmail(email): Promise<User | null>`
- `findById(id): Promise<User | null>`
- `create(data: { email; name; passwordHash }): Promise<User>`
- `updateRefreshTokenHash(id, hash: string | null): Promise<void>`

### `UsersService`
Содержит бизнес-логику (хэширование пароля через `bcrypt`, обновление refresh-хэша) и вызывает репозиторий. Используется хендлерами, **не** экспортируется наружу модуля.

### Commands / Queries (контракт между модулями)
- `CreateUserCommand { email; name; password }` → возвращает `User` (без хэшей).
- `UpdateRefreshTokenHashCommand { userId; refreshToken: string | null }` → хэширует и пишет.
- `GetUserByEmailQuery { email }` → `User | null` (с `passwordHash` и `refreshTokenHash`, потому что нужно `Auth` для проверки).
- `GetUserByIdQuery { userId }` → `User | null`.

Уточнение: команды/запросы и их типы возврата лежат в `users/commands` и `users/queries` — `Auth` будет импортировать только эти классы-маркеры, не `UsersService`.

### `UsersModule`
```ts
@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    CreateUserHandler,
    UpdateRefreshTokenHashHandler,
    GetUserByEmailHandler,
    GetUserByIdHandler,
  ],
  // exports НЕ нужны — общение только через шину
})
export class UsersModule {}
```

`UsersController.getMe` реализуем минимально: достаёт `userId` из `req.user`, диспатчит `GetUserByIdQuery`, возвращает `UserDto`. Защита — `@UseGuards(AuthGuard('jwt'))`.

---

## 4. Модуль Auth ✅

Структура:
```
backend/src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   ├── register.dto.ts             (email, name, password — class-validator)
│   ├── login.dto.ts                (email, password)
│   └── refresh.dto.ts              (refreshToken)
└── strategies/
    ├── jwt.strategy.ts             (типизировать payload, возвращать { userId, email })
    └── jwt-refresh.strategy.ts     (passReqToCallback: true — нужен сам токен для сверки)
```

### DTO (class-validator)
- `RegisterDto`: `@IsEmail email`, `@IsString @MinLength(2) name`, `@IsString @MinLength(8) password`.
- `LoginDto`: `@IsEmail email`, `@IsString password`.
- `RefreshDto`: `@IsString refreshToken`.

### `AuthService` — ключевая логика
В конструкторе только `CommandBus`, `QueryBus`, `JwtService`, `ConfigService`. **Без `UsersService`.**

- `register(dto)`:
  1. `queryBus.execute(new GetUserByEmailQuery(dto.email))` → если найден, `ConflictException`.
  2. `commandBus.execute(new CreateUserCommand(...))` → получаем `User`.
  3. Выпустить пару токенов (`issueTokens(user)`), сохранить refresh-хэш через `UpdateRefreshTokenHashCommand`.
  4. Вернуть `{ user: UserDto, accessToken, refreshToken }`.

- `login(dto)`:
  1. `GetUserByEmailQuery` → если нет или `bcrypt.compare` неудачно — `UnauthorizedException`.
  2. Выпустить токены, обновить `refreshTokenHash`.
  3. Вернуть тот же shape.

- `refresh(dto)` (или `refresh(userId, token)` из guard):
  1. `GetUserByIdQuery` → если нет refresh-хэша или `bcrypt.compare(token, hash)` неудачно — `UnauthorizedException`.
  2. Выпустить новую пару, ротация `refreshTokenHash`.

- `logout(userId)`:
  1. `UpdateRefreshTokenHashCommand(userId, null)`.

- `issueTokens(user)` — приватный helper:
  - access: `jwtService.signAsync({ sub: user.id, email: user.email }, { secret: JWT_ACCESS_SECRET, expiresIn: Number(JWT_ACCESS_TTL) })`.
  - refresh: тот же payload, `JWT_REFRESH_SECRET`, `JWT_REFRESH_TTL`.

### `AuthController`
- `POST /api/auth/register` — `@Body() RegisterDto`.
- `POST /api/auth/login` — `@Body() LoginDto`, `@HttpCode(200)`.
- `POST /api/auth/refresh` — `@UseGuards(AuthGuard('jwt-refresh'))`, читает `req.user` и raw token.
- `POST /api/auth/logout` — `@UseGuards(AuthGuard('jwt'))`, `@HttpCode(204)`.

### `AuthModule`
```ts
@Module({
  imports: [
    CqrsModule,
    PassportModule,
    JwtModule.register({}),
    // НЕ импортируем UsersModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
```

> Важно: чтобы шина CQRS работала, оба модуля должны импортировать `CqrsModule`, а корневой `AppModule` — оставаться без изменений (`UsersModule` и `AuthModule` уже там).

---

## 5. Strategy: типизация и refresh ✅

`jwt.strategy.ts`: `validate(payload: { sub: string; email: string })` → возвращает `{ userId: payload.sub, email: payload.email }`.

`jwt-refresh.strategy.ts`: `super({ ..., passReqToCallback: true })`, `validate(req, payload)` → достать токен из `Authorization` header, вернуть `{ userId: payload.sub, refreshToken }`.

---

## 6. Критические файлы

| Файл | Действие |
|---|---|
| `backend/package.json` | + `@nestjs/cqrs`, `@types/bcrypt` |
| `backend/prisma/schema.prisma` | + модель `User` |
| `backend/src/modules/users/**` | новые: repo, service, commands, queries, handlers, dto |
| `backend/src/modules/users/users.module.ts` | переписать (CqrsModule + хендлеры) |
| `backend/src/modules/users/users.controller.ts` | реализовать `getMe` через `QueryBus` |
| `backend/src/modules/auth/auth.service.ts` | реализация через `CommandBus`/`QueryBus` |
| `backend/src/modules/auth/auth.controller.ts` | подключить DTO и guard'ы |
| `backend/src/modules/auth/auth.module.ts` | + `CqrsModule`, убрать `UsersModule` |
| `backend/src/modules/auth/strategies/*.ts` | типизировать payload, refresh с `passReqToCallback` |
| `backend/src/modules/auth/dto/*.ts` | новые DTO с class-validator |

Не меняем: `PrismaModule`, `main.ts`, `app.module.ts`, остальные модули (accounts/categories/transactions).

---

## 7. Verification ✅

1. `docker compose up -d` — поднять Postgres.
2. `pnpm install` — поставить новые зависимости.
3. `pnpm --filter backend prisma:migrate` — применить миграцию `init_user`.
4. `pnpm --filter backend typecheck && pnpm --filter backend lint`.
5. `pnpm dev:api`, затем вручную через `curl`:
   - `POST /api/auth/register` — 201, в ответе `accessToken`, `refreshToken`, `user`.
   - Повтор того же email → 409.
   - `POST /api/auth/login` с правильным паролем → 200 + новая пара токенов.
   - С неправильным паролем → 401.
   - `GET /api/users/me` с `Authorization: Bearer <access>` → 200 + профиль.
   - Без токена → 401.
   - `POST /api/auth/refresh` с валидным refresh → новая пара, старый refresh после ротации не работает.
   - `POST /api/auth/logout` → 204, после этого refresh → 401.
6. В `prisma:studio` проверить, что `passwordHash` и `refreshTokenHash` — не plain text.
