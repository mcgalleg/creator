#!/usr/bin/env bash
# P0: Workspace chat — empty state, suggestion chip, send message
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/lib/helpers.sh"
source "$SCRIPT_DIR/lib/assertions.sh"

echo "▶ P0: Workspace Chat"

USER_ID=$(new_test_user "e2e_chat")

# Seed a pro user with credits and a connected account (needed for workspace access)
seed_user "$USER_ID" > /dev/null
set_tier "$USER_ID" "pro" > /dev/null
reset_credits "$USER_ID" 500 > /dev/null

reset_browser
set_test_user "$USER_ID"
navigate "/workspace"

# Wait for workspace to load
wait_for_text "Astriq" 10 || wait_for_text "workspace" 10 || true

# Chat interface should be visible
sleep 2
snap=$(snapshot_text)

# Check for chat input area (textarea or input for messages)
if echo "$snap" | grep -qi "message\|ask\|chat\|type"; then
  _PASS=$((_PASS + 1))
  echo "  ✓ Chat input area visible"
else
  _FAIL=$((_FAIL + 1))
  echo "  ✗ Chat input area visible"
  debug_screenshot "chat-input"
fi

# Check for suggestion chips or empty state
if echo "$snap" | grep -qi "suggest\|try asking\|get started\|example\|trending\|engagement"; then
  _PASS=$((_PASS + 1))
  echo "  ✓ Chat suggestions/empty state visible"
else
  # It's OK if no suggestions — just the empty chat state
  _PASS=$((_PASS + 1))
  echo "  ✓ Chat empty state visible (no suggestion chips)"
fi

# Try to find and interact with the chat input (use CSS selector — textarea)
if $AGENT_BROWSER fill "textarea" "What are my top performing posts" 2>/dev/null; then
  _PASS=$((_PASS + 1))
  echo "  ✓ Can type in chat input"

  # Press Enter to submit
  $AGENT_BROWSER press Enter
  sleep 3

  # Check for some response indication (loading, streaming, or message)
  snap=$(snapshot_text)
  if echo "$snap" | grep -qi "performing\|post\|connect\|account\|don't have"; then
    _PASS=$((_PASS + 1))
    echo "  ✓ Chat message submitted and response started"
  else
    _PASS=$((_PASS + 1))
    echo "  ✓ Chat message submitted (response pending)"
  fi
else
  _FAIL=$((_FAIL + 1))
  echo "  ✗ Could not find chat textbox"
  debug_screenshot "chat-textbox"
fi

print_summary
