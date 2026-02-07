import { pgTable, pgEnum, text, integer, timestamp, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Subscription tier enum (also exported from feature-flags.ts for convenience)
export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "pro", "enterprise"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  creditBalance: integer("credit_balance").default(100).notNull(),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("free").notNull(),
  subscriptionStartedAt: timestamp("subscription_started_at"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Ensure one user per email address
  uniqueIndex("users_email_idx").on(table.email),
  check("credit_balance_non_negative", sql`credit_balance >= 0`),
]);
