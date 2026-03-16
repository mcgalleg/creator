#!/usr/bin/env bash
# P0: Landing page — hero, navigation, footer
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/lib/helpers.sh"
source "$SCRIPT_DIR/lib/assertions.sh"

echo "▶ P0: Landing Page"

reset_browser
navigate "/"

# Hero section
assert_visible "Hero headline renders" "Stop Guessing"
assert_visible "Hero tagline renders" "Ask Astriq"

# Navigation links
assert_visible "Nav: Features link" "Features"
assert_visible "Nav: Pricing link" "Pricing"
assert_visible "Nav: FAQ link" "FAQ"
assert_visible "Nav: Docs link" "Docs"

# Footer links
$AGENT_BROWSER scroll down 5000
sleep 1

assert_visible "Footer: Documentation link" "Documentation"
assert_visible "Footer: Contact Support link" "Contact Support"
assert_visible "Footer: Privacy Policy link" "Privacy Policy"
assert_visible "Footer: Terms of Service link" "Terms of Service"

# Test footer navigation
click_link "Contact Support"
sleep 2
assert_url_contains "Footer Support navigates" "/support"

navigate "/"
$AGENT_BROWSER scroll down 5000
sleep 1

click_link "Privacy Policy"
sleep 2
assert_url_contains "Footer Privacy navigates" "/privacy"

print_summary
