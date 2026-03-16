#!/usr/bin/env bash
# P1: Pricing page — tiers, toggle, credit packs
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/lib/helpers.sh"
source "$SCRIPT_DIR/lib/assertions.sh"

echo "▶ P1: Pricing Page"

reset_browser
navigate "/pricing"

wait_for_text "pricing" 10 || wait_for_text "Pricing" 10 || true

# All 5 tier cards
assert_visible "Free tier card" "Free"
assert_visible "Creator tier card" "Creator"
assert_visible "Pro tier card" "Pro"
assert_visible "Agency tier card" "Agency"
assert_visible "MCP Apps tier card" "MCP Apps"

# Monthly/Annual toggle
assert_visible "Billing toggle visible" "Monthly"
assert_visible "Annual option visible" "Annual"

# Try toggling to Annual
click_text "Annual"
sleep 1
assert_visible "Save 20% badge appears" "20%"

# Credit packs section
$AGENT_BROWSER scroll down 3000
sleep 1
assert_visible "Credit packs section" "Credit Pack"

# AI Token packs section
$AGENT_BROWSER scroll down 2000
sleep 1
assert_visible "Token packs section" "Token Pack"

print_summary
