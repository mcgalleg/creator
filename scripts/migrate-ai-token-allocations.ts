/**
 * One-time migration: Update AI token allocations on Polar subscription products.
 *
 * Old → New allocations:
 *   Free:    100K  → 250K
 *   Creator: 1M    → 3M
 *   Pro:     3M    → 10M
 *   Agency:  10M   → 30M
 *
 * Run with: npx tsx scripts/migrate-ai-token-allocations.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getPolar } from "@/lib/polar";

const AI_METER_ID = process.env.POLAR_AI_METER_ID!;
if (!process.env.POLAR_AI_METER_ID) {
  console.error("Missing POLAR_AI_METER_ID in environment");
  process.exit(1);
}

const PRODUCTS: { name: string; envVar: string; newAiTokens: number }[] = [
  { name: "Free", envVar: "NEXT_PUBLIC_POLAR_PRODUCT_FREE", newAiTokens: 250_000 },
  { name: "Creator (Basic)", envVar: "NEXT_PUBLIC_POLAR_PRODUCT_BASIC", newAiTokens: 3_000_000 },
  { name: "Pro", envVar: "NEXT_PUBLIC_POLAR_PRODUCT_PRO", newAiTokens: 10_000_000 },
  { name: "Agency", envVar: "NEXT_PUBLIC_POLAR_PRODUCT_AGENCY", newAiTokens: 30_000_000 },
];

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return n.toString();
}

async function main() {
  const polar = getPolar();

  console.log("=== Migrating AI Token Allocations ===\n");

  for (const { name, envVar, newAiTokens } of PRODUCTS) {
    const productId = process.env[envVar];
    if (!productId) {
      console.error(`  SKIP ${name}: Missing ${envVar}`);
      continue;
    }

    console.log(`${name} (${productId}):`);

    const product = await polar.products.get({ id: productId });
    const aiBenefit = product.benefits.find((b) => {
      if (b.type !== "meter_credit") return false;
      const props = b.properties as { meterId?: string; meter_id?: string };
      return (props.meterId ?? props.meter_id) === AI_METER_ID;
    });

    if (!aiBenefit) {
      console.error(`  ERROR: No AI token meter benefit found on ${name} product`);
      continue;
    }

    const oldUnits = (aiBenefit.properties as { units?: number }).units ?? "unknown";
    console.log(`  Current: ${formatTokens(Number(oldUnits))} AI tokens`);
    console.log(`  New:     ${formatTokens(newAiTokens)} AI tokens`);

    await polar.benefits.update({
      id: aiBenefit.id,
      requestBody: {
        type: "meter_credit",
        description: `${name} tier: ${formatTokens(newAiTokens)} AI tokens/month`,
        properties: {
          meterId: AI_METER_ID,
          units: newAiTokens,
          rollover: false,
        },
      },
    });

    console.log(`  UPDATED ✓\n`);
  }

  // Also check annual products
  const ANNUAL_PRODUCTS: { name: string; envVar: string; newAiTokens: number }[] = [
    { name: "Creator Annual", envVar: "NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_BASIC", newAiTokens: 3_000_000 },
    { name: "Pro Annual", envVar: "NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_PRO", newAiTokens: 10_000_000 },
    { name: "Agency Annual", envVar: "NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_AGENCY", newAiTokens: 30_000_000 },
  ];

  console.log("=== Checking Annual Products ===\n");

  for (const { name, envVar, newAiTokens } of ANNUAL_PRODUCTS) {
    const productId = process.env[envVar];
    if (!productId) {
      console.log(`  SKIP ${name}: ${envVar} not set`);
      continue;
    }

    console.log(`${name} (${productId}):`);

    const product = await polar.products.get({ id: productId });
    const aiBenefit = product.benefits.find((b) => {
      if (b.type !== "meter_credit") return false;
      const props = b.properties as { meterId?: string; meter_id?: string };
      return (props.meterId ?? props.meter_id) === AI_METER_ID;
    });

    if (!aiBenefit) {
      console.log(`  No AI token benefit found (may share benefits with monthly product)`);
      continue;
    }

    const oldUnits = (aiBenefit.properties as { units?: number }).units ?? "unknown";
    console.log(`  Current: ${formatTokens(Number(oldUnits))} AI tokens`);
    console.log(`  New:     ${formatTokens(newAiTokens)} AI tokens`);

    await polar.benefits.update({
      id: aiBenefit.id,
      requestBody: {
        type: "meter_credit",
        description: `${name} tier: ${formatTokens(newAiTokens)} AI tokens/month`,
        properties: {
          meterId: AI_METER_ID,
          units: newAiTokens,
          rollover: false,
        },
      },
    });

    console.log(`  UPDATED ✓\n`);
  }

  console.log("=== Migration Complete ===");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
