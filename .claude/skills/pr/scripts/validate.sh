#!/bin/bash
CURRENT=$(git branch --show-current)
if [ "$CURRENT" = "master" ] || [ "$CURRENT" = "develop" ]; then
  echo "Нельзя создавать PR из ветки $CURRENT. Создай feature-ветку."
  exit 2
fi

# Sync remote master so comparisons are accurate
git fetch origin master --quiet

LOCAL_MASTER=$(git rev-parse master)
REMOTE_MASTER=$(git rev-parse origin/master)
if [ "$LOCAL_MASTER" != "$REMOTE_MASTER" ]; then
  BEHIND=$(git log master..origin/master --oneline | wc -l | tr -d ' ')
  echo "Локальный master отстаёт от origin/master на $BEHIND коммит(ов). Сначала: git checkout master && git pull && git rebase master"
  exit 2
fi

COMMITS=$(git log master..HEAD --oneline | wc -l | tr -d ' ')
if [ "$COMMITS" -eq 0 ]; then
  echo "Нет коммитов относительно master."
  exit 2
fi
echo "Ветка готова: $COMMITS коммит(ов)"
exit 0
