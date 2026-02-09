import { test, expect } from "@playwright/test";

/**
 * Trial flow E2E tests.
 *
 * These tests run with BYPASS_AUTH=true so no Clerk sign-in is needed.
 * The test user (test_user_123) is used automatically.
 *
 * Prerequisites:
 *   1. BYPASS_AUTH=true in .env.local
 *   2. Seed test user: npx tsx scripts/seed-test-user.ts
 *   3. Dev server running: npm run dev
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3000";
const TEST_USER_ID = "test_user_123";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Manipulate trial state via test API.
 */
async function setTrialState(
  action: "start" | "expire" | "expire-and-downgrade" | "reset",
  userId: string = TEST_USER_ID
) {
  const res = await fetch(`${BASE_URL}/api/test/trial`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, userId }),
  });
  const data = await res.json();
  console.log(`Trial ${action}:`, data);
  return data;
}

/**
 * Get trial state from test API.
 */
async function getTrialState(userId: string = TEST_USER_ID) {
  const res = await fetch(`${BASE_URL}/api/test/trial?userId=${userId}`);
  return res.json();
}

/**
 * Reset subscription to free via test API.
 */
async function resetSubscription(userId: string = TEST_USER_ID) {
  const res = await fetch(`${BASE_URL}/api/test/reset-subscription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

/**
 * Navigate to dashboard, handling onboarding if it appears.
 */
async function goToDashboard(page: import("@playwright/test").Page) {
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  // Handle onboarding gate if it appears
  const skipButton = page.locator('text="Skip for now"');
  if (await skipButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await skipButton.click();
    await page.waitForLoadState("networkidle");
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("14-day reverse trial flow", () => {
  // Reset state before each test to ensure isolation
  test.beforeEach(async () => {
    await setTrialState("reset");
  });

  // Cleanup after all tests
  test.afterAll(async () => {
    await setTrialState("reset");
  });

  test("trial user sees Pro Trial banner and has full feature access", async ({
    page,
  }) => {
    // Start a fresh trial
    await setTrialState("start");

    // Navigate to dashboard
    await goToDashboard(page);

    // ── Trial Banner Assertions ──
    const trialBadge = page.locator("text=Pro Trial");
    await expect(trialBadge).toBeVisible({ timeout: 10_000 });

    // Should see "days remaining" text
    await expect(page.locator("text=days remaining")).toBeVisible();

    // Should see "Upgrade Now" button in the banner
    const upgradeBannerLink = page
      .locator('[href="/pricing"]')
      .filter({ hasText: "Upgrade Now" })
      .first();
    await expect(upgradeBannerLink).toBeVisible();

    // ── Feature Access ──
    // On desktop/tablet: Draw tab should NOT show "Upgrade" badge (trial = full access)
    const drawTab = page.locator('[data-value="draw"]').first();
    if (await drawTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const upgradeBadge = drawTab.locator("text=Upgrade");
      await expect(upgradeBadge).not.toBeVisible();
    }

    // Chat tab should also be accessible
    const chatTab = page.locator('[data-value="chat"]').first();
    if (await chatTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const upgradeBadge = chatTab.locator("text=Upgrade");
      await expect(upgradeBadge).not.toBeVisible();
    }

    // ── Settings Page ──
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Should show Pro tier badge
    const proBadge = page.locator('text="Pro"').first();
    await expect(proBadge).toBeVisible();

    // Should see "Pro Trial Active" in subscription manager
    await expect(page.locator("text=Pro Trial Active")).toBeVisible();

    // Should NOT see Cancel button during trial
    await expect(page.locator('text="Cancel Subscription"')).not.toBeVisible();
  });

  test("expired trial shows free tier with locked features", async ({
    page,
  }) => {
    // Expire trial and immediately downgrade (simulates cron completion)
    await setTrialState("expire-and-downgrade");

    await goToDashboard(page);

    // ── Trial Banner Gone ──
    const trialBadge = page.locator("text=Pro Trial");
    await expect(trialBadge).not.toBeVisible();

    // ── Features Locked ──
    const drawTab = page.locator('[data-value="draw"]').first();
    if (await drawTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const upgradeBadge = drawTab.locator("text=Upgrade");
      await expect(upgradeBadge).toBeVisible();
    }

    const chatTab = page.locator('[data-value="chat"]').first();
    if (await chatTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const upgradeBadge = chatTab.locator("text=Upgrade");
      await expect(upgradeBadge).toBeVisible();
    }

    // ── Settings ──
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Should see Free tier
    const freeBadge = page.locator('text="Free"').first();
    await expect(freeBadge).toBeVisible({ timeout: 10_000 });

    // Should NOT see trial info
    await expect(page.locator("text=Pro Trial Active")).not.toBeVisible();

    // Should see "Upgrade Plan" button
    await expect(page.locator('text="Upgrade Plan"')).toBeVisible();
  });

  test("cron endpoint expires trials and downgrades users", async () => {
    // Start a trial then expire the date (but don't downgrade)
    // This simulates a user whose trial ended but the cron hasn't run yet
    await setTrialState("start");
    await setTrialState("expire");

    // Verify user is still on Pro (cron hasn't processed yet)
    const stateBefore = await getTrialState();
    expect(stateBefore.subscriptionTier).toBe("pro");
    expect(stateBefore.isOnTrial).toBe(false); // trialEndsAt is past

    // Hit the cron endpoint
    const cronRes = await fetch(`${BASE_URL}/api/cron/expire-trials`, {
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || "test-cron-secret"}`,
      },
    });
    const cronData = await cronRes.json();
    console.log("Cron result:", cronData);

    expect(cronData.expired).toBeGreaterThanOrEqual(1);

    // Verify user is now free
    const stateAfter = await getTrialState();
    expect(stateAfter.subscriptionTier).toBe("free");
  });

  test("subscription API returns trial state", async ({ page }) => {
    // Start a trial
    await setTrialState("start");

    // Query the subscription API
    const response = await page.request.get("/api/user/subscription");
    const data = await response.json();

    expect(data.subscriptionTier).toBe("pro");
    expect(data.trialEndsAt).toBeTruthy();
    expect(data.trialConverted).toBe(false);

    // Expire and downgrade
    await setTrialState("expire-and-downgrade");

    const response2 = await page.request.get("/api/user/subscription");
    const data2 = await response2.json();

    expect(data2.subscriptionTier).toBe("free");
    expect(data2.trialConverted).toBe(false);
  });

  test("pricing page shows updated tier structure", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // "Most Popular" badge should be visible (on Creator tier)
    await expect(page.locator("text=Most Popular")).toBeVisible();

    // Both paid tier prices should be visible
    await expect(page.locator("text=$14.99/mo")).toBeVisible();
    await expect(page.locator("text=$29.99/mo")).toBeVisible();

    // Canvas and AI features should be listed on paid tiers
    await expect(page.locator("text=Canvas Workspace").first()).toBeVisible();
    await expect(page.locator("text=AI Analytics Assistant").first()).toBeVisible();
  });
});
