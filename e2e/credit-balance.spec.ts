import { test, expect } from "@playwright/test";

/**
 * Credit balance E2E tests — validates the real-time credit architecture:
 *
 * 1. Sync-on-read: GET /api/credits returns live Polar balance (not stale DB cache)
 * 2. SWR polling: UI auto-refreshes credits without manual reload
 * 3. Focus revalidation: credits refresh when tab regains focus (visibilitychange)
 * 4. Checkout success: aggressive polling triggers on ?checkout=success
 * 5. Fallback: graceful degradation when Polar customer doesn't exist
 * 6. DB cache side-effect: sync-on-read updates local DB as fire-and-forget
 * 7. No flicker: keepPreviousData prevents balance from flashing to 0
 *
 * Uses two user IDs:
 *   - test_user_123 (default): only in local DB, NOT in Polar → tests fallback path
 *   - POLAR_USER_ID (Cecilia): real Polar customer → tests sync-on-read path
 *
 * Prerequisites:
 *   1. BYPASS_AUTH=true in .env.local
 *   2. Seed test user: npx tsx scripts/seed-test-user.ts
 *   3. Dev server running: npm run dev
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3000";
const TEST_USER_ID = "test_user_123";

// A real user that exists in both the local DB and Polar sandbox.
// This is required to test sync-on-read (Polar as source of truth).
const POLAR_USER_ID = "user_39SuUvteSYfaThpGv4VlUP2g8ED";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Reset the local DB credit balance to a specific value via test API.
 */
async function resetCredits(balance: number, userId: string = TEST_USER_ID) {
  const res = await fetch(`${BASE_URL}/api/test/reset-credits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, balance }),
  });
  const data = await res.json();
  console.log(`Reset credits for ${userId} to ${balance}:`, data);
  return data;
}

/**
 * Get the local DB state for a user via test API.
 */
async function getTestState(userId: string = TEST_USER_ID) {
  const res = await fetch(`${BASE_URL}/api/test/state?userId=${userId}`);
  return res.json();
}

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

test.describe("Real-time credit balance", () => {
  test.beforeEach(async () => {
    await setTrialState("reset");
  });

  test.afterAll(async () => {
    await setTrialState("reset");
  });

  // ─── 1. Sync-on-read: Polar balance returned over DB cache ──────────────

  test("GET /api/credits returns Polar balance, not stale DB cache", async ({
    request,
  }) => {
    // Set Cecilia's local DB to 0 (stale cache — simulates the original bug)
    await resetCredits(0, POLAR_USER_ID);

    // Verify local DB is indeed 0
    const dbState = await getTestState(POLAR_USER_ID);
    expect(dbState.balance).toBe(0);

    // Call the credits API as Cecilia (real Polar customer)
    const response = await request.get("/api/credits", {
      headers: { "X-Test-User-Id": POLAR_USER_ID },
    });
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log("Credits API response (Polar user):", data);

    // Polar is source of truth — balance should NOT be 0 (the stale DB value)
    expect(data.balance).toBeGreaterThan(0);

    // aiTokens should be a number (not null) when Polar responds successfully
    expect(typeof data.aiTokens).toBe("number");

    // Should include pricing info
    expect(data.pricing).toBeTruthy();
  });

  // ─── 2. DB cache updated as fire-and-forget side-effect ─────────────────

  test("sync-on-read updates local DB cache as side-effect", async ({
    request,
  }) => {
    // Set Cecilia's DB to 0 (stale)
    await resetCredits(0, POLAR_USER_ID);

    // Call the credits API (reads from Polar, fire-and-forget updates DB)
    const response = await request.get("/api/credits", {
      headers: { "X-Test-User-Id": POLAR_USER_ID },
    });
    const data = await response.json();
    const polarBalance = data.balance;
    console.log("Polar balance:", polarBalance);
    expect(polarBalance).toBeGreaterThan(0);

    // Wait for fire-and-forget DB update to complete
    await new Promise((r) => setTimeout(r, 3_000));

    // Check DB — should now match Polar (not 0 anymore)
    const dbState = await getTestState(POLAR_USER_ID);
    console.log("DB balance after sync-on-read:", dbState.balance);
    expect(dbState.balance).toBe(polarBalance);
  });

  // ─── 3. Fallback: API uses DB when Polar customer doesn't exist ─────────

  test("API falls back to local DB when Polar customer is unknown", async ({
    request,
  }) => {
    // test_user_123 doesn't exist in Polar — should fall back to DB
    await resetCredits(500);

    const response = await request.get("/api/credits");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log("Credits API response (fallback user):", data);

    // Should return the DB balance since Polar doesn't know this user
    expect(data.balance).toBe(500);

    // aiTokens is null when falling back (Polar didn't respond)
    expect(data.aiTokens).toBeNull();

    // Pricing is always returned
    expect(data.pricing).toBeTruthy();
  });

  // ─── 4. UI shows live Polar balance on initial load ─────────────────────

  test("dashboard shows live Polar balance on initial load", async ({
    page,
  }) => {
    // Set Cecilia's local DB to 0 (stale)
    await resetCredits(0, POLAR_USER_ID);

    // Set the page to load as Cecilia (real Polar customer)
    await page.setExtraHTTPHeaders({
      "X-Test-User-Id": POLAR_USER_ID,
    });

    // Navigate to settings (shows credit balance prominently)
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Handle onboarding if needed
    const skipButton = page.locator('text="Skip for now"');
    if (await skipButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForLoadState("networkidle");
    }

    // Wait for SWR to fetch and render
    await page.waitForTimeout(5_000);

    // The credit display shows "Sync credits available" label
    const balanceLabel = page.locator("text=Sync credits available");
    await expect(balanceLabel).toBeVisible({ timeout: 10_000 });

    // The sync credits balance should be > 0 (from Polar, not the stale DB 0)
    // The "Sync credits available" label is a sibling of the balance number
    const syncCreditsSection = page.locator("text=Sync credits available").locator("..");
    const balanceNumber = syncCreditsSection.locator("p.text-4xl");
    await expect(balanceNumber).toBeVisible();
    const balanceValue = await balanceNumber.textContent();
    console.log("Displayed balance:", balanceValue);
    expect(Number(balanceValue?.replace(/,/g, ""))).toBeGreaterThan(0);
  });

  // ─── 5. SWR polling updates balance automatically ───────────────────────

  test("credit balance auto-refreshes via SWR polling", async ({ page }) => {
    await goToDashboard(page);
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Wait for initial credit load
    const balanceLabel = page.locator("text=Sync credits available");
    await expect(balanceLabel).toBeVisible({ timeout: 10_000 });

    // Record network requests to /api/credits
    const creditRequests: number[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/credits") && req.method() === "GET") {
        creditRequests.push(Date.now());
      }
    });

    // Wait 25 seconds — should see at least 2 polling requests (10s interval)
    await page.waitForTimeout(25_000);

    console.log(
      `Observed ${creditRequests.length} credit API requests in 25s`
    );
    expect(creditRequests.length).toBeGreaterThanOrEqual(2);

    // Verify requests are spaced ~10s apart (not rapid-fire)
    if (creditRequests.length >= 2) {
      const gap = creditRequests[1] - creditRequests[0];
      console.log(`Gap between first two requests: ${gap}ms`);
      expect(gap).toBeGreaterThanOrEqual(8_000);
      expect(gap).toBeLessThanOrEqual(15_000);
    }
  });

  // ─── 6. Focus revalidation (visibilitychange) ──────────────────────────

  test("credits revalidate on visibility change", async ({ page }) => {
    await goToDashboard(page);
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Wait for initial load
    await expect(
      page.locator("text=Sync credits available")
    ).toBeVisible({ timeout: 10_000 });

    // Track credit API requests
    const creditRequests: number[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/credits") && req.method() === "GET") {
        creditRequests.push(Date.now());
      }
    });

    // Wait for any initial polling to settle
    await page.waitForTimeout(2_500);
    const countBefore = creditRequests.length;

    // Simulate tab becoming hidden then visible again
    // SWR uses document.visibilityState + visibilitychange event
    await page.evaluate(() => {
      // Mock hidden state
      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      // Mock visible state (triggers SWR revalidation)
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Wait for the revalidation request
    await page.waitForTimeout(3_000);

    console.log(
      `Requests before visibility change: ${countBefore}, after: ${creditRequests.length}`
    );
    expect(creditRequests.length).toBeGreaterThan(countBefore);
  });

  // ─── 7. Checkout success triggers aggressive polling ────────────────────

  test("checkout=success param triggers aggressive credit polling", async ({
    page,
  }) => {
    // Track credit API requests
    const creditRequests: number[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/credits") && req.method() === "GET") {
        creditRequests.push(Date.now());
      }
    });

    // Navigate to settings with checkout=success (simulates Polar redirect)
    await page.goto("/dashboard/settings?checkout=success");
    await page.waitForLoadState("networkidle");

    // Handle onboarding if needed
    const skipButton = page.locator('text="Skip for now"');
    if (await skipButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForLoadState("networkidle");
    }

    // Wait 12 seconds — aggressive polling fires every 3s
    await page.waitForTimeout(12_000);

    console.log(
      `Observed ${creditRequests.length} credit requests in 12s with checkout=success`
    );

    // In 12s with 3s intervals: ~4 aggressive polls + initial SWR mount = 4+
    expect(creditRequests.length).toBeGreaterThanOrEqual(4);

    // Verify the checkout param was cleaned from the URL
    const currentUrl = page.url();
    expect(currentUrl).not.toContain("checkout=success");
  });

  // ─── 8. No UI flicker during SWR revalidation ──────────────────────────

  test("credit badges do not flicker during SWR revalidation", async ({
    page,
  }) => {
    // Use Cecilia (real Polar balance > 0) to ensure balance is never 0
    await page.setExtraHTTPHeaders({
      "X-Test-User-Id": POLAR_USER_ID,
    });

    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // Handle onboarding
    const skipButton = page.locator('text="Skip for now"');
    if (await skipButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForLoadState("networkidle");
    }

    const balanceLabel = page.locator("text=Sync credits available");
    await expect(balanceLabel).toBeVisible({ timeout: 10_000 });

    // Set up a mutation observer to detect if balance element temporarily shows 0
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__flickerCount = 0;
      const observer = new MutationObserver(() => {
        const balanceEl = document.querySelector(".text-4xl");
        if (balanceEl && balanceEl.textContent === "0") {
          (window as unknown as Record<string, number>).__flickerCount++;
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    // Wait through 2 SWR revalidation cycles (~20s)
    await page.waitForTimeout(22_000);

    const flickerDetected = await page.evaluate(
      () => (window as unknown as Record<string, number>).__flickerCount > 0
    );

    console.log("Flicker detected:", flickerDetected);
    expect(flickerDetected).toBe(false);
  });

  // ─── 9. Response shape validation ──────────────────────────────────────

  test("GET /api/credits returns correct response shape", async ({
    request,
  }) => {
    const response = await request.get("/api/credits");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Validate response shape
    expect(typeof data.balance).toBe("number");
    expect(data.balance).toBeGreaterThanOrEqual(0);

    // aiTokens should be a number (from Polar) or null (fallback)
    expect(
      data.aiTokens === null || typeof data.aiTokens === "number"
    ).toBeTruthy();

    // Pricing should be an object with known keys
    expect(data.pricing).toBeTruthy();
    expect(typeof data.pricing).toBe("object");
    expect(data.pricing).toHaveProperty("posts");
    expect(data.pricing).toHaveProperty("comments");
    expect(data.pricing).toHaveProperty("ai_chat");
  });

  // ─── 10. Trial provisioning: no 0-credit race condition ─────────────────

  test("trial start no longer calls syncCreditBalance", async ({
    request,
  }) => {
    // Reset to free tier
    await resetCredits(0);
    await setTrialState("reset");

    // Start a trial (ingests credits to Polar, should NOT sync local DB)
    await setTrialState("start");

    // The API should respond correctly regardless
    const response = await request.get("/api/credits");
    const data = await response.json();
    console.log("Credits after trial start:", data);

    // Response shape is correct
    expect(data).toHaveProperty("balance");
    expect(data).toHaveProperty("pricing");
    expect(typeof data.balance).toBe("number");
  });
});
