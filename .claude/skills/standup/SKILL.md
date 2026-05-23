---
name: standup
description: Generate a standup report from today's git commits. Use when the user asks for a standup, daily report, "что я сделал сегодня", "стендап", "daily", or wants to summarize today's work for a meeting.
user_invocable: true
model: Sonnet
effort: medium
allowedTools:
  - Bash(git *)
  - Bash(date *)
---

# Standup Report

Generate a concise standup summary from today's commits, grouped by logical task.

## Steps

1. Get today's date:
   ```bash
   date +%Y-%m-%d
   ```

2. Fetch today's commits (all branches the user worked on):
   ```bash
   git log --all --author="$(git config user.name)" \
     --after="$(date +%Y-%m-%d) 00:00" \
     --format="%h %s%n%b" --no-merges
   ```

3. If no commits today — say so clearly and stop.

4. Also check what branches were active today (useful context):
   ```bash
   git log --all --author="$(git config user.name)" \
     --after="$(date +%Y-%m-%d) 00:00" \
     --format="%D" --no-merges | grep -v '^$' | head -20
   ```

## How to write the report

Group related commits into **logical tasks** — not a bullet per commit.
One paragraph per task, 2–4 sentences. Structure each paragraph:

- **What** was the goal / task (1 sentence)
- **Where** in the project — backend, frontend, which feature/module (1 sentence)
- **What changed** at the level of outcome, not implementation detail (1–2 sentences)

Skip implementation minutiae (variable names, refactors of refactors).
Focus on what a teammate needs to understand the day's progress.

## Output format

Write in the same language the user writes in (Russian if they wrote in Russian, English otherwise).

Use plain prose — no bullet lists, no headers. One blank line between paragraphs.

**Example output:**

> Работал над авторизацией на бэкенде. Реализовал эндпоинты регистрации и входа в систему, добавил JWT-аутентификацию через NestJS Guards. Токены теперь выдаются при логине и проверяются на защищённых маршрутах.
>
> На фронтенде подключил форму входа к API. Настроил обработку ошибок и редирект после успешной аутентификации. Форма регистрации пока использует моки — подключение запланировано на завтра.

## Edge cases

- **Commits on multiple branches**: group by topic, not by branch.
- **Single commit**: one paragraph is fine, don't pad it.
- **Chore/config commits** (CI, deps, linting): mention briefly at the end in one sentence — "Также обновил конфиг ESLint и поправил типы после рефакторинга."
