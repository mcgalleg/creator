/**
 * One-time migration: Update sync credit allocations on Polar subscription products.
 *
 * Old → New allocations:
 *   Free:    50  → 100
 *   Creator: 500 → 600
 *
 * Run with: npx tsx scripts/migrate-sync-credit-allocations.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getPolar } from "@/lib/polar";

const SYNC_METER_ID = process.env.POLAR_SYNC_METER_ID!;
if (!process.env.POLAR_SYNC_METER_ID) {
  console.error("Missing POLAR_SYNC_METER_ID in environment");
  process.exit(1);
}

const PRODUCTS: { name: string; envVar: string; newSyncCredits: number }[] = [
  { name: "Free", envVar: "NEXT_PUBLIC_POLAR_PRODUCT_FREE", newSyncCredits: 100 },
  { name: "Creator", envVar: "NEXT_PUBLIC_POLAR_PRODUCT_BASIC", newSyncCredits: 600 },
];

async function main() {
  const polar = getPolar();

  console.log("=== Migrating Sync Credit Allocations ===\n");

  for (const { name, envVar, newSyncCredits } of PRODUCTS) {
    const productId = process.env[envVar];
    if (!productId) {
      console.error(`  SKIP ${name}: Missing ${envVar}`);
      continue;
    }

    console.log(`${name} (${productId}):`);

    const product = await polar.products.get({ id: productId });
    const syncBenefit = product.benefits.find((b) => {
      if (b.type !== "meter_credit") return false;
      const props = b.properties as { meterId?: string; meter_id?: string };
      return (props.meterId ?? props.meter_id) === SYNC_METER_ID;
    });

    if (!syncBenefit) {
      console.error(`  ERROR: No sync credit meter benefit found on ${name} product`);
      continue;
    }

    const oldUnits = (syncBenefit.properties as { units?: number }).units ?? "unknown";
    console.log(`  Current: ${oldUnits} sync credits`);
    console.log(`  New:     ${newSyncCredits} sync credits`);

    await polar.benefits.update({
      id: syncBenefit.id,
      requestBody: {
        type: "meter_credit",
        description: `${name} tier: ${newSyncCredits} sync credits/month`,
        properties: {
          meterId: SYNC_METER_ID,
          units: newSyncCredits,
          rollover: false,
        },
      },
    });

    console.log(`  UPDATED\n`);
  }

  console.log("=== Migration Complete ===");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
