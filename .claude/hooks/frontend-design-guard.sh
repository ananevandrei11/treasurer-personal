#!/usr/bin/env bash
# UserPromptSubmit hook: when the user invokes the frontend-design plugin skill,
# inject Treasurer project rules so the generic skill doesn't ignore them.
#
# Input: JSON on stdin with the user prompt under .prompt
# Output: stdout is appended to the model's context as additional instructions.

set -euo pipefail

prompt="$(cat)"

# Lowercase, strip non-ascii to make matching simple
needle="$(printf '%s' "$prompt" | tr '[:upper:]' '[:lower:]')"

case "$needle" in
  *frontend-design*|*"frontend design"*|*"design-frontend"*)
    cat <<'EOF'
[treasurer project guard — frontend-design invoked]

Before producing any UI code, follow the project rules — frontend-design is a generic plugin and does NOT know this project:

1. Branch first (GitHub Flow): if on master, run `git checkout -b feat/<short-description>` before writing code.
2. Read `frontend/CLAUDE.md` and `.claude/skills/frontend-engineer/SKILL.md` — they have the canonical templates.
3. Use existing primitives from `@/shared/ui` (shadcn `base-nova`, `@base-ui/react`). Check `frontend/src/shared/ui/` BEFORE inventing a new component. If a needed primitive is missing, run `pnpm dlx shadcn@latest add <name>` and re-export it from `shared/ui/index.ts`.
4. Architecture: FSD with layers `app → views → widgets → features → shared`. New routes go to `views/<name>/` + thin `app/.../page.tsx`. New user actions go to `features/<domain>/<action>/{model,api,ui}`.
5. All UI strings, labels, placeholders, errors, page titles in English.
6. Imports through barrels only: `@/shared/ui`, `@/shared/api`, `@/shared/lib`, `@/shared/config`.
7. Default to Server Components. `'use client'` only for interactive leaves. Server Actions need `'use server'`.
EOF
    ;;
esac

exit 0
