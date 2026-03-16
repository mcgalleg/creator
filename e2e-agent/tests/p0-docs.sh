#!/usr/bin/env bash
# P0: Docs hub — sidebar navigation, all 7 doc pages render
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/lib/helpers.sh"
source "$SCRIPT_DIR/lib/assertions.sh"

echo "▶ P0: Documentation Pages"

reset_browser
navigate "/docs"

# Docs hub renders
assert_visible "Docs hub renders" "Documentation"
assert_visible "Sidebar: Getting Started link" "Getting Started"
assert_visible "Sidebar: AI Copilot link" "AI Copilot"
assert_visible "Sidebar: Sync Credits link" "Sync Credits"

# Check each doc page loads
DOC_PAGES=("getting-started" "ai-copilot" "sync-credits" "ai-tokens" "accounts" "connectors" "billing")
DOC_TITLES=("Getting Started" "AI Copilot" "Sync Credits" "AI Tokens" "Accounts" "Connectors" "Billing")

for i in "${!DOC_PAGES[@]}"; do
  navigate "/docs/${DOC_PAGES[$i]}"
  assert_visible "Doc page: ${DOC_TITLES[$i]} renders" "${DOC_TITLES[$i]}"
  assert_visible "Doc page: ${DOC_TITLES[$i]} has sidebar" "Getting Started"
done

print_summary
