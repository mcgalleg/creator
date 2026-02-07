import { pgTable, text, boolean, timestamp, serial, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { users, subscriptionTierEnum } from "./users";

// Re-export subscription tier enum for convenience
export { subscriptionTierEnum };

// Feature flags table
export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  defaultEnabled: boolean("default_enabled").default(false).notNull(),
  enabledForTiers: jsonb("enabled_for_tiers").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User feature overrides table
export const userFeatureOverrides = pgTable("user_feature_overrides", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  featureKey: text("feature_key").notNull(),
  enabled: boolean("enabled").notNull(),
  reason: text("reason"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_feature_overrides_user_key_idx").on(table.userId, table.featureKey),
]);
