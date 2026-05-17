# REVIEW.md

Правила code review для проекта Treasurer (NestJS 11 + Next.js 16, pnpm monorepo).

Базовые источники истины: [`CLAUDE.md`](CLAUDE.md), [`backend/CLAUDE.md`](backend/CLAUDE.md), [`frontend/CLAUDE.md`](frontend/CLAUDE.md). Любое противоречие с ними — повод для блокирующего комментария.

---

## 0. Перед началом ревью

- Убедиться, что ветка названа по схеме `<type>/<short-description>` (`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `test/`, `style/`, `perf/`).
- Все коммиты — в формате Conventional Commits (`<type>(<scope>): <description>`, императив, lowercase, без точки в конце).
- Локально прогнаны: `pnpm --filter frontend lint`, `pnpm --filter backend lint`, `pnpm typecheck`.
- Фича вручную проверена в браузере (для UI-изменений) — об этом должно быть сказано в описании PR.
- Нет коммитов в `main` напрямую; PR мерджится `--no-ff`.

---

## 1. Общие правила (оба пакета)

### Severity
- **blocker** — должно быть исправлено до мерджа.
- **major** — исправить в этом же PR, если объём позволяет.
- **nit** — пожелание, можно оставить на потом.

### Что блокирует мердж
- Падает `lint` или `typecheck`.
- В коде остались `console.log`, `debugger`, закомментированный код, TODO без issue/контекста.
- Секреты, токены, реальные email/пароли в коде, фикстурах, тестах.
- UI-строки не на английском (нарушает «English-only» правило корневого `CLAUDE.md`).
- Любые `any` без явного обоснования в комментарии рядом.
- Добавлена i18n-библиотека (запрещено корневым `CLAUDE.md`) // временное ограничение.
- Изменён `pnpm-lock.yaml` вручную или без соответствующего изменения `package.json`.
- Понижены/удалены security-механизмы (helmet, CORS, throttler, httpOnly cookies, JWT-валидация) без явной задачи.

### Стиль кода
- Без лишних комментариев — оставляем только те, что объясняют **почему**, а не **что**.
- Без преждевременных абстракций: 3 похожих строки лучше преждевременного хелпера.
- Без error-handling «на всякий случай» — валидация только на границах системы (вход контроллера, парсинг env, парсинг `FormData`).
- Нет backwards-compat «костылей» (`_unused`, реэкспорты «на будущее», `// removed` комментарии) — мёртвый код удаляется.

### Зависимости
- Новая зависимость = отдельный комментарий в PR с обоснованием (зачем, есть ли альтернатива из уже установленного).
- Не добавлять `swr`, `@tanstack/react-query`, `redux`, `zustand` и т.п. — фронт намеренно без client-data layer // Временное ограничение.

---

## 2. Backend (NestJS) — чек-лист

### Архитектура CQRS
- Контроллер → Service → `CommandBus`/`QueryBus` → Handler → Repository. **Никаких прямых вызовов `PrismaService` из service/handler** — только через репозиторий аггрегата.
- Write-операции — `commands/` + `@CommandHandler`. Read-операции — `queries/` + `@QueryHandler`. Не смешивать.
- Один репозиторий — один агрегат. Cross-aggregate чтения собираются в Query-handler через несколько репозиториев.

### Модули
- Структура нового модуля повторяет существующие (`auth`, `transactions`, `categories`): `controller / service / module / dto / commands / queries / repositories`.
- DTO лежат в `dto/`, валидируются `class-validator`. Не использовать «голые» интерфейсы для входа контроллера.
- Response DTO отдельно от request DTO; не возвращать наружу Prisma-модели напрямую, если они содержат `passwordHash`/`refreshTokenHash` и т.п.

### Валидация и безопасность
- Все входящие DTO покрыты `class-validator`-декораторами (включая `@IsOptional`, `@Type` для чисел/дат).
- `ValidationPipe` глобальный — не отключать `whitelist`/`forbidNonWhitelisted`/`transform` локально.
- Эндпоинты аутентификации/чувствительные операции имеют `@Throttle()` (см. лимиты в `backend/CLAUDE.md`).
- Защищённые маршруты — под `AuthGuard('jwt')`; `/auth/refresh` — под `AuthGuard('jwt-refresh')`.
- Любой эндпоинт, работающий с пользовательскими данными, **фильтрует по `req.user.userId`** в репозитории. Не доверять `userId` из тела/параметров запроса.
- Никаких `process.env.X` напрямую — только через зод-схему в `src/config/env.validation.ts`. Новая env-переменная добавляется в схему и в `.env.example` (если есть).

### Prisma
- Денежные суммы — `Prisma.Decimal` (`Decimal(12,2)`). **Запрещено** `Number(amount)` в коде, который касается итогов/арифметики.
- Удаление `Category` — restrict; в репозитории/handler обрабатывается ошибка ссылки и маппится в осмысленный HTTP-статус.
- Новые модели/поля → миграция в `prisma/migrations/`, в PR приложен файл миграции. Никаких `prisma db push` без миграции.
- Индексы для новых частых запросов (`@@index([...])`) — обязательны.
- Каскады (`onDelete`) проставлены сознательно: `User → Category/Transaction` cascade, `Category → Transaction` restrict.

### Auth-специфика
- Пароли и refresh-токены — только `bcrypt`-хеш. Никаких сравнений plain-строк.
- Refresh-токен ротируется при каждом `/auth/refresh` (новый хеш в `User.refreshTokenHash`).
- TTL и секреты читаются из env через зод-схему (`JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`). Хардкод запрещён.

---

## 3. Frontend (Next.js) — чек-лист

### FSD-слои и импорты
- Импорты только сверху вниз: `app → views → widgets → features → shared`. Никаких импортов «вбок» в одном слое.
- Используется `views/`, **не** `pages/`. Слой `entities/` **не вводится** — DTO лежат в `shared/api/<domain>.ts`.
- Каждая фича/вью/виджет имеет `index.ts` (public API). Импорт извне — только из корня слайса.
- Импорты из `shared/*` — только через barrel (`@/shared/ui`, `@/shared/api`, `@/shared/lib`, `@/shared/config`). Глубокие пути запрещены.
  - Единственное исключение: файлы внутри `shared/ui/*.tsx` берут `cn` напрямую из `@/shared/lib/class-names`.
- Файлы именуются по домену: `login.ts`, `create-transaction.ts`. Никаких `types.ts`, `utils.ts`, `schema.ts`, `helpers.ts`.

### RSC vs Client
- По умолчанию — Server Components. `'use client'` появляется только в `features/*/ui/*.tsx` и других интерактивных листьях (только там где без `'use client'` нельзя).
- Server Actions (`features/*/api/*-action.ts`, `shared/lib/session.ts`) начинаются с `'use server'` первой строкой.
- В `'use client'` файлах **запрещён** импорт `getAccessToken()`, чтения cookies, прямых вызовов backend.
- Layouts под `(app)/` остаются async RSC, делают `getAccessToken()` → `/users/me` → `redirect('/login')` при ошибке. Middleware-защиту не вводим.

### Формы — канонический паттерн
- Любая новая форма копирует структуру `features/auth/login` или `features/auth/register`:
  1. `model/<action>.ts` — zod-схема + inferred type.
  2. `api/<action>-action.ts` — `'use server'`, парсит `FormData` через `safeParse`, возвращает `{ fieldErrors, formError }`.
  3. `ui/<Form>.tsx` — `'use client'`, `useActionState` + `useFormStatus`, dirty-field паттерн для очистки ошибок.
- Маппинг `ApiError.status → formError` — в Server Action, не в UI.
- На успехе — `setSession` / `revalidate*` / `redirect`. Никаких client-side fetch и ручных переходов через `router.push` после мутации.

### HTTP / Backend-вызовы
- Все запросы — через `backendFetch<T>` из `@/shared/api`. Никаких голых `fetch(API_URL + ...)`.
- Защищённые запросы передают `Authorization: Bearer ${token}` явно, токен получают через `getAccessToken()` (только из RSC/Server Action).
- Ошибки backend ловятся как `ApiError` (есть `status`, нормализованный `message`).
- `process.env.NEXT_PUBLIC_*` читается **только** в `@/shared/config`. В фичах/вью/виджетах — никаких `process.env`.

### UI / shadcn
- shadcn-компоненты лежат в `src/shared/ui/` и реэкспортируются из `src/shared/ui/index.ts`. Новый компонент → не забыть добавить в barrel.
- Установка нового: `pnpm dlx shadcn@latest add <name>`. Ручное копирование шаблонов — нет.
- Style `base-nova`, base color `neutral`, иконки `lucide-react`. Не смешивать иконочные библиотеки.
- `cn()` — из `@/shared/lib` (или `@/shared/lib/class-names` внутри `shared/ui/*`).
- Tailwind 4: utility-классы предпочтительнее inline-стилей; `data-*` атрибуты для состояний (`data-invalid`, `data-pending`) вместо условных классов.

### Auth
- Токены — только httpOnly cookies через `setSession`/`clearSession` из `shared/lib/session.ts`. Запрещено `localStorage`/`sessionStorage`/document.cookie на клиенте.
- В production cookies — `secure: true`, `sameSite: 'strict'`.

---

## 4. Тесты

- Тесты не блокирующие (на стадии scaffold их минимум), но если код тестируется — тесты должны проходить локально.
- Не мокать Prisma в интеграционных тестах — поднимать БД через `docker compose up -d`.
- Фикстуры не содержат боевых email/паролей.

---

## 5. Документация

- Изменение публичного контракта (новый эндпоинт, новый формат cookie, новый env) → обновить соответствующий `CLAUDE.md` (root / backend / frontend).
- README не обязателен к обновлению на каждый PR, но не должен противоречить новому поведению.
- Не плодить `*.md` файлы без явного запроса.

---

## 6. Формат комментариев ревью

- Префикс severity: `[blocker]`, `[major]`, `[nit]`.
- Ссылка на файл и строку: `frontend/src/features/.../ui/Form.tsx:42`.
- Если правило закреплено в `CLAUDE.md` — сослаться на конкретный раздел.
- Альтернатива всегда лучше запрета: предлагать конкретную замену, а не «так не делай».
