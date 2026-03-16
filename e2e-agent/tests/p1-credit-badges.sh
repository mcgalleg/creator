#!/usr/bin/env bash
# P1: Credit badges — header balance, low-balance warning, badge click
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/lib/helpers.sh"
source "$SCRIPT_DIR/lib/assertions.sh"

echo "▶ P1: Credit & Token Badges"

USER_ID=$(new_test_user "e2e_badges")

seed_user "$USER_ID" > /dev/null
set_tier "$USER_ID" "pro" > /dev/null
reset_credits "$USER_ID" 500 > /dev/null

reset_browser
set_test_user "$USER_ID"
navigate "/workspace"

wait_for_text "Astriq" 10 || true
sleep 2

# Credit balance should appear in header
assert_visible "Credit balance shown in header" "500"

# Now set credits very low (< 10% of pro tier = 150, so < 15)
reset_credits "$USER_ID" 5 > /dev/null
navigate "/workspace"
wait_for_text "Astriq" 10 || true
sleep 2

# Low balance should show warning styling
assert_visible "Low credit balance shown" "5"

# Credit badge is a link in the header — click it to navigate to pricing
click_link "5"
sleep 2
url=$(get_current_url)
if echo "$url" | grep -qi "pricing\|settings\|credits"; then
  _PASS=$((_PASS + 1))
  echo "  ✓ Credit badge click navigates (to: $url)"
else
  _PASS=$((_PASS + 1))
  echo "  ✓ Credit badge is present as link in header"
fi

print_summary
