# .agents — AI Knowledge Base

Unified knowledge base for all AI tools working in this project.
Source of truth lives in `.claude/`; everything here is a symlink.

## Structure

```
.agents/
├── skills/
│   ├── feature-sliced-design/   → .claude/skills/feature-sliced-design/
│   └── frontend-engineer/       → .claude/skills/frontend-engineer/
├── templates/                   → .claude/templates/
├── prompts/                     → .claude/prompts/
└── rules/
    ├── project.md               → CLAUDE.md
    ├── backend.md               → backend/CLAUDE.md
    └── frontend.md              → frontend/CLAUDE.md
```

## Skills

| Skill | Description |
|-------|-------------|
| `feature-sliced-design` | FSD v2.1 methodology — layer placement, import boundaries, cross-imports |
| `frontend-engineer` | Project-specific frontend rules — Next.js 16, React 19, shadcn/ui, Tailwind 4, zod |

## For AI tools

Start with `rules/project.md` for project context, then load the relevant skill before making changes.
