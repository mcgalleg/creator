import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";
import { Polar } from "@polar-sh/sdk";

// ─── Config ──────────────────────────────────────────────────────────────────

const E2E_EMAIL = process.env.E2E_CLERK_USER_EMAIL || "mike@penelopes.cafe";
// E2E_PASSWORD will be used when Clerk login flow is wired up
const E2E_PASSWORD = process.env.E2E_CLERK_USER_PASSWORD!; // eslint-disable-line @typescript-eslint/no-unused-vars
const BASE_URL = "http://localhost:3000";

// ─── Subscription Cleanup ────────────────────────────────────────────────────

/**
 * Revoke all active Polar subscriptions for the test user and reset the
 * local DB tier to "free". This ensures the test suite is idempotent —
 * it can be run repeatedly without "You already have an active subscription"
 * errors from Polar.
 */
async function resetTestUserToFree() {
  const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: "sandbox",
  });

  // 1. Find the Polar customer by email
  const customerPages = await polar.customers.list({ email: E2E_EMAIL, limit: 1 });
  let clerkUserId: string | null = null;

  for await (const page of customerPages) {
    for (const customer of page.result.items) {
      clerkUserId = customer.externalId ?? null;

      // 2. List their active subscriptions
      const subPages = await polar.subscriptions.list({
        customerId: customer.id,
        active: true,
        limit: 100,
      });

      for await (const subPage of subPages) {
        for (const sub of subPage.result.items) {
          console.log(`Revoking Polar subscription ${sub.id} (product: ${sub.productId})`);
          await polar.subscriptions.revoke({ id: sub.id });
        }
      }
    }
  }

  // 3. Reset the local DB tier via the test endpoint
  if (clerkUserId) {
    const res = await fetch(`${BASE_URL}/api/test/reset-subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: clerkUserId }),
    });
    const data = await res.json();
    console.log("DB subscription reset:", data);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fill Polar sandbox checkout with test card details.
 *
 * Polar's checkout page structure:
 * - Email field (usually pre-filled from customerEmail param)
 * - Stripe Elements iframe containing: card number, expiry, CVC
 * - Cardholder name (required, outside iframe)
 * - Billing address country dropdown (required)
 * - "Subscribe now" button
 */
async function fillPolarCheckout(page: import("@playwright/test").Page) {
  // Wait for the checkout form to render
  await page.getByText("Subscribe now").waitFor({ timeout: 30_000 });

  // 1. Fill card details if needed
  //    Payment method tabs are inside a Stripe iframe. If a saved card exists,
  //    it's auto-selected and no card input is needed.
  const stripeFrame = page.frameLocator("iframe").first();
  const cardNumberField = stripeFrame.getByLabel("Card number");

  // Try to find card number field — if it's not visible, a saved card is being used
  const needsCardInput = await cardNumberField.isVisible({ timeout: 10_000 }).catch(() => false);

  if (needsCardInput) {
    await cardNumberField.fill("4242424242424242");

    const expiry = stripeFrame.getByLabel(/Expiration date/);
    await expiry.fill("12 / 30");

    const cvc = stripeFrame.getByLabel("Security code");
    await cvc.fill("123");
  }

  // 2. Fill cardholder name if visible and empty
  const cardholderName = page.getByLabel("Cardholder name");
  if (await cardholderName.isVisible({ timeout: 2_000 }).catch(() => false)) {
    const currentValue = await cardholderName.inputValue();
    if (!currentValue) {
      await cardholderName.fill("E2E Test User");
    }
  }

  // 3. Fill billing address if country dropdown shows "Country" (not yet selected)
  const countryDropdown = page.getByRole("combobox").filter({ hasText: /^Country$/ });
  if (await countryDropdown.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await countryDropdown.click();
    await page.getByRole("option", { name: /United States/ }).click();

    // 4. Fill expanded US address fields
    await page.getByPlaceholder("Line 1").fill("123 Test Street");
    await page.getByPlaceholder("Postal code").fill("90210");
    await page.getByPlaceholder("City").fill("Beverly Hills");

    const stateDropdown = page.getByRole("combobox").filter({ hasText: /^State$/ });
    await stateDropdown.click();
    await page.getByRole("option", { name: /California/ }).click();
  }

  // 5. Wait for Stripe to validate card details, then submit
  await page.waitForTimeout(2_000);

  const subscribeButton = page.getByRole("button", { name: "Subscribe now" });
  await subscribeButton.scrollIntoViewIfNeeded();
  await subscribeButton.click();

  // Wait for the button to enter a loading/processing state
  // (Polar disables it or shows a spinner during payment processing)
  await expect(subscribeButton).not.toBeVisible({ timeout: 30_000 }).catch(() => {
    // If button is still visible after 30s, payment may have failed — continue anyway
  });
}

// ─── Sign-in Helper ──────────────────────────────────────────────────────────

/**
 * Navigate to a public page, sign in via Clerk, and wait for the session
 * to be fully established before continuing.
 *
 * Uses the emailAddress approach which creates a backend sign-in token
 * (ticket strategy) — more reliable than password strategy for E2E tests.
 */
async function signInAsTestUser(page: import("@playwright/test").Page) {
  // Navigate to a public page that loads Clerk
  await page.goto("/pricing");
  await page.waitForLoadState("networkidle");

  // Sign in using backend token (ticket strategy)
  // This internally: fetches user by email → creates sign-in token → calls setActive → waits for user
  await clerk.signIn({
    page,
    emailAddress: E2E_EMAIL,
  });

  // Handle onboarding gate — new users see onboarding before any dashboard content
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  const skipButton = page.locator('text="Skip for now"');
  if (await skipButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await skipButton.click();
    await page.waitForLoadState("networkidle");
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Free to Pro upgrade flow", () => {
  // Reset test user to free tier before all tests (idempotent cleanup)
  test.beforeAll(async () => {
    await resetTestUserToFree();
  });

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test("user on free tier sees correct state on settings page", async ({
    page,
  }) => {
    await signInAsTestUser(page);

    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Subscription manager should show Free tier
    const subscriptionCard = page.locator("text=Subscription").first();
    await expect(subscriptionCard).toBeVisible();

    const freeBadge = page.locator('text="Free"').first();
    await expect(freeBadge).toBeVisible();

    // Should show "Upgrade Plan" button (not "Change Plan")
    const upgradeButton = page.locator('text="Upgrade Plan"');
    await expect(upgradeButton).toBeVisible();

    // Should NOT show "Manage Subscription" (that's for paid users)
    const manageButton = page.locator('text="Manage Subscription"');
    await expect(manageButton).not.toBeVisible();
  });

  test("pricing page shows subscribe buttons for signed-in user", async ({
    page,
  }) => {
    await signInAsTestUser(page);

    // Already on /pricing from signIn — reload to pick up signed-in state
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Should see all three tier cards
    await expect(page.locator("text=Simple, transparent pricing")).toBeVisible();

    // Pro card should have "Most Popular" badge
    await expect(page.locator("text=Most Popular")).toBeVisible();

    // Subscribe buttons should be visible (not "Sign in to Subscribe")
    const subscribeButtons = page.locator('a:has-text("Subscribe")');
    await expect(subscribeButtons.first()).toBeVisible();

    // "Sign in to Subscribe" should NOT be visible (user is signed in)
    await expect(
      page.locator('button:has-text("Sign in to Subscribe")')
    ).not.toBeVisible();

    // "Back to Dashboard" link should be visible
    await expect(page.locator("text=Back to Dashboard")).toBeVisible();
  });

  test("complete Pro subscription checkout", async ({ page }) => {
    await signInAsTestUser(page);

    // Go to pricing page (already there from signIn, but reload for fresh state)
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Find the Pro tier's Subscribe button
    // The Pro card is highlighted (border-primary) and its <a> contains the Pro product ID
    const proSubscribeLink = page.locator(
      'a:has-text("Subscribe")[href*="checkout"]'
    );

    // There should be 2 subscribe links (Basic + Pro) — Pro is second
    const proLink = proSubscribeLink.nth(1);
    await expect(proLink).toBeVisible();

    // Click and wait for navigation to Polar checkout
    await proLink.click();
    await page.waitForURL(/sandbox\.polar\.sh/, { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    // We should now be on Polar's checkout page
    const currentUrl = page.url();
    console.log("Checkout URL:", currentUrl);

    // Fill in test card details and submit
    await fillPolarCheckout(page);

    // Wait for redirect back to our app after successful payment
    // Polar redirects via the ngrok URL — free ngrok shows an interstitial
    // that we need to click through
    await page.waitForURL(/ngrok|localhost|dashboard/, { timeout: 60_000 });

    // Handle ngrok interstitial page if it appears
    const visitSiteButton = page.locator('button:has-text("Visit Site"), a:has-text("Visit Site")');
    if (await visitSiteButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await visitSiteButton.click();
      await page.waitForURL("**/dashboard/settings**", { timeout: 30_000 });
    }
    const returnUrl = page.url();
    expect(returnUrl).toContain("checkout=success");

    console.log("Returned to:", returnUrl);

    // The subscription tier update depends on Polar sending a webhook
    // to /api/webhooks/polar via ngrok. Give it time to process, then
    // poll with reloads until the tier updates (or timeout).
    for (let attempt = 0; attempt < 6; attempt++) {
      await page.waitForTimeout(5_000);
      await page.goto("/dashboard/settings");
      await page.waitForLoadState("domcontentloaded");

      const proBadgeEarly = page.locator('text="Pro"').first();
      if (await proBadgeEarly.isVisible({ timeout: 3_000 }).catch(() => false)) {
        break;
      }
    }

    // Verify subscription is now Pro
    const proBadge = page.locator('text="Pro"').first();
    await expect(proBadge).toBeVisible({ timeout: 15_000 });

    // Should now show AI tokens allocation (Pro gets 2M)
    await expect(page.locator("text=AI tokens/month")).toBeVisible();

    // Should show sync credits allocation (Pro gets 500)
    await expect(page.locator("text=sync credits/month")).toBeVisible();

    // Should now show "Manage Subscription" button
    await expect(page.locator('text="Manage Subscription"')).toBeVisible();

    // Should show "Change Plan" instead of "Upgrade Plan"
    await expect(page.locator('text="Change Plan"')).toBeVisible();
  });
});
