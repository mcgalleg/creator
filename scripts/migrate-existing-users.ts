/**
 * One-time migration script for existing users during the reverse trial rollout.
 *
 * Run with: npx tsx scripts/migrate-existing-users.ts
 *
 * This script:
 * 1. Sets trialConverted = true for ALL existing users (prevents trial logic from applying)
 * 2. Logs how many users were updated
 *
 * Run AFTER deploying the code changes, ONCE.
 */

import "dotenv/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

async function main() {
  console.log("Migrating existing users...\n");

  // Set trialConverted = true for all existing users to prevent trial logic
  const result = await db
    .update(users)
    .set({ trialConverted: true })
    .returning({ id: users.id });

  console.log(`Updated ${result.length} users with trialConverted = true`);

  // TODO: For free-tier users, optionally create a Polar subscription to the
  // free product so they receive monthly baseline credits. This requires
  // creating subscriptions via the Polar API for each user's Polar customer ID.
  // For now, free-tier users can be subscribed manually or via a follow-up script.

  console.log("\nMigration complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
