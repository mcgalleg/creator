/**
 * One-time migration script for existing users during the starter redesign.
 *
 * Run with: npx tsx scripts/migrate-existing-users.ts
 *
 * This script:
 * 1. Sets subscriptionStartedAt = now for all paid-tier users (prevents starter expiry logic)
 * 2. Logs how many users were updated
 *
 * Run AFTER deploying the schema migration (0011), ONCE.
 */

import "dotenv/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

async function main() {
  console.log("Migrating existing users for starter redesign...\n");

  // Set subscriptionStartedAt for all paid-tier users to prevent starter expiry
  const result = await db
    .update(users)
    .set({ subscriptionStartedAt: new Date() })
    .where(inArray(users.subscriptionTier, ["basic", "pro"]))
    .returning({ id: users.id });

  console.log(`Updated ${result.length} paid-tier users with subscriptionStartedAt`);

  console.log("\nMigration complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
