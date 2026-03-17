/**
 * Polar Organization Migration Script
 *
 * Creates a new "Astriq" organization with slug "astriq",
 * then sets up all meters, benefits, products, and webhook.
 * Updates Vercel production env vars with new IDs.
 *
 * Usage: npx tsx scripts/migrate-polar-org.ts
 *
 * Prerequisites:
 *   POLAR_ACCESS_TOKEN must be set in .env.local (production token with organizations:write scope)
 *   If org creation fails (token is org-scoped), create the org in the dashboard first,
 *   then set NEW_ORG_ID below and re-run.
 */

import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

// If org creation via API fails, paste the new org ID here and re-run
const NEW_ORG_ID = process.env.NEW_POLAR_ORG_ID || "";

const POLAR_API = "https://api.polar.sh";
const TOKEN = process.env.POLAR_ACCESS_TOKEN;
const WEBHOOK_URL = "https://astriq.ai";

// ─── Helpers ────────────────────────────────────────────────────────────────

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

async function findOrCreateMeter(
  name: string,
  eventName: string,
  aggregateProperty: string,
  orgId: string
) {
  const existing = await polarFetch<{ items: { id: string; name: string }[] }>(
    `/meters/`
  );
  const found = existing.items?.find((m) => m.name === name);
  if (found) {
    console.log(`   ${name}: ${found.id} (existing)`);
    return found.id;
  }

  const res = await polarFetch<{ id: string }>("/meters/", {
    method: "POST",
    body: {
      name,
      // organization_id inferred from org-scoped token
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
  orgId: string,
  rollover: boolean = false
) {
  const res = await polarFetch<{ id: string }>("/benefits/", {
    method: "POST",
    body: {
      type: "meter_credit",
      description,
      // organization_id inferred from org-scoped token
      properties: { meter_id: meterId, units, rollover },
    },
  });
  return res.id;
}

type PriceSpec =
  | { amount_type: "free"; price_currency: "usd" }
  | { amount_type: "fixed"; price_amount: number; price_currency: "usd" };

async function createProduct(
  name: string,
  description: string,
  price: PriceSpec,
  recurring: { interval: "month" | "year" } | null,
  orgId: string,
  metadata?: Record<string, string | number>
): Promise<string> {
  const body: Record<string, unknown> = {
    name,
    description,
    prices: [price],
    visibility: "public",
    // organization_id inferred from org-scoped token
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
  console.log(`   ${name}: ${res.id}`);
  return res.id;
}

async function attachBenefits(productId: string, benefitIds: string[]) {
  await polarFetch(`/products/${productId}/benefits`, {
    method: "POST",
    body: { benefits: benefitIds },
  });
}

async function createWebhook(url: string, orgId: string) {
  const res = await polarFetch<{ id: string; secret: string }>(
    "/webhooks/endpoints/",
    {
      method: "POST",
      body: {
        url,
        format: "raw",
        // organization_id inferred from org-scoped token
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

  console.log("=== Polar Organization Migration: Not-a-Bot → Astriq ===\n");

  // ── 1. Create or use new organization ─────────────────────────────────

  let orgId = NEW_ORG_ID;

  if (!orgId) {
    console.log("1. Creating new organization...");
    try {
      const org = await polarFetch<{ id: string; name: string; slug: string }>(
        "/organizations/",
        {
          method: "POST",
          body: { name: "Astriq", slug: "astriq" },
        }
      );
      orgId = org.id;
      console.log(`   Created: ${org.name} (${org.slug}) — ${orgId}`);
    } catch (err) {
      console.error("\n   Failed to create org via API:", (err as Error).message);
      console.error("\n   Your token may be org-scoped. Please:");
      console.error("   1. Create the org 'Astriq' (slug: astriq) in the Polar dashboard");
      console.error("   2. Generate a new access token for the Astriq org");
      console.error("   3. Set POLAR_ACCESS_TOKEN=<new token> and NEW_POLAR_ORG_ID=<org id> in .env.local");
      console.error("   4. Re-run this script");
      process.exit(1);
    }
  } else {
    console.log(`1. Using existing organization: ${orgId}`);
  }

  // ── 2. Meters ─────────────────────────────────────────────────────────

  console.log("\n2. Creating meters...");
  const aiMeterId = await findOrCreateMeter("ai-tokens", "ai-tokens", "tokens", orgId);
  const syncMeterId = await findOrCreateMeter("sync-credits", "sync-credits", "units", orgId);

  // ── 3. Benefits ───────────────────────────────────────────────────────

  console.log("\n3. Creating benefits...");

  // Subscription benefits
  const freeAi = await createBenefit(aiMeterId, "250K AI tokens/month", 250_000, orgId);
  const freeSync = await createBenefit(syncMeterId, "100 sync credits/month", 100, orgId);
  const basicAi = await createBenefit(aiMeterId, "3M AI tokens/month", 3_000_000, orgId);
  const basicSync = await createBenefit(syncMeterId, "600 sync credits/month", 600, orgId);
  const proAi = await createBenefit(aiMeterId, "10M AI tokens/month", 10_000_000, orgId);
  const proSync = await createBenefit(syncMeterId, "1,500 sync credits/month", 1_500, orgId);
  const agencyAi = await createBenefit(aiMeterId, "30M AI tokens/month", 30_000_000, orgId);
  const agencySync = await createBenefit(syncMeterId, "4,000 sync credits/month", 4_000, orgId);
  console.log("   Subscription: 8 created");

  // Annual benefits
  const basicAiAnn = await createBenefit(aiMeterId, "3M AI tokens/month (annual)", 3_000_000, orgId);
  const basicSyncAnn = await createBenefit(syncMeterId, "600 sync credits/month (annual)", 600, orgId);
  const proAiAnn = await createBenefit(aiMeterId, "10M AI tokens/month (annual)", 10_000_000, orgId);
  const proSyncAnn = await createBenefit(syncMeterId, "1,500 sync credits/month (annual)", 1_500, orgId);
  const agencyAiAnn = await createBenefit(aiMeterId, "30M AI tokens/month (annual)", 30_000_000, orgId);
  const agencySyncAnn = await createBenefit(syncMeterId, "4,000 sync credits/month (annual)", 4_000, orgId);
  console.log("   Annual: 6 created");

  // Credit pack benefits
  const packStarter = await createBenefit(syncMeterId, "250 sync credits", 250, orgId, true);
  const packValue = await createBenefit(syncMeterId, "600 sync credits", 600, orgId, true);
  const packPower = await createBenefit(syncMeterId, "1,500 sync credits", 1_500, orgId, true);
  const packBulk = await createBenefit(syncMeterId, "3,000 sync credits", 3_000, orgId, true);
  console.log("   Sync credit packs: 4 created");

  // AI token pack benefits
  const aiPackStarter = await createBenefit(aiMeterId, "250K AI tokens", 250_000, orgId, true);
  const aiPackValue = await createBenefit(aiMeterId, "1M AI tokens", 1_000_000, orgId, true);
  const aiPackPower = await createBenefit(aiMeterId, "3M AI tokens", 3_000_000, orgId, true);
  const aiPackBulk = await createBenefit(aiMeterId, "10M AI tokens", 10_000_000, orgId, true);
  console.log("   AI token packs: 4 created");

  // ── 4. Products ───────────────────────────────────────────────────────

  console.log("\n4. Creating products...");

  // Monthly subscriptions
  console.log("\n   Monthly:");
  const free = await createProduct("Free", "Get started for free — 250K AI tokens + 100 sync credits/month, 1 account",
    { amount_type: "free", price_currency: "usd" }, { interval: "month" }, orgId, { tier: "free", account_limit: 1 });
  await attachBenefits(free, [freeAi, freeSync]);

  const basic = await createProduct("Creator", "For growing creators — 3M AI tokens + 600 sync credits/month, 5 accounts",
    { amount_type: "fixed", price_amount: 1499, price_currency: "usd" }, { interval: "month" }, orgId, { tier: "basic", account_limit: 5 });
  await attachBenefits(basic, [basicAi, basicSync]);

  const pro = await createProduct("Pro", "For professional creators — 10M AI tokens + 1,500 sync credits/month, 15 accounts",
    { amount_type: "fixed", price_amount: 2999, price_currency: "usd" }, { interval: "month" }, orgId, { tier: "pro", account_limit: 15 });
  await attachBenefits(pro, [proAi, proSync]);

  const agency = await createProduct("Agency", "For agencies and teams — 30M AI tokens + 4,000 sync credits/month, 50 accounts",
    { amount_type: "fixed", price_amount: 5999, price_currency: "usd" }, { interval: "month" }, orgId, { tier: "agency", account_limit: 50 });
  await attachBenefits(agency, [agencyAi, agencySync]);

  const mcp = await createProduct("MCP Apps", "Bring your own AI client. Connect Claude Desktop, ChatGPT, or any MCP-compatible client. Buy sync credit packs as needed.",
    { amount_type: "free", price_currency: "usd" }, { interval: "month" }, orgId, { tier: "mcp", account_limit: 10, data_retention_days: 90 });

  // Annual subscriptions
  console.log("\n   Annual:");
  const basicAnnual = await createProduct("Creator Annual", "For growing creators — billed annually",
    { amount_type: "fixed", price_amount: 14388, price_currency: "usd" }, { interval: "year" }, orgId, { tier: "basic", account_limit: 5, billing: "annual" });
  await attachBenefits(basicAnnual, [basicAiAnn, basicSyncAnn]);

  const proAnnual = await createProduct("Pro Annual", "For professional creators — billed annually",
    { amount_type: "fixed", price_amount: 28788, price_currency: "usd" }, { interval: "year" }, orgId, { tier: "pro", account_limit: 15, billing: "annual" });
  await attachBenefits(proAnnual, [proAiAnn, proSyncAnn]);

  const agencyAnnual = await createProduct("Agency Annual", "For agencies and teams — billed annually",
    { amount_type: "fixed", price_amount: 57588, price_currency: "usd" }, { interval: "year" }, orgId, { tier: "agency", account_limit: 50, billing: "annual" });
  await attachBenefits(agencyAnnual, [agencyAiAnn, agencySyncAnn]);

  // Sync credit packs
  console.log("\n   Sync credit packs:");
  const creditStarter = await createProduct("Starter Credit Pack", "250 sync credits — top up your account.",
    { amount_type: "fixed", price_amount: 499, price_currency: "usd" }, null, orgId, { packId: "starter", credits: 250 });
  await attachBenefits(creditStarter, [packStarter]);

  const creditValue = await createProduct("Value Credit Pack", "600 sync credits — great value.",
    { amount_type: "fixed", price_amount: 999, price_currency: "usd" }, null, orgId, { packId: "value", credits: 600 });
  await attachBenefits(creditValue, [packValue]);

  const creditPower = await createProduct("Power Credit Pack", "1,500 sync credits — for power users.",
    { amount_type: "fixed", price_amount: 1999, price_currency: "usd" }, null, orgId, { packId: "power", credits: 1500 });
  await attachBenefits(creditPower, [packPower]);

  const creditBulk = await createProduct("Bulk Credit Pack", "3,000 sync credits — best value.",
    { amount_type: "fixed", price_amount: 3499, price_currency: "usd" }, null, orgId, { packId: "bulk", credits: 3000 });
  await attachBenefits(creditBulk, [packBulk]);

  // AI token packs
  console.log("\n   AI token packs:");
  const aiStarter = await createProduct("AI Starter Token Pack", "250K AI tokens.",
    { amount_type: "fixed", price_amount: 299, price_currency: "usd" }, null, orgId, { packId: "ai_starter", tokens: 250000 });
  await attachBenefits(aiStarter, [aiPackStarter]);

  const aiValue = await createProduct("AI Value Token Pack", "1M AI tokens.",
    { amount_type: "fixed", price_amount: 899, price_currency: "usd" }, null, orgId, { packId: "ai_value", tokens: 1000000 });
  await attachBenefits(aiValue, [aiPackValue]);

  const aiPower = await createProduct("AI Power Token Pack", "3M AI tokens.",
    { amount_type: "fixed", price_amount: 1999, price_currency: "usd" }, null, orgId, { packId: "ai_power", tokens: 3000000 });
  await attachBenefits(aiPower, [aiPackPower]);

  const aiBulk = await createProduct("AI Bulk Token Pack", "10M AI tokens.",
    { amount_type: "fixed", price_amount: 4999, price_currency: "usd" }, null, orgId, { packId: "ai_bulk", tokens: 10000000 });
  await attachBenefits(aiBulk, [aiPackBulk]);

  // ── 5. Webhook ────────────────────────────────────────────────────────

  console.log("\n5. Creating webhook...");
  let webhookSecret = "";
  try {
    const webhook = await createWebhook(`${WEBHOOK_URL}/api/webhooks/polar`, orgId);
    webhookSecret = webhook.secret;
    console.log(`   URL: ${WEBHOOK_URL}/api/webhooks/polar`);
    console.log(`   Secret: ${webhookSecret}`);
  } catch (err) {
    console.error("   Webhook creation failed (may need webhooks:write scope):", (err as Error).message);
    console.error("   Create it manually in the Polar dashboard.");
  }

  // ── 6. Output ─────────────────────────────────────────────────────────

  const envVars: Record<string, string> = {
    POLAR_AI_METER_ID: aiMeterId,
    POLAR_SYNC_METER_ID: syncMeterId,
    NEXT_PUBLIC_POLAR_PRODUCT_FREE: free,
    NEXT_PUBLIC_POLAR_PRODUCT_BASIC: basic,
    NEXT_PUBLIC_POLAR_PRODUCT_PRO: pro,
    NEXT_PUBLIC_POLAR_PRODUCT_AGENCY: agency,
    NEXT_PUBLIC_POLAR_PRODUCT_MCP: mcp,
    NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_BASIC: basicAnnual,
    NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_PRO: proAnnual,
    NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_AGENCY: agencyAnnual,
    NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_STARTER: creditStarter,
    NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_VALUE: creditValue,
    NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_POWER: creditPower,
    NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_BULK: creditBulk,
    NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_STARTER: aiStarter,
    NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_VALUE: aiValue,
    NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_POWER: aiPower,
    NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_BULK: aiBulk,
  };
  if (webhookSecret) {
    envVars.POLAR_WEBHOOK_SECRET = webhookSecret;
  }

  // Write env vars to a file for easy reference
  const outputPath = path.resolve(process.cwd(), "scripts/polar-astriq-env.txt");
  const output = Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join("\n");
  fs.writeFileSync(outputPath, output);

  console.log("\n" + "=".repeat(60));
  console.log("Migration complete! New org: Astriq (astriq)");
  console.log("=".repeat(60));
  console.log(`\nOrg ID: ${orgId}`);
  console.log(`\nAll ${Object.keys(envVars).length} env vars saved to: scripts/polar-astriq-env.txt`);
  console.log("\nNext steps:");
  console.log("  1. Generate a new access token for the Astriq org in the Polar dashboard");
  console.log("  2. Update POLAR_ACCESS_TOKEN in Vercel (production scope)");
  console.log("  3. Run the Vercel env update script with the new product IDs");
  console.log("  4. Redeploy");
}

main().catch((err) => {
  console.error("\nMigration failed:", err);
  process.exit(1);
});
