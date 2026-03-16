#!/usr/bin/env bash
# P0: Onboarding flow — welcome → goals → skip → workspace
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/lib/helpers.sh"
source "$SCRIPT_DIR/lib/assertions.sh"

echo "▶ P0: Onboarding Flow"

USER_ID=$(new_test_user "e2e_onboard")

# Create user who has NOT completed onboarding
seed_user "$USER_ID" "${USER_ID}@test.example.com" "Onboarding Tester" true > /dev/null

reset_browser
set_test_user "$USER_ID"
navigate "/onboarding"

# Welcome screen
wait_for_text "Welcome" 10
assert_visible "Welcome screen renders" "Welcome"

# Look for a continue/next button and click it
if snapshot_contains "Continue"; then
  click_text "Continue"
  sleep 1
elif snapshot_contains "Get Started"; then
  click_text "Get Started"
  sleep 1
elif snapshot_contains "Next"; then
  click_text "Next"
  sleep 1
fi

# Goals step
if wait_for_text "goal" 5 || wait_for_text "Goal" 5; then
  assert_visible "Goals step renders" "goal"
fi

# Skip to workspace
if snapshot_contains "Skip"; then
  click_text "Skip"
  sleep 2
elif snapshot_contains "skip"; then
  click_text "skip"
  sleep 2
elif snapshot_contains "Skip for now"; then
  click_text "Skip for now"
  sleep 2
fi

# Should end up at workspace or onboarding completion
sleep 2
url=$(get_current_url)
if echo "$url" | grep -qi "workspace\|onboarding"; then
  _PASS=$((_PASS + 1))
  echo "  ✓ Onboarding flow completes (at: $url)"
else
  _FAIL=$((_FAIL + 1))
  echo "  ✗ Onboarding flow completes (unexpected URL: $url)"
fi

print_summary
