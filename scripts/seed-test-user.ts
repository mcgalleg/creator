/**
 * Seed script for creating a test user in the database.
 *
 * Run with: npx tsx scripts/seed-test-user.ts
 *
 * This creates a test user that matches the TEST_USER_ID in lib/auth.ts,
 * allowing automated testing with BYPASS_AUTH=true.
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { TEST_USER_ID } from "@/lib/auth";

async function seedTestUser() {
  console.log("Seeding test user...");

  try {
    await db
      .insert(users)
      .values({
        id: TEST_USER_ID,
        email: "test@example.com",
        name: "Test User",
        creditBalance: 1000, // Generous balance for testing
        subscriptionTier: "pro", // Pro tier for full feature access
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          creditBalance: 1000,
          subscriptionTier: "pro",
        },
      });

    console.log(`✅ Test user seeded successfully (ID: ${TEST_USER_ID})`);
    console.log("   Email: test@example.com");
    console.log("   Credits: 1000");
    console.log("   Tier: pro");
  } catch (error) {
    console.error("❌ Failed to seed test user:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedTestUser();
