/**
 * AI Token Pack Setup Script
 *
 * Creates meter_credit benefits and one-time products in Polar for AI token packs,
 * then updates .env.local with the resulting product IDs.
 *
 * Usage: npx tsx scripts/setup-ai-token-packs.ts
 *
 * Prerequisites:
 *   POLAR_ACCESS_TOKEN and POLAR_AI_METER_ID must be set in .env.local
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
const AI_METER_ID = process.env.POLAR_AI_METER_ID;

// ─── AI Token Pack Definitions ──────────────────────────────────────────────

const AI_TOKEN_PACKS = [
  { id: "ai_starter", name: "Starter AI Token Pack", tokens: 250_000, priceInCents: 299 },
  { id: "ai_value", name: "Value AI Token Pack", tokens: 1_000_000, priceInCents: 899 },
  { id: "ai_power", name: "Power AI Token Pack", tokens: 3_000_000, priceInCents: 1999 },
  { id: "ai_bulk", name: "Bulk AI Token Pack", tokens: 10_000_000, priceInCents: 4999 },
] as const;

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

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return tokens.toString();
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!TOKEN) {
    console.error("Missing POLAR_ACCESS_TOKEN. Set it in .env.local.");
    process.exit(1);
  }

  if (!AI_METER_ID) {
    console.error("Missing POLAR_AI_METER_ID. Run scripts/setup-polar.ts first.");
    process.exit(1);
  }

  console.log(`Polar API: ${POLAR_API}`);
  console.log(`AI Meter:  ${AI_METER_ID}\n`);

  const envUpdates: Record<string, string> = {};

  console.log("1. Creating AI token pack benefits and products...\n");

  for (const pack of AI_TOKEN_PACKS) {
    const tokenLabel = formatTokens(pack.tokens);

    // Create meter_credit benefit with rollover for one-time purchase
    const benefitId = await createMeterCreditBenefit(
      AI_METER_ID,
      `${tokenLabel} AI tokens`,
      pack.tokens,
      true
    );
    console.log(`   ${pack.name} benefit: ${benefitId}`);

    // Create one-time product
    const productId = await createProduct(
      pack.name,
      `${tokenLabel} AI tokens — one-time purchase`,
      pack.priceInCents,
      false,
      { packId: pack.id }
    );
    console.log(`   ${pack.name} product: ${productId}`);

    // Attach benefit to product
    await attachBenefits(productId, [benefitId]);
    console.log(`   ${pack.name} benefit attached\n`);

    // Map pack ID to env var name
    const envKey = `NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_${pack.id.replace("ai_", "").toUpperCase()}`;
    envUpdates[envKey] = productId;
  }

  // ── Update .env.local ────────────────────────────────────────────────────

  console.log("2. Updating .env.local...");
  updateEnvFile(envUpdates);
  console.log("   .env.local updated with AI token pack product IDs");

  // ── Summary ─────────────────────────────────────────────────────────────

  console.log("\n" + "=".repeat(60));
  console.log("AI Token Pack setup complete!");
  console.log("=".repeat(60));
  console.log("\nProducts:");
  for (const [key, value] of Object.entries(envUpdates)) {
    console.log(`  ${key}: ${value}`);
  }
  console.log("\nAll IDs written to .env.local.");
}

main().catch((err) => {
  console.error("\nSetup failed:", err);
  process.exit(1);
});
