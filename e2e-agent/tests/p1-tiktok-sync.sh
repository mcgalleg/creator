#!/usr/bin/env bash
# P1: TikTok sync pipeline — preview, connect, post sync, comment sync, profile refresh
# Uses real Apify actors. Cost: ~5-10 credits, ~$0.005 Apify per run.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/lib/helpers.sh"
source "$SCRIPT_DIR/lib/assertions.sh"

echo "▶ P1: TikTok Sync Pipeline (real API)"

USER_ID=$(new_test_user "e2e_tiktok")
TEST_USERNAME="alonderzz"

# Seed pro user with plenty of credits
seed_user "$USER_ID" > /dev/null
set_tier "$USER_ID" "pro" > /dev/null
reset_credits "$USER_ID" 500 > /dev/null

echo "  User: $USER_ID"

# 1. Preview
echo "  Step 1: Preview profile..."
preview=$(curl -sf "${BASE_URL}/api/tiktok/preview?username=${TEST_USERNAME}" \
  -H "X-Test-User-Id: ${USER_ID}")

assert_json_field "Preview returns username" "$preview" "profile.username" "$TEST_USERNAME"

follower_count=$(echo "$preview" | python3 -c "import sys,json; print(json.load(sys.stdin)['profile']['followerCount'])" 2>/dev/null || echo "0")
if [ "$follower_count" -gt 0 ] 2>/dev/null; then
  _PASS=$((_PASS + 1))
  echo "  ✓ Preview returns follower count ($follower_count)"
else
  _FAIL=$((_FAIL + 1))
  echo "  ✗ Preview returns follower count (got: $follower_count)"
fi

# 2. Connect account with post sync
echo "  Step 2: Connect account..."
connect_result=$(curl -sf -X POST "${BASE_URL}/api/accounts" \
  -H "Content-Type: application/json" \
  -H "X-Test-User-Id: ${USER_ID}" \
  -d "{\"username\":\"${TEST_USERNAME}\",\"importOption\":\"profile_posts\",\"postsLimit\":3}")

account_id=$(echo "$connect_result" | python3 -c "import sys,json; print(json.load(sys.stdin)['account']['id'])" 2>/dev/null || echo "")
job_id=$(echo "$connect_result" | python3 -c "import sys,json; d=json.load(sys.stdin); sj=d.get('syncJob',{}); print(sj.get('jobId', sj.get('id','')))" 2>/dev/null || echo "")

if [ -n "$account_id" ] && [ -n "$job_id" ]; then
  _PASS=$((_PASS + 1))
  echo "  ✓ Account created (id: $account_id) with sync job (id: $job_id)"
else
  _FAIL=$((_FAIL + 1))
  echo "  ✗ Account creation failed: $connect_result"
  print_summary
  exit 1
fi

# 3. Poll sync until completed
echo "  Step 3: Polling sync (up to 90s)..."
sync_result=$(poll_sync "$account_id" "$job_id" "$USER_ID" 90 3)
if [ $? -eq 0 ]; then
  _PASS=$((_PASS + 1))
  echo "  ✓ Post sync completed"
else
  _FAIL=$((_FAIL + 1))
  echo "  ✗ Post sync failed or timed out"
  print_summary
  exit 1
fi

# 4. Verify posts
echo "  Step 4: Verify posts..."
posts_result=$(curl -sf "${BASE_URL}/api/test/posts?accountId=${account_id}" \
  -H "X-Test-User-Id: ${USER_ID}")

post_count=$(echo "$posts_result" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['posts']))" 2>/dev/null || echo "0")
assert_true "At least 1 post synced (got $post_count)" "[ $post_count -ge 1 ]"

# Check post has expected fields
has_fields=$(echo "$posts_result" | python3 -c "
import sys,json
posts = json.load(sys.stdin)['posts']
if posts:
    p = posts[0]
    has = all(k in p for k in ['tiktokId','description'])
    print('true' if has else 'false')
else:
    print('false')
" 2>/dev/null || echo "false")
assert_true "Posts have expected fields (tiktokId, description)" "[ '$has_fields' = 'true' ]"

# 5. Comment sync
echo "  Step 5: Comment sync..."
comment_sync=$(curl -sf -X POST "${BASE_URL}/api/accounts/${account_id}/sync/comments" \
  -H "Content-Type: application/json" \
  -H "X-Test-User-Id: ${USER_ID}" \
  -d "{\"mode\":\"top_performers\",\"topCount\":1,\"maxPerPost\":5}")

comment_job_id=$(echo "$comment_sync" | python3 -c "import sys,json; print(json.load(sys.stdin)['jobId'])" 2>/dev/null || echo "")

if [ -n "$comment_job_id" ]; then
  _PASS=$((_PASS + 1))
  echo "  ✓ Comment sync started (job: $comment_job_id)"

  echo "  Step 6: Polling comment sync (up to 90s)..."
  comment_result=$(poll_sync "$account_id" "$comment_job_id" "$USER_ID" 90 3)
  if [ $? -eq 0 ]; then
    _PASS=$((_PASS + 1))
    echo "  ✓ Comment sync completed"
  else
    _FAIL=$((_FAIL + 1))
    echo "  ✗ Comment sync failed or timed out"
  fi

  # Verify comments
  posts_with_comments=$(curl -sf "${BASE_URL}/api/test/posts?accountId=${account_id}" \
    -H "X-Test-User-Id: ${USER_ID}")
  comment_count=$(echo "$posts_with_comments" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['comments']))" 2>/dev/null || echo "0")
  assert_true "Comments synced (got $comment_count)" "[ $comment_count -ge 1 ]"
else
  _FAIL=$((_FAIL + 1))
  echo "  ✗ Comment sync failed to start"
fi

# 7. Credit accounting
echo "  Step 7: Verify credit accounting..."
state=$(get_state "$USER_ID")
balance=$(echo "$state" | python3 -c "import sys,json; print(json.load(sys.stdin)['balance'])" 2>/dev/null || echo "500")
assert_true "Credits deducted from 500 (now $balance)" "[ $balance -lt 500 ]"

# 8. Profile refresh
echo "  Step 8: Profile refresh..."
refresh=$(curl -sf -X POST "${BASE_URL}/api/accounts/${account_id}/refresh-profile" \
  -H "X-Test-User-Id: ${USER_ID}")

refresh_ok=$(echo "$refresh" | python3 -c "import sys,json; print('yes' if json.load(sys.stdin).get('success') else 'no')" 2>/dev/null || echo "no")
assert_true "Profile refresh succeeded" "[ '$refresh_ok' = 'yes' ]"

# 9. Cleanup — disconnect account
echo "  Step 9: Cleanup..."
curl -sf -X DELETE "${BASE_URL}/api/accounts/${account_id}" \
  -H "X-Test-User-Id: ${USER_ID}" > /dev/null 2>&1 || true

print_summary
