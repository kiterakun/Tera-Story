#!/usr/bin/env bash
# Auto-fix script: runs eslint --fix and vitest for changed packages
# Called by Claude Code hooks after file edits

set -euo pipefail

TOOL_INPUT="${CLAUDE_HOOK_TOOL_INPUT:-}"
EXIT_CODE=0

# Determine which package was edited
if echo "$TOOL_INPUT" | grep -q '"backend/'; then
  PACKAGES=("backend")
elif echo "$TOOL_INPUT" | grep -q '"frontend/'; then
  PACKAGES=("frontend")
else
  exit 0
fi

for pkg in "${PACKAGES[@]}"; do
  echo "=== Auto-fix: $pkg ==="
  cd "$pkg"

  # Run eslint --fix
  echo "--- eslint --fix ---"
  npx eslint . --fix 2>&1 || true

  # Run tests
  echo "--- vitest ---"
  npx vitest run 2>&1 || EXIT_CODE=1

  cd ..
done

exit $EXIT_CODE
