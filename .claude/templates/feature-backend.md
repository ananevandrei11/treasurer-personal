# Backend — новый модуль

## Стек
NestJS 11 · PostgreSQL · Prisma · CQRS · JWT-авторизация

## Задача
<!-- Что нужно реализовать -->

## Модель данных
<!-- Поля новой сущности в schema.prisma -->

## Эндпоинты
<!-- Метод, путь, guard, body/query, ответ -->

## Паттерн
- Структуру модуля смотри в `backend/src/modules/categories/`
- Команды/запросы через CQRS (handlers в `commands/` и `queries/`)
- DTO валидируются через `class-validator`

## Ограничения
- Не добавлять зависимости без явного указания
- После реализации: `pnpm build:api`
