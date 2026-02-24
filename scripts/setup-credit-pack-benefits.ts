/**
 * Update credit pack benefits to new credit amounts.
 *
 * Run with: npx tsx scripts/setup-credit-pack-benefits.ts
 *
 * Updates existing meter_credit benefits on credit pack products:
 *   Starter: 100 -> 250 credits
 *   Value:   300 -> 600 credits
 *   Power:   750 -> 1,500 credits
 *   Bulk:  1,500 -> 3,000 credits
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { getPolar } from "@/lib/polar";

const SYNC_METER_ID = process.env.POLAR_SYNC_METER_ID!;

const UPDATES = [
  {
    name: "Starter",
    productId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_STARTER!,
    newCredits: 250,
    description: "250 sync credits — top up your account for post and comment syncing.",
  },
  {
    name: "Value",
    productId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_VALUE!,
    newCredits: 600,
    description: "600 sync credits — great value for regular syncing.",
  },
  {
    name: "Power",
    productId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_POWER!,
    newCredits: 1500,
    description: "1,500 sync credits — for power users managing multiple accounts.",
  },
  {
    name: "Bulk",
    productId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_BULK!,
    newCredits: 3000,
    description: "3,000 sync credits — best per-credit value for high-volume syncing.",
  },
];

async function main() {
  const polar = getPolar();

  console.log(`Polar server: ${process.env.POLAR_SERVER ?? "sandbox"}\n`);

  for (const pack of UPDATES) {
    console.log(`${pack.name} pack → ${pack.newCredits} credits`);

    // Get product and find its sync meter credit benefit
    const product = await polar.products.get({ id: pack.productId });
    console.log(`  Product: ${product.name} (${product.id})`);

    // SDK may return meter_id as either camelCase or snake_case
    const syncBenefit = product.benefits.find((b) => {
      if (b.type !== "meter_credit") return false;
      const props = b.properties as Record<string, unknown>;
      const meterId = props.meterId ?? props.meter_id;
      return meterId === SYNC_METER_ID;
    });

    if (!syncBenefit) {
      // Debug: show what benefits exist
      for (const b of product.benefits) {
        console.log(`  Found benefit: type=${b.type}, props=${JSON.stringify(b.properties)}`);
      }
      console.error(`  ERROR: No sync meter benefit found (looking for meter ${SYNC_METER_ID})`);
      continue;
    }

    console.log(`  Current benefit: ${syncBenefit.description} (${syncBenefit.id})`);

    // Update the benefit with new credit amount
    await polar.benefits.update({
      id: syncBenefit.id,
      requestBody: {
        type: "meter_credit",
        description: `${pack.name} pack: ${pack.newCredits} sync credits`,
        properties: {
          meterId: SYNC_METER_ID,
          units: pack.newCredits,
          rollover: true,
        },
      },
    });
    console.log(`  Updated benefit → ${pack.newCredits} credits`);

    // Update product description
    await polar.products.update({
      id: pack.productId,
      productUpdate: { description: pack.description },
    });
    console.log(`  Updated description`);
    console.log();
  }

  console.log("Done! All credit pack benefits updated.");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
