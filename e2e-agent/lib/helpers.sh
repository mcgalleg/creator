#!/usr/bin/env bash
# Shared helpers for agent-browser E2E tests

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
AGENT_BROWSER="${AGENT_BROWSER:-agent-browser}"
SCREENSHOTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/screenshots"

# ---------- User Management ----------

new_test_user() {
  local prefix="${1:-e2e}"
  echo "${prefix}_$(date +%s)_${RANDOM}"
}

seed_user() {
  local user_id="$1"
  local email="${2:-${user_id}@test.example.com}"
  local name="${3:-E2E Test User}"
  local skip_onboarding="${4:-false}"

  curl -sf -X POST "${BASE_URL}/api/test/ensure-user" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"${user_id}\",\"email\":\"${email}\",\"name\":\"${name}\",\"skipOnboarding\":${skip_onboarding}}"
}

set_tier() {
  local user_id="$1"
  local tier="$2"

  curl -sf -X POST "${BASE_URL}/api/test/subscription" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"${user_id}\",\"action\":\"set-tier\",\"tier\":\"${tier}\"}"
}

reset_credits() {
  local user_id="$1"
  local balance="$2"

  curl -sf -X POST "${BASE_URL}/api/test/reset-credits" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"${user_id}\",\"balance\":${balance}}"
}

get_state() {
  local user_id="$1"
  curl -sf "${BASE_URL}/api/test/state?userId=${user_id}"
}

get_subscription() {
  local user_id="$1"
  curl -sf "${BASE_URL}/api/test/subscription?userId=${user_id}"
}

# ---------- Browser Helpers ----------

set_test_user() {
  local user_id="$1"
  $AGENT_BROWSER set headers "{\"X-Test-User-Id\":\"${user_id}\"}"
}

navigate() {
  local path="$1"
  $AGENT_BROWSER open "${BASE_URL}${path}"
  sleep 1  # brief wait for hydration
}

snapshot_text() {
  $AGENT_BROWSER snapshot 2>/dev/null || true
}

snapshot_contains() {
  local text="$1"
  local snap
  snap=$($AGENT_BROWSER snapshot 2>/dev/null || true)
  echo "$snap" | grep -qi "$text"
}

wait_for_text() {
  local text="$1"
  local max_attempts="${2:-10}"
  local attempt=0

  while [ $attempt -lt $max_attempts ]; do
    if snapshot_contains "$text"; then
      return 0
    fi
    sleep 1
    attempt=$((attempt + 1))
  done
  return 1
}

click_text() {
  local text="$1"
  $AGENT_BROWSER find text "$text" click
}

# Click a link by its visible text using JS (more reliable for Next.js Link components)
click_link() {
  local text="$1"
  $AGENT_BROWSER eval "
    const links = [...document.querySelectorAll('a')];
    const link = links.find(a => a.textContent.trim() === '${text}');
    if (link) { link.click(); }
  "
}

click_role() {
  local role="$1"
  local name="$2"
  $AGENT_BROWSER find role "$role" click "$name"
}

reset_browser() {
  $AGENT_BROWSER cookies clear 2>/dev/null || true
  $AGENT_BROWSER eval "try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}" 2>/dev/null || true
}

debug_screenshot() {
  local name="$1"
  mkdir -p "$SCREENSHOTS_DIR"
  $AGENT_BROWSER screenshot "${SCREENSHOTS_DIR}/${name}-$(date +%s).png" 2>/dev/null || true
}

set_viewport() {
  local width="$1"
  local height="$2"
  $AGENT_BROWSER set viewport "$width" "$height"
}

get_current_url() {
  $AGENT_BROWSER get url 2>/dev/null || true
}

# ---------- API Helpers ----------

api_get() {
  local path="$1"
  local user_id="${2:-}"
  local headers=""
  if [ -n "$user_id" ]; then
    headers="-H \"X-Test-User-Id: ${user_id}\""
  fi
  eval curl -sf "${BASE_URL}${path}" $headers
}

api_post() {
  local path="$1"
  local body="$2"
  local user_id="${3:-}"
  local headers=""
  if [ -n "$user_id" ]; then
    headers="-H \"X-Test-User-Id: ${user_id}\""
  fi
  eval curl -sf -X POST "${BASE_URL}${path}" \
    -H "\"Content-Type: application/json\"" \
    $headers \
    -d "'${body}'"
}

api_delete() {
  local path="$1"
  local user_id="${2:-}"
  local headers=""
  if [ -n "$user_id" ]; then
    headers="-H \"X-Test-User-Id: ${user_id}\""
  fi
  eval curl -sf -X DELETE "${BASE_URL}${path}" $headers
}

poll_sync() {
  local account_id="$1"
  local job_id="$2"
  local user_id="$3"
  local timeout_sec="${4:-90}"
  local interval="${5:-3}"
  local elapsed=0

  while [ $elapsed -lt $timeout_sec ]; do
    local status
    status=$(curl -sf "${BASE_URL}/api/accounts/${account_id}/sync?jobId=${job_id}" \
      -H "X-Test-User-Id: ${user_id}" 2>/dev/null || echo '{}')

    local job_status
    job_status=$(echo "$status" | python3 -c "import sys,json; print(json.load(sys.stdin).get('job',{}).get('status',''))" 2>/dev/null || echo "")

    if [ "$job_status" = "completed" ]; then
      echo "$status"
      return 0
    elif [ "$job_status" = "failed" ]; then
      echo "Sync job failed: $status" >&2
      return 1
    fi

    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  echo "Sync job timed out after ${timeout_sec}s" >&2
  return 1
}
