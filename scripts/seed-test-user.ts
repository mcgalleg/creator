/**
 * Seed script for creating a test user in the database.
 *
 * Run with: npx tsx scripts/seed-test-user.ts
 *
 * This creates a test user that matches the TEST_USER_ID in lib/auth.ts,
 * allowing automated testing with BYPASS_AUTH=true.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { userConnectors } from "@/lib/db/schema/connectors";
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
        subscriptionStartedAt: new Date(), // Prevents starter expiry logic
        goals: ["Performance Overview", "Content Strategy", "Growth & Trends"],
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          creditBalance: 1000,
          subscriptionTier: "pro",
          subscriptionStartedAt: new Date(),
          goals: ["Performance Overview", "Content Strategy", "Growth & Trends"],
        },
      });

    // Enable Excalidraw connector for the test user
    await db
      .insert(userConnectors)
      .values({
        userId: TEST_USER_ID,
        connectorId: "excalidraw",
        enabled: true,
        connectedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userConnectors.userId, userConnectors.connectorId],
        set: { enabled: true, updatedAt: new Date() },
      });

    console.log(`Test user seeded successfully (ID: ${TEST_USER_ID})`);
    console.log("   Email: test@example.com");
    console.log("   Credits: 1000");
    console.log("   Tier: pro");
    console.log("   Goals: Performance Overview, Content Strategy, Growth & Trends");
    console.log("   Connectors: excalidraw (enabled)");
  } catch (error) {
    console.error("Failed to seed test user:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedTestUser();
