#!/usr/bin/env bash
# P0: Settings — tabs load, tier badge, URL params
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/lib/helpers.sh"
source "$SCRIPT_DIR/lib/assertions.sh"

echo "▶ P0: Settings Page"

USER_ID=$(new_test_user "e2e_settings")

seed_user "$USER_ID" > /dev/null
set_tier "$USER_ID" "pro" > /dev/null
reset_credits "$USER_ID" 500 > /dev/null

reset_browser
set_test_user "$USER_ID"
navigate "/workspace/settings"

wait_for_text "Settings" 10
assert_visible "Settings page renders" "Settings"
assert_visible "Settings subtitle" "Manage"

# Check tabs exist
assert_visible "Plan tab visible" "Plan"
assert_visible "Goals tab visible" "Goals"
assert_visible "Credits tab visible" "Credits"

# Tier badge
assert_visible "Pro tier badge visible" "Pro"

# Tab switching — click Goals tab
click_text "Goals"
sleep 1
assert_url_contains "Goals tab updates URL" "tab"

# Click Credits tab
click_text "Credits"
sleep 1
assert_visible "Credits tab content loads" "Credits"

# Click Transactions tab if available
if snapshot_contains "Transactions"; then
  click_text "Transactions"
  sleep 1
  assert_visible "Transactions tab content loads" "Transactions"
fi

print_summary
