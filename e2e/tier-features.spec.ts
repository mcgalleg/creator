import { test, expect } from "@playwright/test";

/**
 * Per-tier UI behavior E2E tests.
 *
 * Tests that each subscription tier shows the correct badge, credit allocations,
 * feature access, and UI elements on the dashboard and settings pages.
 *
 * Prerequisites:
 *   1. BYPASS_AUTH=true in .env.local
 *   2. Seed test users: npx tsx scripts/seed-test-users.ts
 *   3. Dev server running: npm run dev
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Set subscription state via test API.
 */
async function setSubscription(
  userId: string,
  action: string,
  tier?: string
) {
  const res = await fetch(`${BASE_URL}/api/test/subscription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, action, tier }),
  });
  return res.json();
}

/**
 * Reset credits to a specific value via test API.
 */
async function resetCredits(balance: number, userId: string) {
  const res = await fetch(`${BASE_URL}/api/test/reset-credits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, balance }),
  });
  return res.json();
}

/**
 * Navigate to dashboard, handling onboarding if it appears.
 */
async function goToDashboard(page: import("@playwright/test").Page) {
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  const skipButton = page.locator('text="Skip for now"');
  if (await skipButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await skipButton.click();
    await page.waitForLoadState("networkidle");
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Per-tier dashboard UI behavior", () => {
  test("Free user sees Free badge, Upgrade Plan, no Cancel", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "X-Test-User-Id": "test_user_free" });

    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Free badge visible
    const freeBadge = page.locator('text="Free"').first();
    await expect(freeBadge).toBeVisible({ timeout: 10_000 });

    // "Upgrade Plan" visible
    await expect(page.locator('text="Upgrade Plan"')).toBeVisible();

    // "Cancel Subscription" NOT visible
    await expect(page.locator('text="Cancel Subscription"')).not.toBeVisible();
  });

  test("Creator user sees Creator badge, 500 sync credits, Change Plan, Cancel", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "X-Test-User-Id": "test_user_basic" });

    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Creator badge visible
    const creatorBadge = page.locator('text="Creator"').first();
    await expect(creatorBadge).toBeVisible({ timeout: 10_000 });

    // 500 sync credits/month visible (use .first() as it appears in both subscription card and credit info)
    await expect(page.locator("text=500 sync credits/month").first()).toBeVisible();

    // "Change Plan" visible
    await expect(page.locator('text="Change Plan"')).toBeVisible();

    // "Cancel Subscription" visible
    await expect(page.locator('text="Cancel Subscription"')).toBeVisible();
  });

  test("Pro user sees Pro badge, 1,500 sync credits, canvas/chat accessible", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "X-Test-User-Id": "test_user_pro" });

    await goToDashboard(page);

    // Canvas/draw tab should NOT show "Upgrade" badge (Pro has full access)
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

    // Check settings page
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    const proBadge = page.locator('text="Pro"').first();
    await expect(proBadge).toBeVisible({ timeout: 10_000 });

    await expect(page.locator("text=1,500 sync credits/month").first()).toBeVisible();
  });

  test("Agency user sees Agency badge, 4,000 sync credits, 50 accounts", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "X-Test-User-Id": "test_user_agency" });

    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    const agencyBadge = page.locator('text="Agency"').first();
    await expect(agencyBadge).toBeVisible({ timeout: 10_000 });

    await expect(page.locator("text=4,000 sync credits/month").first()).toBeVisible();
    await expect(page.locator("text=50 connected accounts").first()).toBeVisible();
  });

  test("Free tier features are locked — draw/chat tabs show Upgrade badge", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "X-Test-User-Id": "test_user_free" });

    await goToDashboard(page);

    // Draw tab should show "Upgrade" badge for free users
    const drawTab = page.locator('[data-value="draw"]').first();
    if (await drawTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const upgradeBadge = drawTab.locator("text=Upgrade");
      await expect(upgradeBadge).toBeVisible();
    }

    // Chat tab should show "Upgrade" badge for free users
    const chatTab = page.locator('[data-value="chat"]').first();
    if (await chatTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const upgradeBadge = chatTab.locator("text=Upgrade");
      await expect(upgradeBadge).toBeVisible();
    }
  });

  test("low-credit amber threshold scales with tier", async ({ page }) => {
    const userId = "test_user_pro";

    // Set credits to 100 (< 10% of 1500) — should trigger amber badge
    await resetCredits(100, userId);

    await page.setExtraHTTPHeaders({ "X-Test-User-Id": userId });
    await goToDashboard(page);

    // Wait for credits to settle
    await page.waitForTimeout(3_000);

    // The sync credits badge should have amber styling when low
    const amberBadge = page.locator(".border-amber-500\\/30");
    await expect(amberBadge.first()).toBeVisible({ timeout: 10_000 });

    // Now set credits to 200 (> 10% of 1500) — should be normal
    await resetCredits(200, userId);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3_000);

    // Amber badge should NOT be visible
    await expect(amberBadge).not.toBeVisible();

    // Reset credits back to normal
    await setSubscription(userId, "set-tier", "pro");
  });
});
