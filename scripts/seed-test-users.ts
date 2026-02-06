/**
 * Seed script for creating multiple test users in the database.
 *
 * Run with: npx tsx scripts/seed-test-users.ts
 *
 * Creates isolated test users for UAT agent testing.
 * Uses onConflictDoUpdate to reset credits on re-run.
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const TEST_USERS = [
  { id: "test_user_api", email: "api@test.example.com", name: "API Tester", creditBalance: 5000 },
  { id: "test_user_ui", email: "ui@test.example.com", name: "UI Tester", creditBalance: 5000 },
  { id: "test_user_edge", email: "edge@test.example.com", name: "Edge Tester", creditBalance: 5 },
  { id: "test_user_123", email: "test@example.com", name: "Test User", creditBalance: 1000 },
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
          set: { creditBalance: user.creditBalance, name: user.name },
        });

      console.log(`  ${user.id}: ${user.creditBalance} credits (${user.name})`);
    } catch (error) {
      console.error(`  Failed to seed ${user.id}:`, error);
      process.exit(1);
    }
  }

  console.log("\nAll test users seeded successfully.");
  process.exit(0);
}

seedTestUsers();
