# План: приведение `frontend/` к FSD v2.1

## Context

Установленный в проект скилл `feature-sliced-design` (`.claude/skills/feature-sliced-design/SKILL.md`, v2.1) задаёт каноничные правила FSD. Аудит `frontend/src` показал, что архитектура **в целом корректна** (направление импортов соблюдено, сегментация ui/api/model в features есть, public API на уровне слайсов присутствует), но обнаружены 5 точечных расхождений со скиллом:

1. **`entities/user` — premature entity** (Rule из `references/excessive-entities.md:187-189`). Содержит только `User` + `AuthResponse` для login-ответа, других consumer'ов и доменной логики нет. Скилл прямо запрещает создавать `entities/user` ради auth-DTO.
2. **Technical-role naming (Rule 4-4, `SKILL.md:164-179`)**. Файлы `types.ts`, `schema.ts`, `utils.ts` нужно переименовать в domain-based.
3. **Shared без сегмент-уровневых index.ts (Rule 4-2, `SKILL.md:137-157`).** Сейчас импорты `@/shared/api/http`, `@/shared/lib/utils`, `@/shared/ui/button` бьют по внутренним файлам — это bypass public API.
4. **Пустая папка `shared/hooks/`** — мёртвая директория, anti-pattern «зарезервировано на будущее».
5. **`views/` вместо `pages/`** — отступление от канона, но пользователь решил **оставить** (зафиксировано в CLAUDE.md, не меняем).

Цель: устранить пункты 1-4, привести проект в соответствие с FSD v2.1 без функциональных изменений. После правок `pnpm typecheck` и `pnpm lint` должны проходить, login/register-флоу — работать.

---

## Решения, согласованные с пользователем

| Развилка | Решение |
|---|---|
| `entities/user` | Расформировать в `shared/api/auth.ts`, директорию `entities/` удалить |
| Domain-based naming | Применить ко всем затронутым файлам |
| Сегмент-уровневые index.ts в shared | Создать для **всех** сегментов (`ui`, `api`, `lib`, `config`) |
| `views/` vs `pages/` | Оставить `views/` (отступление зафиксировано в CLAUDE.md) |

---

## План изменений

### 1. Расформировать `entities/user`

- **Создать** `frontend/src/shared/api/auth.ts`:
  ```ts
  export type User = {
    id: string
    email: string
    name: string
    createdAt: string
    updatedAt: string
  }

  export type AuthResponse = {
    user: User
    accessToken: string
    refreshToken: string
  }
  ```
- **Удалить** директорию `frontend/src/entities/user/` целиком.
- **Удалить** директорию `frontend/src/entities/` (становится пустой).

### 2. Переименовать файлы под Rule 4-4 (domain-based naming)

| Было | Стало |
|---|---|
| `frontend/src/features/auth/login/model/schema.ts` | `frontend/src/features/auth/login/model/login.ts` |
| `frontend/src/features/auth/register/model/schema.ts` | `frontend/src/features/auth/register/model/register.ts` |
| `frontend/src/shared/lib/utils.ts` | `frontend/src/shared/lib/class-names.ts` |

Содержимое файлов не меняется, только имя. Экспорты (`loginSchema`, `registerSchema`, `cn`) сохраняем — это symbol-уровень, к Rule 4-4 не относится.

### 3. Создать сегмент-уровневые `index.ts` в `shared/`

- **`frontend/src/shared/api/index.ts`**
  ```ts
  export { backendFetch, ApiError } from './http'
  export type { User, AuthResponse } from './auth'
  ```
- **`frontend/src/shared/lib/index.ts`**
  ```ts
  export { cn } from './class-names'
  export { setSession, clearSession, getAccessToken } from './session'
  ```
- **`frontend/src/shared/ui/index.ts`** — barrel для всех shadcn-компонентов (`alert`, `button`, `card`, `input`, `label`). Реэкспорт именованных экспортов из каждого файла.
- **`frontend/src/shared/config/index.ts`**
  ```ts
  export { API_URL } from './env'
  ```

**Нюанс**: внутри самого `shared/ui/*.tsx` импорты `cn` нужно оставить на прямом пути `@/shared/lib/class-names` (а не через barrel `@/shared/lib`) — иначе возникает потенциальная циклическая зависимость barrel↔файл внутри одного слоя при tree-shaking. По FSD сегменты shared могут импортить друг друга напрямую (`SKILL.md:139` — public API между сегментами shared не обязателен).

### 4. Обновить импорты в consumer-файлах

Полный список затронутых файлов и замен (grep подтвердил):

| Файл | Было | Стало |
|---|---|---|
| `frontend/src/app/layout.tsx:4` | `@/shared/lib/utils` | `@/shared/lib` |
| `frontend/src/features/auth/login/api/login-action.ts:4` | `@/shared/api/http` | `@/shared/api` |
| `frontend/src/features/auth/login/api/login-action.ts:5` | `@/shared/lib/session` | `@/shared/lib` |
| `frontend/src/features/auth/login/api/login-action.ts:6` | `../model/schema` | `../model/login` |
| `frontend/src/features/auth/login/api/login-action.ts:7` | `@/entities/user` | `@/shared/api` |
| `frontend/src/features/auth/register/api/register-action.ts:4` | `@/shared/api/http` | `@/shared/api` |
| `frontend/src/features/auth/register/api/register-action.ts:5` | `@/shared/lib/session` | `@/shared/lib` |
| `frontend/src/features/auth/register/api/register-action.ts:6` | `../model/schema` | `../model/register` |
| `frontend/src/features/auth/register/api/register-action.ts:7` | `@/entities/user` | `@/shared/api` |
| `frontend/src/shared/api/http.ts:1` | `@/shared/config/env` | `@/shared/config` |
| `frontend/src/shared/ui/{alert,button,card,input,label}.tsx` | `@/shared/lib/utils` | `@/shared/lib/class-names` (прямой путь, см. нюанс в п.3) |

### 5. Удалить мёртвую директорию `shared/hooks/`

`frontend/src/shared/hooks/` — пустая, удалить.

### 6. Обновить `frontend/components.json` (shadcn CLI)

Проверить ключ `aliases.utils` в `frontend/components.json` — если стоит `@/shared/lib/utils`, заменить на `@/shared/lib/class-names`, иначе будущие `npx shadcn add` будут создавать импорты на несуществующий файл.

### 7. Обновить `CLAUDE.md` проекта

В `/Users/andreiananev/Documents/WEBDEV/treasurer-personal/CLAUDE.md` секция FSD:
- Зафиксировать, что user/auth-DTO живут в `shared/api/`, а не в `entities/`.
- Зафиксировать правило сегмент-уровневых barrel'ов в `shared/`.
- Зафиксировать domain-based naming (без `types.ts`, `schema.ts`, `utils.ts`).

---

## Критические файлы

**Создаются:**
- `frontend/src/shared/api/auth.ts`
- `frontend/src/shared/api/index.ts`
- `frontend/src/shared/lib/index.ts`
- `frontend/src/shared/ui/index.ts`
- `frontend/src/shared/config/index.ts`

**Переименовываются:**
- `frontend/src/shared/lib/utils.ts` → `class-names.ts`
- `frontend/src/features/auth/login/model/schema.ts` → `login.ts`
- `frontend/src/features/auth/register/model/schema.ts` → `register.ts`

**Удаляются:**
- `frontend/src/entities/` (целиком — внутри только `user/`)
- `frontend/src/shared/hooks/` (пустая)

**Правятся импорты:**
- `frontend/src/app/layout.tsx`
- `frontend/src/features/auth/login/api/login-action.ts`
- `frontend/src/features/auth/register/api/register-action.ts`
- `frontend/src/shared/api/http.ts`
- `frontend/src/shared/ui/{alert,button,card,input,label}.tsx`
- `frontend/components.json` (если содержит `utils`-alias)
- `CLAUDE.md`

---

## Что НЕ трогаем

- Слой `views/` (название, структура, файлы) — пользователь явно решил сохранить.
- Структуру `features/auth/{login,register}` — корректный slice-group + slice паттерн FSD.
- `app/`-роутинг Next.js, `(auth)`-группу.
- Содержимое UI-компонентов (LoginForm, RegisterForm, LoginView, RegisterView, shadcn-обёртки).
- Бизнес-логику Server Actions и `session.ts`.

---

## Верификация (после реализации)

1. **Type-check**: `pnpm typecheck` — проходит без ошибок.
2. **Lint**: `pnpm --filter frontend lint` — без новых предупреждений.
3. **Build**: `pnpm build:web` — успешная сборка.
4. **Runtime**: `docker compose up -d && pnpm dev:api && pnpm dev:web`
   - Открыть `http://localhost:3000/login` — форма рендерится, валидация работает.
   - Открыть `http://localhost:3000/register` — форма рендерится.
   - Залогиниться валидными кредами — редирект на `/`, accessToken/refreshToken проставлены в cookies.
   - Невалидные креды — отображается ошибка "Неверный email или пароль".
5. **Grep-аудит** на остаточные нарушения:
   - `grep -rn "@/entities" frontend/src` → пусто.
   - `grep -rn "@/shared/lib/utils\|@/shared/api/http\|@/shared/config/env" frontend/src` → пусто.
   - `find frontend/src/shared -name "utils.ts" -o -name "types.ts" -o -name "schema.ts"` → пусто.

---

## Чек-лист реализации

- [x] 1. Создать `shared/api/auth.ts` с типами `User`, `AuthResponse`
- [x] 2. Переименовать `shared/lib/utils.ts` → `class-names.ts`
- [x] 3. Переименовать `features/auth/login/model/schema.ts` → `login.ts`
- [x] 4. Переименовать `features/auth/register/model/schema.ts` → `register.ts`
- [x] 5. Создать `shared/api/index.ts` (barrel: backendFetch, ApiError, User, AuthResponse)
- [x] 6. Создать `shared/lib/index.ts` (barrel: cn, setSession, clearSession, getAccessToken)
- [x] 7. Создать `shared/ui/index.ts` (barrel: alert/button/card/input/label)
- [x] 8. Создать `shared/config/index.ts` (barrel: API_URL)
- [x] 9. Обновить импорты в `app/layout.tsx`
- [x] 10. Обновить импорты в `features/auth/login/api/login-action.ts` (включая `@/entities/user` → `@/shared/api`)
- [x] 11. Обновить импорты в `features/auth/register/api/register-action.ts`
- [x] 12. Обновить импорт в `shared/api/http.ts` (`@/shared/config/env` → `@/shared/config`)
- [x] 13. Обновить импорты `cn` в `shared/ui/{alert,button,card,input,label}.tsx` на `@/shared/lib/class-names`
- [x] 14. Удалить `entities/user/`, `entities/`
- [x] 15. Удалить пустую `shared/hooks/`
- [x] 16. Проверить/обновить `frontend/components.json` (`aliases.utils`)
- [x] 17. Обновить секцию FSD в `CLAUDE.md` (auth → shared, segment barrels, domain naming)
- [x] 18. Прогнать `pnpm typecheck` и `pnpm --filter frontend lint`
- [x] 19. Прогнать login/register-флоу в браузере (ручная проверка пользователем)
- [x] 20. Grep-аудит на остаточные нарушения

---

## Промпт для запуска агента-исполнителя

Скопируй блок ниже в новую сессию Claude Code (или передай субагенту):

```
Ты реализуешь утверждённый план приведения `frontend/` к FSD v2.1. План находится в файле:

**`/Users/andreiananev/Documents/WEBDEV/treasurer-personal/.claude/plans/fsd-v2.1-alignment.md`**

Прочитай его ЦЕЛИКОМ первым делом. В плане 20 пунктов в чек-листе и подробный разбор всех изменений.

## КРИТИЧНЫЕ ИНСТРУКЦИИ

1. **Обновляй чек-лист в файле плана в реальном времени.** После завершения КАЖДОГО пункта сразу же используй Edit, чтобы поменять `- [ ] N. ...` на `- [x] N. ...` в файле плана. НЕ ждать конца работы и НЕ батчить — пункт сделан → сразу галка.

2. **Не отступай от плана.** Если по ходу обнаружишь неожиданность — остановись и спроси, не принимай архитектурных решений сам.

3. **Не редактируй CLAUDE.md и components.json вслепую.** Сначала прочитай их (Read), затем точечный Edit. Если `components.json` не содержит `aliases.utils` — отметь это и пропусти пункт 16.

4. **Импорты `cn` внутри `shared/ui/*.tsx`** должны идти на прямой путь `@/shared/lib/class-names`, НЕ через barrel `@/shared/lib` — это явно расписано в п.3 плана (circular dependency).

5. **Удаление директорий**: `rm -rf` через Bash для пустых `entities/` (внутри только `user/`, удалить целиком) и `shared/hooks/`.

6. **Рабочая директория**: `/Users/andreiananev/Documents/WEBDEV/treasurer-personal`. Все `pnpm` запускай оттуда.

## ПОРЯДОК

Иди по чек-листу плана последовательно (1-20). После пунктов 1-17 — верификация:

- `pnpm typecheck` (из корня монорепо)
- `pnpm --filter frontend lint`
- Grep-аудит:
  - `grep -rn "@/entities" /Users/andreiananev/Documents/WEBDEV/treasurer-personal/frontend/src` → пусто
  - `grep -rn "@/shared/lib/utils\|@/shared/api/http\|@/shared/config/env" /Users/andreiananev/Documents/WEBDEV/treasurer-personal/frontend/src` → пусто
  - `find /Users/andreiananev/Documents/WEBDEV/treasurer-personal/frontend/src -name "utils.ts" -o -name "types.ts" -o -name "schema.ts"` → пусто

Браузерную проверку (пункт 19) НЕ запускай — оставь пользователю.

## ОТЧЁТ В КОНЦЕ

- Что сделано
- Результаты typecheck/lint/grep
- Отклонения от плана и почему
- Что осталось пользователю
```
