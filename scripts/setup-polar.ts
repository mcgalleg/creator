/**
 * Polar Dashboard Setup Script
 *
 * Creates meters, benefits, products, and webhook in Polar sandbox,
 * then updates .env.local with the resulting IDs.
 *
 * Usage: npx tsx scripts/setup-polar.ts
 *
 * Prerequisites:
 *   POLAR_ACCESS_TOKEN and POLAR_WEBHOOK_URL must be set in .env.local
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
  path: string,
  options: Omit<RequestInit, "body"> & { body?: Record<string, unknown> } = {}
): Promise<T> {
  const { body, ...init } = options;
  const res = await fetch(`${POLAR_API}/v1${path}`, {
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
    throw new Error(`Polar API ${path}: ${res.status} ${text}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ─── Resource Creators ──────────────────────────────────────────────────────

async function findOrCreateMeter(
  name: string,
  eventName: string,
  aggregateProperty: string
) {
  // Check if meter already exists
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
  return res.id;
}

async function createMeterCreditBenefit(
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

async function createProduct(
  name: string,
  description: string,
  priceCents: number,
  recurring: boolean,
  metadata?: Record<string, string>
) {
  const body: Record<string, unknown> = {
    name,
    description,
    prices: [
      {
        amount_type: "fixed",
        price_amount: priceCents,
        price_currency: "usd",
      },
    ],
  };
  if (recurring) {
    body.recurring_interval = "month";
  }
  if (metadata) {
    body.metadata = metadata;
  }
  const res = await polarFetch<{ id: string }>("/products/", {
    method: "POST",
    body,
  });
  return res.id;
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
    console.error(
      "Missing POLAR_ACCESS_TOKEN. Set it in .env.local."
    );
    process.exit(1);
  }

  if (!WEBHOOK_URL) {
    console.error(
      "Missing POLAR_WEBHOOK_URL in .env.local (e.g. https://<ngrok-url>)"
    );
    process.exit(1);
  }

  console.log(`Polar API: ${POLAR_API}\n`);

  console.log("Using org-scoped token (organization_id inferred)\n");

  // ── 1. Meters ───────────────────────────────────────────────────────────

  console.log("1. Finding or creating meters...");
  const aiMeterId = await findOrCreateMeter("ai-tokens", "ai-tokens", "tokens");

  const syncMeterId = await findOrCreateMeter("sync-credits", "sync-credits", "units");

  // ── 2. Benefits ─────────────────────────────────────────────────────────

  console.log("\n2. Creating meter credit benefits...");

  // Subscription benefits (rollover = false implied by default)
  const basicAi = await createMeterCreditBenefit(aiMeterId, "500K AI tokens/month", 500_000);
  const basicSync = await createMeterCreditBenefit(syncMeterId, "150 sync credits/month", 150);
  const proAi = await createMeterCreditBenefit(aiMeterId, "2M AI tokens/month", 2_000_000);
  const proSync = await createMeterCreditBenefit(syncMeterId, "500 sync credits/month", 500);
  console.log("   Subscription benefits: 4 created");

  // Credit pack benefits (rollover = true for one-time purchases)
  const packStarter = await createMeterCreditBenefit(syncMeterId, "100 sync credits", 100, true);
  const packValue = await createMeterCreditBenefit(syncMeterId, "300 sync credits", 300, true);
  const packPower = await createMeterCreditBenefit(syncMeterId, "750 sync credits", 750, true);
  const packBulk = await createMeterCreditBenefit(syncMeterId, "1500 sync credits", 1_500, true);
  console.log("   Credit pack benefits: 4 created");

  // ── 3. Products ─────────────────────────────────────────────────────────

  console.log("\n3. Creating products...");

  const basicProductId = await createProduct(
    "Basic", "For growing creators — 500K AI tokens + 150 sync credits/month", 1499, true
  );
  await attachBenefits(basicProductId, [basicAi, basicSync]);
  console.log(`   Basic ($14.99/mo): ${basicProductId}`);

  const proProductId = await createProduct(
    "Pro", "For professional creators — 2M AI tokens + 500 sync credits/month", 2999, true
  );
  await attachBenefits(proProductId, [proAi, proSync]);
  console.log(`   Pro ($29.99/mo):   ${proProductId}`);

  const starterId = await createProduct(
    "Starter Credit Pack", "100 sync credits — one-time purchase", 499, false, { packId: "starter" }
  );
  await attachBenefits(starterId, [packStarter]);
  console.log(`   Starter ($4.99):   ${starterId}`);

  const valueId = await createProduct(
    "Value Credit Pack", "300 sync credits — one-time purchase", 999, false, { packId: "value" }
  );
  await attachBenefits(valueId, [packValue]);
  console.log(`   Value ($9.99):     ${valueId}`);

  const powerId = await createProduct(
    "Power Credit Pack", "750 sync credits — one-time purchase", 1999, false, { packId: "power" }
  );
  await attachBenefits(powerId, [packPower]);
  console.log(`   Power ($19.99):    ${powerId}`);

  const bulkId = await createProduct(
    "Bulk Credit Pack", "1,500 sync credits — one-time purchase", 3499, false, { packId: "bulk" }
  );
  await attachBenefits(bulkId, [packBulk]);
  console.log(`   Bulk ($34.99):     ${bulkId}`);

  // ── 4. Webhook ──────────────────────────────────────────────────────────

  console.log("\n4. Creating webhook endpoint...");
  const webhookEndpointUrl = `${WEBHOOK_URL}/api/webhooks/polar`;
  const webhook = await createWebhook(webhookEndpointUrl);
  console.log(`   URL:    ${webhookEndpointUrl}`);
  console.log(`   Secret: ${webhook.secret}`);

  // ── 5. Update .env.local ────────────────────────────────────────────────

  console.log("\n5. Updating .env.local...");
  updateEnvFile({
    POLAR_WEBHOOK_SECRET: webhook.secret,
    POLAR_AI_METER_ID: aiMeterId,
    POLAR_SYNC_METER_ID: syncMeterId,
    NEXT_PUBLIC_POLAR_PRODUCT_BASIC: basicProductId,
    NEXT_PUBLIC_POLAR_PRODUCT_PRO: proProductId,
    NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_STARTER: starterId,
    NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_VALUE: valueId,
    NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_POWER: powerId,
    NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_BULK: bulkId,
  });
  console.log("   .env.local updated with all Polar IDs");

  // ── Summary ─────────────────────────────────────────────────────────────

  console.log("\n" + "=".repeat(60));
  console.log("Polar setup complete!");
  console.log("=".repeat(60));
  console.log("\nMeters:");
  console.log(`  ai-tokens:    ${aiMeterId}`);
  console.log(`  sync-credits: ${syncMeterId}`);
  console.log("\nSubscription Products:");
  console.log(`  Basic ($14.99/mo): ${basicProductId}`);
  console.log(`  Pro ($29.99/mo):   ${proProductId}`);
  console.log("\nCredit Pack Products:");
  console.log(`  Starter ($4.99):   ${starterId}`);
  console.log(`  Value ($9.99):     ${valueId}`);
  console.log(`  Power ($19.99):    ${powerId}`);
  console.log(`  Bulk ($34.99):     ${bulkId}`);
  console.log("\nWebhook:");
  console.log(`  URL:    ${webhookEndpointUrl}`);
  console.log(`  Secret: ${webhook.secret}`);
  console.log("\nAll IDs written to .env.local. Ready for code implementation.");
}

main().catch((err) => {
  console.error("\nSetup failed:", err);
  process.exit(1);
});
