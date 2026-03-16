#!/usr/bin/env bash
# Run all agent-browser E2E tests and report summary
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$SCRIPT_DIR/tests"

TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_SKIP=0
RESULTS=""

echo "╔══════════════════════════════════════╗"
echo "║   agent-browser E2E Test Suite       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check prerequisites
if ! command -v agent-browser &> /dev/null; then
  echo "ERROR: agent-browser not found. Install it first."
  exit 1
fi

if ! curl -sf http://localhost:3000/api/test/state?userId=test_user_123 > /dev/null 2>&1; then
  echo "ERROR: Dev server not reachable at http://localhost:3000"
  echo "Start it with: BYPASS_AUTH=true npm run dev"
  exit 1
fi

# Run all test files in sorted order
for test_file in $(ls "$TESTS_DIR"/*.sh | sort); do
  test_name=$(basename "$test_file" .sh)
  echo ""
  echo "━━━ Running: $test_name ━━━"

  output=$(bash "$test_file" 2>&1)
  exit_code=$?

  echo "$output"

  # Parse pass/fail from output
  pass=$(echo "$output" | grep -o '[0-9]*/[0-9]* passed' | head -1 | cut -d'/' -f1 || echo "0")
  total=$(echo "$output" | grep -o '[0-9]*/[0-9]* passed' | head -1 | cut -d'/' -f2 | cut -d' ' -f1 || echo "0")
  fail=$(echo "$output" | grep -o '[0-9]* failed' | head -1 | cut -d' ' -f1 || echo "0")

  if [ -z "$pass" ] || [ "$pass" = "0" ] && [ "$total" = "0" ]; then
    if [ $exit_code -eq 0 ]; then
      RESULTS="${RESULTS}\n  ✓ ${test_name} (passed)"
      TOTAL_PASS=$((TOTAL_PASS + 1))
    else
      RESULTS="${RESULTS}\n  ✗ ${test_name} (FAILED - exit code $exit_code)"
      TOTAL_FAIL=$((TOTAL_FAIL + 1))
    fi
  else
    TOTAL_PASS=$((TOTAL_PASS + ${pass:-0}))
    TOTAL_FAIL=$((TOTAL_FAIL + ${fail:-0}))
    if [ "${fail:-0}" -gt 0 ]; then
      RESULTS="${RESULTS}\n  ✗ ${test_name}: ${pass}/${total} passed, ${fail} failed"
    else
      RESULTS="${RESULTS}\n  ✓ ${test_name}: ${pass}/${total} passed"
    fi
  fi
done

echo ""
echo ""
echo "╔══════════════════════════════════════╗"
echo "║          SUITE SUMMARY               ║"
echo "╚══════════════════════════════════════╝"
echo -e "$RESULTS"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Total: $((TOTAL_PASS + TOTAL_FAIL)) assertions, ${TOTAL_PASS} passed, ${TOTAL_FAIL} failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $TOTAL_FAIL -gt 0 ]; then
  exit 1
fi
