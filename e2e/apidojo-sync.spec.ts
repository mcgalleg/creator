import { test, expect } from "@playwright/test";

/**
 * ApiDojo Migration E2E Verification
 *
 * Tests the full sync pipeline end-to-end with real Apify ApiDojo actors.
 * Runs sequentially sharing a single TikTok account through the full lifecycle:
 * preview → connect → post sync → comment sync → full sync → profile refresh → cleanup
 *
 * Cost per run: ~5-10 credits, ~$0.005 in Apify costs.
 *
 * Prerequisites:
 *   1. BYPASS_AUTH=true in .env.local
 *   2. Seed test user: npx tsx scripts/seed-test-user.ts
 *   3. Dev server running or auto-started by Playwright
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3000";
const TEST_USER_ID = "test_user_123";
const TEST_USERNAME = "alonderzz";

// Shared state across sequential tests
let accountId: number;
let firstPostTiktokId: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resetCredits(balance: number, userId: string = TEST_USER_ID) {
  const res = await fetch(`${BASE_URL}/api/test/reset-credits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, balance }),
  });
  return res.json();
}

async function getTestState(userId: string = TEST_USER_ID) {
  const res = await fetch(`${BASE_URL}/api/test/state?userId=${userId}`);
  return res.json();
}

async function getPostsAndComments(accountIdParam: number) {
  const res = await fetch(
    `${BASE_URL}/api/test/posts?accountId=${accountIdParam}`
  );
  return res.json();
}

/**
 * Poll a sync job until completed or failed, with timeout.
 * Uses the GET /api/accounts/{id}/sync?jobId={jid} endpoint which
 * triggers the polling fallback (processes results if Apify finished).
 */
async function pollSyncCompletion(
  request: import("@playwright/test").APIRequestContext,
  acctId: number,
  jobId: number,
  timeoutMs = 90_000
): Promise<{
  job: Record<string, unknown>;
  apifyStatus?: Record<string, unknown>;
}> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await request.get(
      `/api/accounts/${acctId}/sync?jobId=${jobId}`
    );
    expect(res.ok()).toBeTruthy();

    const data = await res.json();
    const status = data.job?.status;

    if (status === "completed" || status === "failed") {
      return data;
    }

    // Wait 3 seconds before polling again
    await new Promise((r) => setTimeout(r, 3_000));
  }

  throw new Error(
    `Sync job ${jobId} did not complete within ${timeoutMs / 1000}s`
  );
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

test.describe.serial("ApiDojo sync pipeline", () => {
  test.beforeAll(async () => {
    // Reset credits to 500
    await resetCredits(500);

    // Clean up any existing accounts for the test user
    const state = await getTestState();
    if (state.accounts && state.accounts.length > 0) {
      for (const acc of state.accounts) {
        await fetch(`${BASE_URL}/api/accounts/${acc.id}`, {
          method: "DELETE",
          headers: { "X-Test-User-Id": TEST_USER_ID },
        });
      }
    }
  });

  // ─── Test 1: Preview validates username via both ApiDojo actors ──────────

  test("preview validates username via both ApiDojo actors", async ({
    request,
  }) => {
    const response = await request.get(
      `/api/tiktok/preview?username=${TEST_USERNAME}`
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Profile basics
    expect(data.profile).toBeTruthy();
    expect(data.profile.username).toBe(TEST_USERNAME);
    expect(data.profile.followerCount).toBeGreaterThan(0);
    expect(data.profile.videoCount).toBeGreaterThan(0);

    // likesCount > 0 proves User Scraper ran (Profile Scraper alone doesn't provide likes)
    expect(data.profile.likesCount).toBeGreaterThan(0);

    // New User Scraper fields (may be string or undefined)
    if (data.profile.bioUrl !== undefined) {
      expect(typeof data.profile.bioUrl).toBe("string");
    }
    if (data.profile.profileCategory !== undefined) {
      expect(typeof data.profile.profileCategory).toBe("string");
    }

    // Cost estimates
    expect(data.costEstimates).toBeTruthy();
    expect(data.costEstimates.profileOnly).toBe(0);
    expect(data.costEstimates.profilePosts).toBeGreaterThan(0);
    expect(data.costEstimates.profilePostsComments).toBeGreaterThan(
      data.costEstimates.profilePosts
    );
  });

  // ─── Test 2: Connect account stores new profile fields ──────────────────

  test("connect account stores new profile fields", async ({ request }) => {
    const response = await request.post("/api/accounts", {
      data: {
        username: TEST_USERNAME,
        importOption: "profile_only",
      },
    });
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Save accountId for subsequent tests
    accountId = data.account.id;
    expect(accountId).toBeGreaterThan(0);

    expect(data.account.username).toBe(TEST_USERNAME);

    // likesCount persisted from User Scraper data
    expect(data.account.likesCount).toBeGreaterThan(0);

    // Verify account in DB
    const state = await getTestState();
    const dbAccount = state.accounts.find(
      (a: { id: number }) => a.id === accountId
    );
    expect(dbAccount).toBeTruthy();
  });

  // ─── Test 3: Post sync with field mapping verification ──────────────────

  test("post sync with field mapping verification", async ({ request }) => {
    // Trigger post sync with 3 posts
    const syncResponse = await request.post(
      `/api/accounts/${accountId}/sync`,
      {
        data: { postsLimit: 3 },
      }
    );
    expect(syncResponse.ok()).toBeTruthy();

    const syncData = await syncResponse.json();
    const jobId = syncData.jobId;
    expect(jobId).toBeGreaterThan(0);

    // Poll until completed
    const result = await pollSyncCompletion(request, accountId, jobId);

    // Sync job assertions
    expect(result.job.status).toBe("completed");
    expect(result.job.postsCount).toBe(3);
    expect(result.job.creditsUsed).toBeGreaterThan(0);

    // Inspect DB for field mappings
    const { posts: dbPosts } = await getPostsAndComments(accountId);
    expect(dbPosts).toHaveLength(3);

    for (const post of dbPosts) {
      // Core fields
      expect(post.tiktokId).toBeTruthy();
      expect(post.description).toBeTruthy(); // mapped from ApiDojo `title`
      expect(post.likes).toBeGreaterThanOrEqual(0);
      expect(post.plays).toBeGreaterThanOrEqual(0);
      expect(post.shares).toBeGreaterThanOrEqual(0);
      expect(post.saves).toBeGreaterThanOrEqual(0);

      // videoUrl mapped from postPage
      expect(post.videoUrl).toContain("tiktok.com");

      // duration from video.duration
      expect(post.duration).toBeGreaterThan(0);

      // thumbnailUrl from video.cover
      expect(post.thumbnailUrl).toBeTruthy();

      // postedAt from uploadedAtFormatted
      expect(new Date(post.postedAt).getTime()).not.toBeNaN();
    }

    // New ApiDojo columns: at least one post should have non-null new fields
    const hasHashtags = dbPosts.some(
      (p: { hashtags: string[] | null }) =>
        p.hashtags && p.hashtags.length > 0
    );
    const hasSongTitle = dbPosts.some(
      (p: { songTitle: string | null }) => p.songTitle
    );
    const hasVideoDirectUrl = dbPosts.some(
      (p: { videoDirectUrl: string | null }) => p.videoDirectUrl
    );
    expect(hasHashtags || hasSongTitle || hasVideoDirectUrl).toBeTruthy();

    // Save first post tiktokId for comment sync test
    firstPostTiktokId = dbPosts[0].tiktokId;

    // Profile should be updated from channel.* data
    const state = await getTestState();
    const updatedAccount = state.accounts.find(
      (a: { id: number }) => a.id === accountId
    );
    expect(updatedAccount.displayName).toBeTruthy();
    expect(updatedAccount.followerCount).toBeGreaterThan(0);
    expect(updatedAccount.videoCount).toBeGreaterThan(0);
  });

  // ─── Test 4: Comment sync with awemeId mapping ──────────────────────────

  test("comment sync with awemeId mapping", async ({ request }) => {
    // Trigger comment sync for the first post
    const syncResponse = await request.post(
      `/api/accounts/${accountId}/sync/comments`,
      {
        data: {
          mode: "selection",
          selectedPostIds: [firstPostTiktokId],
          maxPerPost: 5,
        },
      }
    );
    expect(syncResponse.ok()).toBeTruthy();

    const syncData = await syncResponse.json();
    const jobId = syncData.jobId;
    expect(jobId).toBeGreaterThan(0);

    // Poll until completed
    const result = await pollSyncCompletion(request, accountId, jobId);
    expect(result.job.status).toBe("completed");

    // Inspect comments in DB
    const { comments: dbComments } = await getPostsAndComments(accountId);
    expect(dbComments.length).toBeGreaterThanOrEqual(1);

    for (const comment of dbComments) {
      // Core fields
      expect(comment.tiktokId).toBeTruthy(); // from ApiDojo `id`, not `cid`
      expect(comment.text).toBeTruthy();
      expect(comment.authorUsername).toBeTruthy();

      // likes from likeCount, not diggCount
      expect(comment.likes).toBeGreaterThanOrEqual(0);

      // postedAt from ISO createdAt, not unix timestamp
      expect(new Date(comment.postedAt).getTime()).not.toBeNaN();

      // New columns
      expect(comment.replyCount).toBeGreaterThanOrEqual(0);
      expect(typeof comment.isAuthorLiked).toBe("boolean");
    }

    // At least one comment should have new fields populated
    const hasLanguage = dbComments.some(
      (c: { commentLanguage: string | null }) => c.commentLanguage
    );
    const hasRegion = dbComments.some(
      (c: { authorRegion: string | null }) => c.authorRegion
    );
    expect(hasLanguage || hasRegion).toBeTruthy();
  });

  // ─── Test 5: Full sync triggers two-phase (posts then auto-comments) ────

  test("full sync triggers two-phase (posts then auto-comments)", async ({
    request,
  }) => {
    // Trigger full sync with 2 posts and 3 comments per post
    const syncResponse = await request.post(
      `/api/accounts/${accountId}/sync`,
      {
        data: {
          postsLimit: 2,
          includeComments: true,
          maxCommentsPerPost: 3,
        },
      }
    );
    expect(syncResponse.ok()).toBeTruthy();

    const syncData = await syncResponse.json();
    const postJobId = syncData.jobId;
    expect(postJobId).toBeGreaterThan(0);

    // Poll post job until completed
    const postResult = await pollSyncCompletion(request, accountId, postJobId);
    expect(postResult.job.status).toBe("completed");
    expect(
      (postResult.job.postsCount as number)
    ).toBeGreaterThanOrEqual(1);

    // Post sync creditsUsed should reflect posts only (no comments)
    expect(
      (postResult.job.creditsUsed as number)
    ).toBeGreaterThan(0);

    // Wait a moment for the auto-triggered comment job to be created
    await new Promise((r) => setTimeout(r, 2_000));

    // Find the auto-triggered comment job via sync data
    const syncDataRes = await request.get(
      `/api/accounts/${accountId}/sync`
    );
    expect(syncDataRes.ok()).toBeTruthy();
    const allSyncData = await syncDataRes.json();

    // Look in both activeJobs and recentJobs for the comment job
    const allJobs = [
      ...(allSyncData.activeJobs || []),
      ...(allSyncData.recentJobs || []),
    ];
    const commentJob = allJobs.find(
      (j: { type: string; id: number }) =>
        j.type === "comments" && j.id !== postJobId
    );
    expect(commentJob).toBeTruthy();

    // If the comment job is still running, poll until completed
    if (
      commentJob.status === "pending" ||
      commentJob.status === "running"
    ) {
      const commentResult = await pollSyncCompletion(
        request,
        accountId,
        commentJob.id
      );
      expect(commentResult.job.status).toBe("completed");
      expect(
        (commentResult.job.commentsCount as number)
      ).toBeGreaterThan(0);
    } else {
      // Already completed
      expect(commentJob.status).toBe("completed");
      expect(commentJob.commentsCount).toBeGreaterThan(0);
    }
  });

  // ─── Test 6: Credit accounting is correct ───────────────────────────────

  test("credit accounting is correct", async () => {
    const state = await getTestState();

    // Credits were consumed from the starting 500
    expect(state.balance).toBeLessThan(500);
    expect(state.balance).toBeGreaterThan(0);

    const transactions = state.recentTransactions;

    // Should have sync_posts transactions
    const postTx = transactions.filter(
      (t: { type: string }) => t.type === "sync_posts"
    );
    expect(postTx.length).toBeGreaterThan(0);

    // Should have sync_comments transactions
    const commentTx = transactions.filter(
      (t: { type: string }) => t.type === "sync_comments"
    );
    expect(commentTx.length).toBeGreaterThan(0);

    // Every credit_hold (negative) should have a corresponding settlement:
    // either a refund (positive) or a sync_posts/sync_comments debit
    const holds = transactions.filter(
      (t: { type: string; amount: number }) =>
        t.type === "credit_hold" && t.amount < 0
    );
    const refunds = transactions.filter(
      (t: { type: string; amount: number }) =>
        t.type === "refund" && t.amount > 0
    );
    const debits = transactions.filter(
      (t: { type: string; amount: number }) =>
        (t.type === "sync_posts" || t.type === "sync_comments") &&
        t.amount < 0
    );

    // Each hold should be settled: total hold + total refund + total debit ≈ net spend
    // Simple check: number of holds should equal number of (refunds + debits)
    // since each hold triggers exactly one settlement (refund or debit+partial-refund)
    const settlements = refunds.length + debits.length;
    expect(settlements).toBeGreaterThanOrEqual(holds.length);
  });

  // ─── Test 7: Profile refresh stores bioUrl and profileCategory ──────────

  test("profile refresh stores bioUrl and profileCategory", async ({
    request,
  }) => {
    const response = await request.post(
      `/api/accounts/${accountId}/refresh-profile`
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    expect(data.profile).toBeTruthy();
    expect(data.profile.likesCount).toBeGreaterThan(0);

    // New User Scraper fields
    if (data.profile.bioUrl !== undefined) {
      expect(typeof data.profile.bioUrl).toBe("string");
    }
    if (data.profile.profileCategory !== undefined) {
      expect(typeof data.profile.profileCategory).toBe("string");
    }
  });

  // ─── Teardown ───────────────────────────────────────────────────────────

  test.afterAll(async () => {
    // Delete the test account
    if (accountId) {
      await fetch(`${BASE_URL}/api/accounts/${accountId}`, {
        method: "DELETE",
        headers: { "X-Test-User-Id": TEST_USER_ID },
      });
    }

    // Reset credits back to 1000
    await resetCredits(1000);
  });
});
