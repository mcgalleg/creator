#!/usr/bin/env bash
# P0: Support page — email visible, doc links work
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/lib/helpers.sh"
source "$SCRIPT_DIR/lib/assertions.sh"

echo "▶ P0: Support Page"

reset_browser
navigate "/support"

# Support content
assert_visible "Support page renders" "Support"
assert_visible "Support email visible" "support@astriq.ai"
assert_visible "Getting Started doc link" "Getting Started"
assert_visible "AI Copilot doc link" "AI Copilot"
assert_visible "Billing doc link" "Billing"

# Test a doc link navigation
click_text "Getting Started"
sleep 2
assert_url_contains "Doc link navigates to getting-started" "/docs/getting-started"

print_summary
