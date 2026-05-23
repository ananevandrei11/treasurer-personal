# Frontend — новый слайс

## Стек
Next.js 16 · App Router · RSC · Server Actions · FSD · Tailwind CSS 4 · shadcn/ui · zod

## Задача
<!-- Что нужно реализовать -->

## Слой FSD
<!-- features / views / widgets / shared -->

## Структура файлов
<!-- Путь и назначение каждого нового файла -->
<!--
Пример для features/<domain>/<action>/:
  index.ts                      — публичное API слайса
  model/<action>.ts             — zod-схема + тип
  api/<action>-action.ts        — 'use server' Server Action
  ui/<Component>.tsx            — 'use client' интерактивный UI
-->

## Данные
<!-- Какой эндпоинт вызывать и какой DTO ожидать -->
<!-- DTO-тип добавить в shared/api/<domain>.ts -->

## Правила RSC / Client
- По умолчанию — Server Component
- `'use client'` только в `features/*/ui/` и там, где нужны хуки/браузер
- Server Actions (`'use server'`) — только в `features/*/api/*-action.ts`

## HTTP
- Аутентифицированные запросы — `fetchWithAuth` из `@/shared/api`
- Публичные — `backendFetch` из `@/shared/api`

## Форма (если есть)
- Образец: `features/auth/login`
- `useActionState` + `useFormStatus` в submit-кнопке
- Dirty-field pattern для очистки ошибок при вводе

## Ограничения
- Импорты только через барrels (`@/shared/ui`, `@/shared/api`, `@/shared/lib`, `@/shared/config`)
- Не добавлять новые слои (`entities/`, `processes/`) без согласования
- Новые shadcn-компоненты: `pnpm dlx shadcn@latest add <name>`, затем re-export из `shared/ui/index.ts`
- UI-строки только на английском
- После реализации: `pnpm --filter frontend lint && pnpm --filter frontend typecheck`
