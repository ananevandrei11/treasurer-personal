---
name: pr
description: Create a GitHub Pull Request for the Treasurer project. Use this skill whenever the user asks to create a PR, open a pull request, "создай PR", "открой пул реквест", "сделай пул реквест", or provides a PR title and branch name to push for review. Arguments: first arg = PR title, second arg = branch name (e.g. `/pr "feat: add categories page" feat/add-categories-page`).
argument-hint: "<title> <branch>"
model: Sonnet
effort: low
allowedTools:
  - Bash(git *)
  - Bash(gh *)
  - Bash(pnpm *)
  - Bash(bash *)
---

# PR — Treasurer

Creates a GitHub Pull Request following the project's GitHub Flow.

- **$0** — PR title. Use Conventional Commits format (`<type>(<scope>): <description>`) — same as commit messages. This matters because GitHub squash-merges the PR title into the commit history.
- **$1** — source branch name (e.g. `feat/add-accounts-page`)

If either argument is missing, ask the user to provide it before proceeding.

## Status
!`git status`

## Workflow

### 1. Validate state

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/validate.sh
```

- If there are uncommitted changes, stop and tell the user to commit first (suggest `/commit`).
- If there are no commits ahead of `master`, stop and warn that the branch has nothing to merge.

### 2. Run pre-PR checks

```bash
pnpm --filter frontend lint
pnpm typecheck
```

If either fails, show the errors and stop. Don't create the PR until the checks pass.

### 3. Push the branch

```bash
git push -u origin $1
```

If the branch is already up to date with remote, that's fine — proceed.

### 4. Build the PR body

Look at commits ahead of master to understand what changed:

```bash
git log --oneline master..$1
git diff master...$1 --stat
```

Write a concise PR body using the template at `${CLAUDE_SKILL_DIR}/template.md` — fill in the placeholders, don't change the section structure.

Keep the summary to 2–4 bullets max. The test plan should be concrete — name specific pages, endpoints, or flows that need verification.

### 5. Create the PR

```bash
gh pr create \
  --title "$0" \
  --base master \
  --head $1 \
  --body "$(cat <<'EOF'
<body>
EOF
)"
```

### 6. Show the result

Print the PR URL so the user can open it.

## GitHub authentication

The project stores a personal access token in `.github_token.txt` at the repo root.
Load it into the environment before running any `gh` command — never print or log the value:

```bash
export GH_TOKEN=$(cat .github_token.txt)
```

Then run `gh pr create` as normal; `gh` will pick up `GH_TOKEN` automatically.
If the file is missing or empty, fall back to `gh auth status` to check existing auth, and if that also fails, ask the user to check `.github_token.txt`.

## Hard constraints

- Base branch is always `master`.
- Never skip lint/typecheck checks — they're required before review.
- Never use `--draft` unless the user explicitly asks.
- Never force-push.
- Never merge the PR — the user always merges manually.
- Never print, echo, or log the token value — not in output, not in error messages.
