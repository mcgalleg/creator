/**
 * Polar Setup Script
 *
 * Creates meters, benefits, products, and webhook in Polar,
 * then updates .env.local with the resulting IDs.
 *
 * Idempotent: finds existing meters/products by name before creating.
 *
 * Usage: npx tsx scripts/setup-polar.ts
 *
 * Prerequisites:
 *   POLAR_ACCESS_TOKEN, POLAR_SERVER, and POLAR_WEBHOOK_URL must be set in .env.local
 */

import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const ENV_PATH = path.resolve(process.cwd(), ".env.local");

const POLAR_API =
  process.env.POLAR_SERVER === "production"
    ? "https://api.polar.sh"
    : "https://sandbox-api.polar.sh";

const TOKEN = process.env.POLAR_ACCESS_TOKEN;
const WEBHOOK_URL = process.env.POLAR_WEBHOOK_URL;

// ─── Helpers ────────────────────────────────────────────────────────────────

function updateEnvFile(updates: Record<string, string>): void {
  let content = fs.readFileSync(ENV_PATH, "utf-8");
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  fs.writeFileSync(ENV_PATH, content);
}

async function polarFetch<T>(
  apiPath: string,
  options: Omit<RequestInit, "body"> & { body?: Record<string, unknown> } = {}
): Promise<T> {
  const { body, ...init } = options;
  const res = await fetch(`${POLAR_API}/v1${apiPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Polar API ${apiPath}: ${res.status} ${text}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ─── Resource Creators ──────────────────────────────────────────────────────

async function findOrCreateMeter(
  name: string,
  eventName: string,
  aggregateProperty: string
) {
  const existing = await polarFetch<{ items: { id: string; name: string }[] }>("/meters/");
  const found = existing.items?.find((m) => m.name === name);
  if (found) {
    console.log(`   ${name}: ${found.id} (existing)`);
    return found.id;
  }

  const res = await polarFetch<{ id: string }>("/meters/", {
    method: "POST",
    body: {
      name,
      filter: {
        conjunction: "and",
        clauses: [{ property: "name", operator: "eq", value: eventName }],
      },
      aggregation: { func: "sum", property: aggregateProperty },
    },
  });
  console.log(`   ${name}: ${res.id} (created)`);
  return res.id;
}

async function createBenefit(
  meterId: string,
  description: string,
  units: number,
  rollover: boolean = false
) {
  const res = await polarFetch<{ id: string }>("/benefits/", {
    method: "POST",
    body: {
      type: "meter_credit",
      description,
      properties: { meter_id: meterId, units, rollover },
    },
  });
  return res.id;
}

type PriceSpec =
  | { amount_type: "free"; price_currency: "usd" }
  | { amount_type: "fixed"; price_amount: number; price_currency: "usd" };

async function findOrCreateProduct(
  name: string,
  description: string,
  price: PriceSpec,
  recurring: { interval: "month" | "year" } | null,
  metadata?: Record<string, string | number>
): Promise<{ id: string; created: boolean }> {
  // Search for existing product by name
  const existing = await polarFetch<{
    items: { id: string; name: string; is_archived: boolean }[];
  }>(`/products/?query=${encodeURIComponent(name)}&limit=50`);
  const found = existing.items?.find((p) => p.name === name && !p.is_archived);
  if (found) {
    console.log(`   ${name}: ${found.id} (existing)`);
    return { id: found.id, created: false };
  }

  const body: Record<string, unknown> = {
    name,
    description,
    prices: [price],
    visibility: "public",
  };
  if (recurring) {
    body.recurring_interval = recurring.interval;
  }
  if (metadata) {
    body.metadata = metadata;
  }
  const res = await polarFetch<{ id: string }>("/products/", {
    method: "POST",
    body,
  });
  console.log(`   ${name}: ${res.id} (created)`);
  return { id: res.id, created: true };
}

async function attachBenefits(productId: string, benefitIds: string[]) {
  await polarFetch(`/products/${productId}/benefits`, {
    method: "POST",
    body: { benefits: benefitIds },
  });
}

async function createWebhook(url: string) {
  const res = await polarFetch<{ id: string; secret: string }>(
    "/webhooks/endpoints/",
    {
      method: "POST",
      body: {
        url,
        format: "raw",
        events: [
          "subscription.active",
          "subscription.updated",
          "subscription.canceled",
          "subscription.revoked",
          "order.paid",
          "customer.state_changed",
        ],
      },
    }
  );
  return res;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!TOKEN) {
    console.error("Missing POLAR_ACCESS_TOKEN. Set it in .env.local.");
    process.exit(1);
  }
  if (!WEBHOOK_URL) {
    console.error("Missing POLAR_WEBHOOK_URL in .env.local.");
    process.exit(1);
  }

  console.log(`Polar API: ${POLAR_API}`);
  console.log(`Webhook target: ${WEBHOOK_URL}\n`);

  // ── 1. Meters ───────────────────────────────────────────────────────────

  console.log("1. Finding or creating meters...");
  const aiMeterId = await findOrCreateMeter("ai-tokens", "ai-tokens", "tokens");
  const syncMeterId = await findOrCreateMeter("sync-credits", "sync-credits", "units");

  // ── 2. Benefits ─────────────────────────────────────────────────────────
  // Values match lib/subscriptions.ts TIER_AI_TOKENS / TIER_SYNC_CREDITS

  console.log("\n2. Creating meter credit benefits...");

  // Subscription benefits (rollover = false, reset monthly)
  const freeAi = await createBenefit(aiMeterId, "250K AI tokens/month", 250_000);
  const freeSync = await createBenefit(syncMeterId, "100 sync credits/month", 100);
  const basicAi = await createBenefit(aiMeterId, "3M AI tokens/month", 3_000_000);
  const basicSync = await createBenefit(syncMeterId, "600 sync credits/month", 600);
  const proAi = await createBenefit(aiMeterId, "10M AI tokens/month", 10_000_000);
  const proSync = await createBenefit(syncMeterId, "1,500 sync credits/month", 1_500);
  const agencyAi = await createBenefit(aiMeterId, "30M AI tokens/month", 30_000_000);
  const agencySync = await createBenefit(syncMeterId, "4,000 sync credits/month", 4_000);
  console.log("   Subscription benefits: 8 created (4 tiers × 2 meters)");

  // Annual subscription benefits (same amounts, separate benefits for annual products)
  const basicAiAnnual = await createBenefit(aiMeterId, "3M AI tokens/month (annual)", 3_000_000);
  const basicSyncAnnual = await createBenefit(syncMeterId, "600 sync credits/month (annual)", 600);
  const proAiAnnual = await createBenefit(aiMeterId, "10M AI tokens/month (annual)", 10_000_000);
  const proSyncAnnual = await createBenefit(syncMeterId, "1,500 sync credits/month (annual)", 1_500);
  const agencyAiAnnual = await createBenefit(aiMeterId, "30M AI tokens/month (annual)", 30_000_000);
  const agencySyncAnnual = await createBenefit(syncMeterId, "4,000 sync credits/month (annual)", 4_000);
  console.log("   Annual benefits: 6 created (3 tiers × 2 meters)");

  // Sync credit pack benefits (rollover = true)
  const packStarter = await createBenefit(syncMeterId, "250 sync credits", 250, true);
  const packValue = await createBenefit(syncMeterId, "600 sync credits", 600, true);
  const packPower = await createBenefit(syncMeterId, "1,500 sync credits", 1_500, true);
  const packBulk = await createBenefit(syncMeterId, "3,000 sync credits", 3_000, true);
  console.log("   Sync credit pack benefits: 4 created");

  // AI token pack benefits (rollover = true)
  const aiPackStarter = await createBenefit(aiMeterId, "250K AI tokens", 250_000, true);
  const aiPackValue = await createBenefit(aiMeterId, "1M AI tokens", 1_000_000, true);
  const aiPackPower = await createBenefit(aiMeterId, "3M AI tokens", 3_000_000, true);
  const aiPackBulk = await createBenefit(aiMeterId, "10M AI tokens", 10_000_000, true);
  console.log("   AI token pack benefits: 4 created");

  // ── 3. Products ─────────────────────────────────────────────────────────

  console.log("\n3. Creating products...");

  // --- Monthly subscriptions ---
  console.log("\n   Monthly subscriptions:");
  const free = await findOrCreateProduct(
    "Free",
    "Get started for free — 250K AI tokens + 100 sync credits/month, 1 account",
    { amount_type: "free", price_currency: "usd" },
    { interval: "month" },
    { tier: "free", account_limit: 1 }
  );
  await attachBenefits(free.id, [freeAi, freeSync]);

  const basic = await findOrCreateProduct(
    "Creator",
    "For growing creators — 3M AI tokens + 600 sync credits/month, 5 accounts",
    { amount_type: "fixed", price_amount: 1499, price_currency: "usd" },
    { interval: "month" },
    { tier: "basic", account_limit: 5 }
  );
  await attachBenefits(basic.id, [basicAi, basicSync]);

  const pro = await findOrCreateProduct(
    "Pro",
    "For professional creators — 10M AI tokens + 1,500 sync credits/month, 15 accounts",
    { amount_type: "fixed", price_amount: 2999, price_currency: "usd" },
    { interval: "month" },
    { tier: "pro", account_limit: 15 }
  );
  await attachBenefits(pro.id, [proAi, proSync]);

  const agency = await findOrCreateProduct(
    "Agency",
    "For agencies and teams — 30M AI tokens + 4,000 sync credits/month, 50 accounts",
    { amount_type: "fixed", price_amount: 5999, price_currency: "usd" },
    { interval: "month" },
    { tier: "agency", account_limit: 50 }
  );
  await attachBenefits(agency.id, [agencyAi, agencySync]);

  const mcp = await findOrCreateProduct(
    "MCP Apps",
    "Bring your own AI client. Connect Claude Desktop, ChatGPT, or any MCP-compatible client. Buy sync credit packs as needed.",
    { amount_type: "free", price_currency: "usd" },
    { interval: "month" },
    { tier: "mcp", account_limit: 10, data_retention_days: 90 }
  );
  // MCP has no AI/sync benefits (BYOC)

  // --- Annual subscriptions ---
  console.log("\n   Annual subscriptions:");
  const basicAnnual = await findOrCreateProduct(
    "Creator Annual",
    "For growing creators — 3M AI tokens + 600 sync credits/month, 5 accounts (billed annually)",
    { amount_type: "fixed", price_amount: 14388, price_currency: "usd" },
    { interval: "year" },
    { tier: "basic", account_limit: 5, billing: "annual" }
  );
  await attachBenefits(basicAnnual.id, [basicAiAnnual, basicSyncAnnual]);

  const proAnnual = await findOrCreateProduct(
    "Pro Annual",
    "For professional creators — 10M AI tokens + 1,500 sync credits/month, 15 accounts (billed annually)",
    { amount_type: "fixed", price_amount: 28788, price_currency: "usd" },
    { interval: "year" },
    { tier: "pro", account_limit: 15, billing: "annual" }
  );
  await attachBenefits(proAnnual.id, [proAiAnnual, proSyncAnnual]);

  const agencyAnnual = await findOrCreateProduct(
    "Agency Annual",
    "For agencies and teams — 30M AI tokens + 4,000 sync credits/month, 50 accounts (billed annually)",
    { amount_type: "fixed", price_amount: 57588, price_currency: "usd" },
    { interval: "year" },
    { tier: "agency", account_limit: 50, billing: "annual" }
  );
  await attachBenefits(agencyAnnual.id, [agencyAiAnnual, agencySyncAnnual]);

  // --- Sync credit packs (one-time) ---
  console.log("\n   Sync credit packs:");
  const creditStarter = await findOrCreateProduct(
    "Starter Credit Pack",
    "250 sync credits — top up your account for post and comment syncing.",
    { amount_type: "fixed", price_amount: 499, price_currency: "usd" },
    null,
    { packId: "starter", credits: 250 }
  );
  await attachBenefits(creditStarter.id, [packStarter]);

  const creditValue = await findOrCreateProduct(
    "Value Credit Pack",
    "600 sync credits — great value for regular syncing.",
    { amount_type: "fixed", price_amount: 999, price_currency: "usd" },
    null,
    { packId: "value", credits: 600 }
  );
  await attachBenefits(creditValue.id, [packValue]);

  const creditPower = await findOrCreateProduct(
    "Power Credit Pack",
    "1,500 sync credits — for power users managing multiple accounts.",
    { amount_type: "fixed", price_amount: 1999, price_currency: "usd" },
    null,
    { packId: "power", credits: 1500 }
  );
  await attachBenefits(creditPower.id, [packPower]);

  const creditBulk = await findOrCreateProduct(
    "Bulk Credit Pack",
    "3,000 sync credits — best per-credit value for high-volume syncing.",
    { amount_type: "fixed", price_amount: 3499, price_currency: "usd" },
    null,
    { packId: "bulk", credits: 3000 }
  );
  await attachBenefits(creditBulk.id, [packBulk]);

  // --- AI token packs (one-time) ---
  console.log("\n   AI token packs:");
  const aiStarter = await findOrCreateProduct(
    "AI Starter Token Pack",
    "250K AI tokens — top up for AI-powered analytics and chat.",
    { amount_type: "fixed", price_amount: 299, price_currency: "usd" },
    null,
    { packId: "ai_starter", tokens: 250000 }
  );
  await attachBenefits(aiStarter.id, [aiPackStarter]);

  const aiValue = await findOrCreateProduct(
    "AI Value Token Pack",
    "1M AI tokens — great value for regular AI usage.",
    { amount_type: "fixed", price_amount: 899, price_currency: "usd" },
    null,
    { packId: "ai_value", tokens: 1000000 }
  );
  await attachBenefits(aiValue.id, [aiPackValue]);

  const aiPower = await findOrCreateProduct(
    "AI Power Token Pack",
    "3M AI tokens — for power users with heavy AI usage.",
    { amount_type: "fixed", price_amount: 1999, price_currency: "usd" },
    null,
    { packId: "ai_power", tokens: 3000000 }
  );
  await attachBenefits(aiPower.id, [aiPackPower]);

  const aiBulk = await findOrCreateProduct(
    "AI Bulk Token Pack",
    "10M AI tokens — best per-token value for heavy usage.",
    { amount_type: "fixed", price_amount: 4999, price_currency: "usd" },
    null,
    { packId: "ai_bulk", tokens: 10000000 }
  );
  await attachBenefits(aiBulk.id, [aiPackBulk]);

  // ── 4. Webhook ──────────────────────────────────────────────────────────

  console.log("\n4. Creating webhook endpoint...");
  const webhookEndpointUrl = `${WEBHOOK_URL}/api/webhooks/polar`;
  const webhook = await createWebhook(webhookEndpointUrl);
  console.log(`   URL:    ${webhookEndpointUrl}`);
  console.log(`   Secret: ${webhook.secret}`);

  // ── 5. Update .env.local ────────────────────────────────────────────────

  console.log("\n5. Updating .env.local...");
  const envUpdates: Record<string, string> = {
    POLAR_WEBHOOK_SECRET: webhook.secret,
    POLAR_AI_METER_ID: aiMeterId,
    POLAR_SYNC_METER_ID: syncMeterId,
    // Monthly subscriptions
    NEXT_PUBLIC_POLAR_PRODUCT_FREE: free.id,
    NEXT_PUBLIC_POLAR_PRODUCT_BASIC: basic.id,
    NEXT_PUBLIC_POLAR_PRODUCT_PRO: pro.id,
    NEXT_PUBLIC_POLAR_PRODUCT_AGENCY: agency.id,
    NEXT_PUBLIC_POLAR_PRODUCT_MCP: mcp.id,
    // Annual subscriptions
    NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_BASIC: basicAnnual.id,
    NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_PRO: proAnnual.id,
    NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_AGENCY: agencyAnnual.id,
    // Sync credit packs
    NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_STARTER: creditStarter.id,
    NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_VALUE: creditValue.id,
    NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_POWER: creditPower.id,
    NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_BULK: creditBulk.id,
    // AI token packs
    NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_STARTER: aiStarter.id,
    NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_VALUE: aiValue.id,
    NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_POWER: aiPower.id,
    NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_BULK: aiBulk.id,
  };
  updateEnvFile(envUpdates);
  console.log("   .env.local updated with all Polar IDs");

  // ── Summary ─────────────────────────────────────────────────────────────

  console.log("\n" + "=".repeat(60));
  console.log(`Polar ${process.env.POLAR_SERVER} setup complete!`);
  console.log("=".repeat(60));

  console.log("\nMeters:");
  console.log(`  ai-tokens:    ${aiMeterId}`);
  console.log(`  sync-credits: ${syncMeterId}`);

  console.log("\nMonthly Subscriptions:");
  console.log(`  Free:     ${free.id}`);
  console.log(`  Creator:  ${basic.id} ($14.99/mo)`);
  console.log(`  Pro:      ${pro.id} ($29.99/mo)`);
  console.log(`  Agency:   ${agency.id} ($59.99/mo)`);
  console.log(`  MCP Apps: ${mcp.id} (free)`);

  console.log("\nAnnual Subscriptions:");
  console.log(`  Creator:  ${basicAnnual.id} ($143.88/yr)`);
  console.log(`  Pro:      ${proAnnual.id} ($287.88/yr)`);
  console.log(`  Agency:   ${agencyAnnual.id} ($575.88/yr)`);

  console.log("\nSync Credit Packs:");
  console.log(`  Starter:  ${creditStarter.id} ($4.99 / 250 credits)`);
  console.log(`  Value:    ${creditValue.id} ($9.99 / 600 credits)`);
  console.log(`  Power:    ${creditPower.id} ($19.99 / 1,500 credits)`);
  console.log(`  Bulk:     ${creditBulk.id} ($34.99 / 3,000 credits)`);

  console.log("\nAI Token Packs:");
  console.log(`  Starter:  ${aiStarter.id} ($2.99 / 250K tokens)`);
  console.log(`  Value:    ${aiValue.id} ($8.99 / 1M tokens)`);
  console.log(`  Power:    ${aiPower.id} ($19.99 / 3M tokens)`);
  console.log(`  Bulk:     ${aiBulk.id} ($49.99 / 10M tokens)`);

  console.log("\nWebhook:");
  console.log(`  URL:    ${webhookEndpointUrl}`);
  console.log(`  Secret: ${webhook.secret}`);

  console.log("\nAll IDs written to .env.local.");
  console.log("Copy the PRODUCTION values above into Vercel env vars (Production scope).");
}

main().catch((err) => {
  console.error("\nSetup failed:", err);
  process.exit(1);
});
