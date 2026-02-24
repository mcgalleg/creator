import { test, expect } from "@playwright/test";

/**
 * Pricing page structure & billing toggle E2E tests.
 *
 * Validates the 5-tier pricing page renders correctly with monthly/annual toggle,
 * correct prices, feature limits, and checkout URL product IDs.
 *
 * Prerequisites:
 *   1. BYPASS_AUTH=true in .env.local
 *   2. Dev server running: npm run dev
 */

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Pricing page structure", () => {
  test("all 5 tiers render with correct monthly prices", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Verify all 5 tier names
    await expect(page.locator("text=Free").first()).toBeVisible();
    await expect(page.locator("text=Creator").first()).toBeVisible();
    await expect(page.locator("text=Pro").first()).toBeVisible();
    await expect(page.locator("text=Agency").first()).toBeVisible();
    await expect(page.locator("text=MCP Apps").first()).toBeVisible();

    // Verify monthly prices
    await expect(page.locator("text=$0").first()).toBeVisible();
    await expect(page.locator("text=$14.99/mo")).toBeVisible();
    await expect(page.locator("text=$29.99/mo")).toBeVisible();
    await expect(page.locator("text=$59.99/mo")).toBeVisible();
    await expect(page.locator("text=Pay as you go")).toBeVisible();
  });

  test("billing toggle switches to annual prices with Save 20% badge", async ({
    page,
  }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Click Annual toggle
    await page.locator("button", { hasText: "Annual" }).click();

    // Verify annual prices
    await expect(page.locator("text=$11.99/mo")).toBeVisible();
    await expect(page.locator("text=$23.99/mo")).toBeVisible();
    await expect(page.locator("text=$47.99/mo")).toBeVisible();

    // Verify "Save 20%" badge
    await expect(page.locator("text=Save 20%")).toBeVisible();

    // Verify "billed annually" text on paid tiers
    const billedAnnuallyTexts = page.locator("text=billed annually");
    await expect(billedAnnuallyTexts).toHaveCount(3); // Creator, Pro, Agency
  });

  test("toggle back to monthly reverts prices", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Switch to annual
    await page.locator("button", { hasText: "Annual" }).click();
    await expect(page.locator("text=$11.99/mo")).toBeVisible();

    // Switch back to monthly
    await page.locator("button", { hasText: "Monthly" }).click();

    // Monthly prices should be back
    await expect(page.locator("text=$14.99/mo")).toBeVisible();
    await expect(page.locator("text=$29.99/mo")).toBeVisible();
    await expect(page.locator("text=$59.99/mo")).toBeVisible();

    // Save 20% badge should be gone
    await expect(page.locator("text=Save 20%")).not.toBeVisible();

    // "billed annually" text should be gone
    await expect(page.locator("text=billed annually")).not.toBeVisible();
  });

  test("Free tier shows correct limits", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Free tier: 50 sync credits, 100K AI tokens, 1 connected account
    await expect(page.locator("text=50 sync credits/month")).toBeVisible();
    await expect(page.locator("text=100K AI tokens/month")).toBeVisible();
    await expect(page.locator("text=1 connected account")).toBeVisible();
  });

  test("Agency tier shows correct limits", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Agency tier: 4,000 sync credits, 10M AI tokens, 50 connected accounts
    await expect(page.locator("text=4,000 sync credits/month")).toBeVisible();
    await expect(page.locator("text=10M AI tokens/month")).toBeVisible();
    await expect(page.locator("text=50 connected accounts")).toBeVisible();
  });

  test("data purge note is visible", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator("text=60 days after cancellation, data is permanently deleted")
    ).toBeVisible();
  });

  test("checkout URLs contain correct product IDs for billing period", async ({
    page,
  }) => {
    // This test requires a signed-in user (subscribe links only show when authenticated)
    // When BYPASS_AUTH is not enabled, the page shows "Sign in to Subscribe" buttons instead of links
    const monthlyProId = process.env.NEXT_PUBLIC_POLAR_PRODUCT_PRO;
    const annualProId = process.env.NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_PRO;

    if (!monthlyProId || !annualProId) {
      test.skip();
      return;
    }

    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Check if subscribe links exist (user needs to be signed in)
    const subscribeLinks = page.locator('a:has-text("Subscribe")[href*="checkout"]');
    const hasLinks = await subscribeLinks.first().isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasLinks) {
      // User not signed in — skip this test
      test.skip();
      return;
    }

    // Monthly: Pro subscribe link should contain the monthly product ID
    // Pro is the 2nd subscribe link (Creator, Pro, Agency)
    const proLink = subscribeLinks.nth(1);
    await expect(proLink).toHaveAttribute("href", new RegExp(monthlyProId));

    // Switch to annual
    await page.locator("button", { hasText: "Annual" }).click();

    // Pro subscribe link should now contain the annual product ID
    const proLinkAnnual = subscribeLinks.nth(1);
    await expect(proLinkAnnual).toHaveAttribute("href", new RegExp(annualProId));
  });
});
