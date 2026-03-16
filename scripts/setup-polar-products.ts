/**
 * Setup script for configuring Polar products for the reverse trial system.
 *
 * Run with: npx tsx scripts/setup-polar-products.ts
 *
 * This script:
 * 1. Creates a Free product ($0/month recurring subscription)
 * 2. Creates meter credit benefits for sync credits and AI tokens
 * 3. Attaches benefits to the Free product
 * 4. Renames the Basic product to "Creator" and updates meter credit allocations
 * 5. Updates Pro product meter credit allocations
 *
 * After running, add the printed Free product ID to .env.local as:
 *   NEXT_PUBLIC_POLAR_PRODUCT_FREE=<id>
 */

import "dotenv/config";
import { getPolar } from "@/lib/polar";

if (!process.env.POLAR_SYNC_METER_ID || !process.env.POLAR_AI_METER_ID) {
  console.error("Missing POLAR_SYNC_METER_ID or POLAR_AI_METER_ID in environment");
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_POLAR_PRODUCT_BASIC || !process.env.NEXT_PUBLIC_POLAR_PRODUCT_PRO) {
  console.error("Missing NEXT_PUBLIC_POLAR_PRODUCT_BASIC or NEXT_PUBLIC_POLAR_PRODUCT_PRO in environment");
  process.exit(1);
}

const SYNC_METER_ID = process.env.POLAR_SYNC_METER_ID!;
const AI_METER_ID = process.env.POLAR_AI_METER_ID!;
const BASIC_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_PRODUCT_BASIC!;
const PRO_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_PRODUCT_PRO!;

async function main() {
  const polar = getPolar();

  // Step 1: Create Free product ($0/month recurring subscription)
  console.log("Creating Free product...");
  const freeProduct = await polar.products.create({
    name: "Free",
    description: "Free tier with baseline monthly credits",
    recurringInterval: "month",
    prices: [{ amountType: "free" }],
  });
  console.log(`  Created Free product: ${freeProduct.id}`);

  // Step 2: Create meter credit benefits for the Free product
  console.log("Creating Free tier meter credit benefits...");

  const freeSyncBenefit = await polar.benefits.create({
    type: "meter_credit",
    description: "Free tier: 20 sync credits/month",
    properties: {
      meterId: SYNC_METER_ID,
      units: 20,
      rollover: false,
    },
  });
  console.log(`  Created Free sync benefit: ${freeSyncBenefit.id} (20 credits/mo)`);

  const freeAiBenefit = await polar.benefits.create({
    type: "meter_credit",
    description: "Free tier: 250K AI tokens/month",
    properties: {
      meterId: AI_METER_ID,
      units: 250_000,
      rollover: false,
    },
  });
  console.log(`  Created Free AI benefit: ${freeAiBenefit.id} (250K tokens/mo)`);

  // Step 3: Attach benefits to the Free product
  console.log("Attaching benefits to Free product...");
  await polar.products.updateBenefits({
    id: freeProduct.id,
    productBenefitsUpdate: {
      benefits: [freeSyncBenefit.id, freeAiBenefit.id],
    },
  });
  console.log("  Benefits attached to Free product");

  // Step 4: Update Basic product -> rename to "Creator" and update benefits
  console.log("Updating Basic product -> Creator...");
  await polar.products.update({
    id: BASIC_PRODUCT_ID,
    productUpdate: { name: "Creator" },
  });
  console.log("  Renamed Basic to Creator");

  // Get existing Creator product to find its current benefits
  const creatorProduct = await polar.products.get({ id: BASIC_PRODUCT_ID });
  const creatorMeterBenefits = creatorProduct.benefits.filter(
    (b) => b.type === "meter_credit"
  );

  // Update Creator meter benefits (250 sync, 3M AI tokens)
  for (const benefit of creatorMeterBenefits) {
    if (benefit.type === "meter_credit") {
      const props = benefit.properties as { meterId: string };
      if (props.meterId === SYNC_METER_ID) {
        await polar.benefits.update({
          id: benefit.id,
          requestBody: {
            type: "meter_credit",
            description: "Creator tier: 250 sync credits/month",
            properties: { meterId: SYNC_METER_ID, units: 250, rollover: false },
          },
        });
        console.log(`  Updated Creator sync benefit: ${benefit.id} (250 credits/mo)`);
      } else if (props.meterId === AI_METER_ID) {
        await polar.benefits.update({
          id: benefit.id,
          requestBody: {
            type: "meter_credit",
            description: "Creator tier: 3M AI tokens/month",
            properties: { meterId: AI_METER_ID, units: 3_000_000, rollover: false },
          },
        });
        console.log(`  Updated Creator AI benefit: ${benefit.id} (3M tokens/mo)`);
      }
    }
  }

  // Step 5: Update Pro product meter benefits (750 sync, 10M AI tokens)
  console.log("Updating Pro product meter benefits...");
  const proProduct = await polar.products.get({ id: PRO_PRODUCT_ID });
  const proMeterBenefits = proProduct.benefits.filter(
    (b) => b.type === "meter_credit"
  );

  for (const benefit of proMeterBenefits) {
    if (benefit.type === "meter_credit") {
      const props = benefit.properties as { meterId: string };
      if (props.meterId === SYNC_METER_ID) {
        await polar.benefits.update({
          id: benefit.id,
          requestBody: {
            type: "meter_credit",
            description: "Pro tier: 750 sync credits/month",
            properties: { meterId: SYNC_METER_ID, units: 750, rollover: false },
          },
        });
        console.log(`  Updated Pro sync benefit: ${benefit.id} (750 credits/mo)`);
      } else if (props.meterId === AI_METER_ID) {
        await polar.benefits.update({
          id: benefit.id,
          requestBody: {
            type: "meter_credit",
            description: "Pro tier: 10M AI tokens/month",
            properties: { meterId: AI_METER_ID, units: 10_000_000, rollover: false },
          },
        });
        console.log(`  Updated Pro AI benefit: ${benefit.id} (10M tokens/mo)`);
      }
    }
  }

  // Summary
  console.log("\n=== Setup Complete ===");
  console.log(`Free Product ID: ${freeProduct.id}`);
  console.log(`\nAdd to .env.local:`);
  console.log(`  NEXT_PUBLIC_POLAR_PRODUCT_FREE=${freeProduct.id}`);
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
