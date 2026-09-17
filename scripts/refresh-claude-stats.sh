#!/bin/bash
# Daily refresh of public/claude-stats.json, then publish.
#
# This can't live in the GitHub Action: the numbers are computed from ~/.claude
# on this Mac, which ubuntu-latest doesn't have. So the Mac collects, commits,
# pushes main and deploys the built site itself. The Action keeps doing the ADO
# and GitHub stats on its own daily schedule; the two touch different files.
#
# Installed as a launchd agent: ~/Library/LaunchAgents/com.aeden.claudestats.plist
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

# launchd gives a bare PATH; pick up node/npm the way the login shell does.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

echo "=== $(date) ==="

git fetch origin main --quiet
git checkout main --quiet
git pull --rebase --quiet origin main

node scripts/collect-claude-stats.js

if git diff --quiet -- public/claude-stats.json; then
  echo "stats unchanged; nothing to publish"
  exit 0
fi

git add public/claude-stats.json
git commit -m "chore: update claude code stats [skip ci]"
git push origin main

npm run deploy
echo "deployed"
