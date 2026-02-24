import { test, expect } from "@playwright/test";

/**
 * Subscription lifecycle E2E tests.
 *
 * Tests state transitions: set-tier, cancel, data purge scheduling,
 * re-subscribe clearing purge, and the purge cron endpoint.
 *
 * Prerequisites:
 *   1. BYPASS_AUTH=true in .env.local
 *   2. Seed test users: npx tsx scripts/seed-test-users.ts
 *   3. Dev server running: npm run dev
 *   4. CRON_SECRET set in .env.local
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3000";
const TEST_USER_ID = "test_user_123";
const CRON_SECRET = process.env.CRON_SECRET || "test-cron-secret";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function setSubscription(
  action: string,
  tier?: string,
  userId: string = TEST_USER_ID
) {
  const res = await fetch(`${BASE_URL}/api/test/subscription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, action, tier }),
  });
  return res.json();
}

async function getSubscription(userId: string = TEST_USER_ID) {
  const res = await fetch(`${BASE_URL}/api/test/subscription?userId=${userId}`);
  return res.json();
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Subscription lifecycle", () => {
  // Reset to free tier before each test
  test.beforeEach(async () => {
    await setSubscription("reset");
  });

  test.afterAll(async () => {
    await setSubscription("reset");
  });

  test("set-tier to agency updates badge on settings page", async ({
    page,
  }) => {
    await setSubscription("set-tier", "agency");

    // Navigate to dashboard first to handle onboarding gate
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const skipButton = page.locator('text="Skip for now"');
    if (await skipButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForLoadState("networkidle");
    }

    // Now navigate to settings
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    const agencyBadge = page.locator('text="Agency"').first();
    await expect(agencyBadge).toBeVisible({ timeout: 10_000 });
  });

  test("cancel sets subscriptionExpiresAt and dataPurgeAt (60 days later)", async () => {
    // First set to pro
    await setSubscription("set-tier", "pro");

    // Cancel
    const cancelResult = await setSubscription("cancel");
    expect(cancelResult.success).toBe(true);
    expect(cancelResult.subscriptionExpiresAt).toBeTruthy();
    expect(cancelResult.dataPurgeAt).toBeTruthy();

    // Verify purge is ~60 days after expiry
    const expiresAt = new Date(cancelResult.subscriptionExpiresAt).getTime();
    const purgeAt = new Date(cancelResult.dataPurgeAt).getTime();
    const daysBetween = (purgeAt - expiresAt) / (24 * 60 * 60 * 1000);
    expect(daysBetween).toBeCloseTo(60, 0);
  });

  test("cancellation dialog shows 60-day purge warning", async ({ page }) => {
    await setSubscription("set-tier", "pro");

    // Navigate to dashboard first to handle onboarding gate
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const skipButton = page.locator('text="Skip for now"');
    if (await skipButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForLoadState("networkidle");
    }

    // Now navigate to settings
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Click Cancel Subscription button to open dialog
    await page.locator('text="Cancel Subscription"').click();

    // Verify dialog text mentions 60-day purge
    await expect(
      page.locator("text=permanently deleted 60 days after cancellation")
    ).toBeVisible({ timeout: 5_000 });
  });

  test("re-subscribe clears dataPurgeAt", async () => {
    // Set to pro, then cancel
    await setSubscription("set-tier", "pro");
    await setSubscription("cancel");

    // Verify purge is set
    const afterCancel = await getSubscription();
    expect(afterCancel.dataPurgeAt).toBeTruthy();

    // Re-subscribe to pro
    await setSubscription("set-tier", "pro");

    // Verify purge is cleared
    const afterResub = await getSubscription();
    expect(afterResub.dataPurgeAt).toBeNull();
  });

  test("data purge cron purges expired user data", async () => {
    // Set to pro first (to have some meaningful state)
    await setSubscription("set-tier", "pro");

    // Schedule purge for 1 hour ago
    await setSubscription("schedule-purge");

    // Verify dataPurgeAt is set
    const beforePurge = await getSubscription();
    expect(beforePurge.dataPurgeAt).toBeTruthy();

    // Hit the purge cron endpoint
    const cronRes = await fetch(`${BASE_URL}/api/cron/purge-data`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const cronData = await cronRes.json();
    console.log("Purge cron result:", cronData);
    expect(cronData.purged).toBeGreaterThanOrEqual(1);

    // Verify user is now free with 0 credits
    const afterPurge = await getSubscription();
    expect(afterPurge.subscriptionTier).toBe("free");
    expect(afterPurge.creditBalance).toBe(0);
    expect(afterPurge.dataPurgeAt).toBeNull();
  });
});
