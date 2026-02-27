import { pgTable, pgEnum, text, integer, timestamp, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Subscription tier enum (also exported from feature-flags.ts for convenience)
export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "basic", "pro", "agency", "mcp"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  creditBalance: integer("credit_balance").default(100).notNull(),
  carryoverAiTokens: integer("carryover_ai_tokens").default(0).notNull(),
  carryoverSyncCredits: integer("carryover_sync_credits").default(0).notNull(),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("free").notNull(),
  subscriptionStartedAt: timestamp("subscription_started_at"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  creditsResetAt: timestamp("credits_reset_at"),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  starterExpiresAt: timestamp("starter_expires_at"),
  dataPurgeAt: timestamp("data_purge_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Ensure one user per email address
  uniqueIndex("users_email_idx").on(table.email),
  check("credit_balance_non_negative", sql`credit_balance >= 0`),
]);
