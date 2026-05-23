---
name: commit
description: Create a git commit for the Treasurer project following Conventional Commits. Use this skill whenever the user asks to commit, stage changes, write a commit message, or says "сделай коммит", "закоммить", "commit this". The skill encodes exact type/scope vocabulary, formatting rules, and project-specific constraints (no co-author trailer, no autonomous git actions without explicit instruction).
model: Sonnet
effort: low
allowedTools:
  - Bash(git *)
  - Bash(grep *)
  - Bash(read *)
  - Bash(glob *)
---

# Commit — Treasurer

## Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

Format: `<type>(<scope>): <description>`

### Types

`feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`

### Scopes

`backend`, `frontend`, `shared`, `config`

Scope is optional — omit if the change is truly cross-cutting.

### Examples

```
feat(backend): add create transaction endpoint
fix(frontend): fix registration form validation
refactor(shared): extract button to shared/ui
chore(config): update prisma schema
docs: expand README with quick-start guide
```

### Rules

- Description: imperative mood, lowercase, **no period** at the end
- Breaking change: append `!` → `feat(auth)!: change token format`
- Body/footer optional; use only for breaking changes or issue references

## Hard constraints

**Never** include `Co-Authored-By:` or any AI attribution trailer in the commit message — the user does not want AI attribution in git history.

**Never** run `git commit` (or any git operation) autonomously. Prepare the message and show it to the user; wait for explicit confirmation before executing.

## Status
1. see what changed - !`git status`
2. last commits - !`git log --oneline -10`

## Workflow
1. `git diff` — read the content to form an accurate message
2. Determine type and scope
3. Stage only relevant files explicitly — never `git add .` or `git add -A`
4. Draft a commit message and show it to the user for confirmation
5. On approval, commit via heredoc:

```bash
git commit -m "$(cat <<'EOF'
<your message here>
EOF
)"
```

7. Verify with `git log --oneline -1`

Do **not** add `-a`, `--amend`, `--no-verify`, or push unless the user explicitly asks.
