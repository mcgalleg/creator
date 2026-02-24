/**
 * Seed script for creating multiple test users in the database.
 *
 * Run with: npx tsx scripts/seed-test-users.ts
 *
 * Creates isolated test users at each tier for UAT testing.
 * Uses onConflictDoUpdate to reset state on re-run.
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { TIER_SYNC_CREDITS } from "@/lib/subscriptions";

const TEST_USERS = [
  {
    id: "test_user_free",
    email: "free@test.example.com",
    name: "Free Tester",
    creditBalance: TIER_SYNC_CREDITS.free,
    subscriptionTier: "free" as const,
    onboardingCompletedAt: new Date(),
    subscriptionStartedAt: null,
  },
  {
    id: "test_user_basic",
    email: "basic@test.example.com",
    name: "Creator Tester",
    creditBalance: TIER_SYNC_CREDITS.basic,
    subscriptionTier: "basic" as const,
    onboardingCompletedAt: new Date(),
    subscriptionStartedAt: new Date(),
  },
  {
    id: "test_user_pro",
    email: "pro@test.example.com",
    name: "Pro Tester",
    creditBalance: TIER_SYNC_CREDITS.pro,
    subscriptionTier: "pro" as const,
    onboardingCompletedAt: new Date(),
    subscriptionStartedAt: new Date(),
  },
  {
    id: "test_user_agency",
    email: "agency@test.example.com",
    name: "Agency Tester",
    creditBalance: TIER_SYNC_CREDITS.agency,
    subscriptionTier: "agency" as const,
    onboardingCompletedAt: new Date(),
    subscriptionStartedAt: new Date(),
  },
  {
    id: "test_user_123",
    email: "test@example.com",
    name: "Test User",
    creditBalance: TIER_SYNC_CREDITS.free,
    subscriptionTier: "free" as const,
    onboardingCompletedAt: null,
    subscriptionStartedAt: null,
  },
];

async function seedTestUsers() {
  console.log("Seeding test users...\n");

  for (const user of TEST_USERS) {
    try {
      await db
        .insert(users)
        .values(user)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            creditBalance: user.creditBalance,
            name: user.name,
            subscriptionTier: user.subscriptionTier,
            onboardingCompletedAt: user.onboardingCompletedAt,
            subscriptionStartedAt: user.subscriptionStartedAt,
            subscriptionExpiresAt: null,
            dataPurgeAt: null,
          },
        });

      console.log(`  ${user.id}: ${user.subscriptionTier} tier, ${user.creditBalance} credits (${user.name})`);
    } catch (error) {
      console.error(`  Failed to seed ${user.id}:`, error);
      process.exit(1);
    }
  }

  console.log("\nAll test users seeded successfully.");
  process.exit(0);
}

seedTestUsers();
