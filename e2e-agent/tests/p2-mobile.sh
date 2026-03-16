#!/usr/bin/env bash
# P2: Mobile — responsive layout, hidden nav links, workspace at small viewport
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/lib/helpers.sh"
source "$SCRIPT_DIR/lib/assertions.sh"

echo "▶ P2: Mobile Responsive"

reset_browser

# Set mobile viewport (iPhone 13)
set_viewport 375 812

navigate "/"
sleep 2

# Hero should render on mobile
assert_visible "Hero renders on mobile" "Stop Guessing"
assert_visible "Hero tagline on mobile" "Ask Astriq"

# Desktop nav links should be hidden (Features, Pricing, FAQ, Docs as nav items)
# On mobile, only Sign In and Get Started buttons should be visible
assert_visible "Sign In button on mobile" "Sign In"
assert_visible "Get Started button on mobile" "Get Started"

# Desktop nav links (Features, FAQ) should not appear as standalone nav items
# (They may still exist in the page body, so we check the nav area specifically)
snap=$(snapshot_text)
# Count nav items in the banner area — if "Features" appears in the banner, it's not mobile-responsive
nav_section=$(echo "$snap" | sed -n '/^- banner/,/^- main/p')
if echo "$nav_section" | grep -q "Features"; then
  _FAIL=$((_FAIL + 1))
  echo "  ✗ Desktop nav links visible at mobile viewport (not responsive)"
else
  _PASS=$((_PASS + 1))
  echo "  ✓ Desktop nav links hidden at mobile viewport"
fi

# Test workspace at mobile viewport
USER_ID=$(new_test_user "e2e_mobile")
seed_user "$USER_ID" > /dev/null
set_tier "$USER_ID" "pro" > /dev/null
reset_credits "$USER_ID" 500 > /dev/null

set_test_user "$USER_ID"
navigate "/workspace"
sleep 2

snap=$(snapshot_text)
if echo "$snap" | grep -qi "workspace\|Astriq\|chat\|message\|analyze"; then
  _PASS=$((_PASS + 1))
  echo "  ✓ Workspace renders at mobile viewport"
else
  _FAIL=$((_FAIL + 1))
  echo "  ✗ Workspace not rendering at mobile viewport"
  debug_screenshot "mobile-workspace"
fi

# Reset viewport
set_viewport 1280 720

print_summary
