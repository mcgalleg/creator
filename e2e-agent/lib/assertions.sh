#!/usr/bin/env bash
# Assertion helpers for agent-browser E2E tests

# Counters
_PASS=0
_FAIL=0
_FAILURES=""

assert_visible() {
  local description="$1"
  local text="$2"

  if snapshot_contains "$text"; then
    _PASS=$((_PASS + 1))
    echo "  ✓ $description"
  else
    _FAIL=$((_FAIL + 1))
    _FAILURES="${_FAILURES}\n  ✗ $description (expected to find: \"$text\")"
    echo "  ✗ $description (expected to find: \"$text\")"
    debug_screenshot "fail-${description// /-}"
  fi
}

assert_not_visible() {
  local description="$1"
  local text="$2"

  if ! snapshot_contains "$text"; then
    _PASS=$((_PASS + 1))
    echo "  ✓ $description"
  else
    _FAIL=$((_FAIL + 1))
    _FAILURES="${_FAILURES}\n  ✗ $description (expected NOT to find: \"$text\")"
    echo "  ✗ $description (expected NOT to find: \"$text\")"
    debug_screenshot "fail-${description// /-}"
  fi
}

assert_url_contains() {
  local description="$1"
  local pattern="$2"
  local url
  url=$(get_current_url)

  if echo "$url" | grep -qi "$pattern"; then
    _PASS=$((_PASS + 1))
    echo "  ✓ $description"
  else
    _FAIL=$((_FAIL + 1))
    _FAILURES="${_FAILURES}\n  ✗ $description (URL \"$url\" does not match \"$pattern\")"
    echo "  ✗ $description (URL \"$url\" does not match \"$pattern\")"
  fi
}

assert_json_field() {
  local description="$1"
  local json="$2"
  local field="$3"
  local expected="$4"

  local actual
  actual=$(echo "$json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
keys = '${field}'.split('.')
for k in keys:
    if isinstance(data, list):
        data = data[int(k)]
    else:
        data = data[k]
print(data)
" 2>/dev/null || echo "__PARSE_ERROR__")

  if [ "$actual" = "$expected" ]; then
    _PASS=$((_PASS + 1))
    echo "  ✓ $description"
  else
    _FAIL=$((_FAIL + 1))
    _FAILURES="${_FAILURES}\n  ✗ $description (expected $field=\"$expected\", got \"$actual\")"
    echo "  ✗ $description (expected $field=\"$expected\", got \"$actual\")"
  fi
}

assert_json_field_gte() {
  local description="$1"
  local json="$2"
  local field="$3"
  local minimum="$4"

  local actual
  actual=$(echo "$json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
keys = '${field}'.split('.')
for k in keys:
    if isinstance(data, list):
        data = data[int(k)]
    else:
        data = data[k]
print(data)
" 2>/dev/null || echo "0")

  if [ "$actual" -ge "$minimum" ] 2>/dev/null; then
    _PASS=$((_PASS + 1))
    echo "  ✓ $description"
  else
    _FAIL=$((_FAIL + 1))
    _FAILURES="${_FAILURES}\n  ✗ $description (expected $field >= $minimum, got \"$actual\")"
    echo "  ✗ $description (expected $field >= $minimum, got \"$actual\")"
  fi
}

assert_true() {
  local description="$1"
  local condition="$2"

  if eval "$condition"; then
    _PASS=$((_PASS + 1))
    echo "  ✓ $description"
  else
    _FAIL=$((_FAIL + 1))
    _FAILURES="${_FAILURES}\n  ✗ $description"
    echo "  ✗ $description"
  fi
}

print_summary() {
  local total=$((_PASS + _FAIL))
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Results: ${_PASS}/${total} passed, ${_FAIL} failed"

  if [ $_FAIL -gt 0 ]; then
    echo ""
    echo "  Failures:"
    echo -e "$_FAILURES"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    return 1
  fi

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  return 0
}
