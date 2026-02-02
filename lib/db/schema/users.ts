import { pgTable, pgEnum, text, integer, timestamp } from "drizzle-orm/pg-core";

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
});
