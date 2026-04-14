#!/usr/bin/env bash
# checkpoint-save.sh — Stage docs/testing changes and commit a checkpoint
# Usage: bash scripts/checkpoint-save.sh
# Add --push to also push to origin/master

set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Prism Checkpoint Save ==="
echo "Time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

# 1. Stage all modified/new files under docs/testing/
git add docs/testing/
echo "[1/3] Staged docs/testing/ files"

# 2. Check if there's anything to commit
if git diff --cached --quiet; then
  echo "Nothing new to commit in docs/testing/. Skipping."
  exit 0
fi

# 3. Commit
git commit -m "checkpoint: 保存当前测试进度"
echo "[2/3] Committed checkpoint"

# 4. Show what would be pushed
echo ""
echo "[3/3] Commits ahead of origin/master (would be pushed):"
git log --oneline origin/master..HEAD
echo ""

# 5. Optionally push
if [[ "${1:-}" == "--push" ]]; then
  echo "Pushing to origin/master..."
  git push origin master
  echo "Push complete."
else
  echo "To push, run:  git push origin master"
  echo "  or re-run:   bash scripts/checkpoint-save.sh --push"
fi
