import { pgTable, text, integer, timestamp, serial, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";

export const tiktokAccounts = pgTable("tiktok_accounts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  followerCount: integer("follower_count").default(0),
  followingCount: integer("following_count").default(0),
  likesCount: integer("likes_count").default(0),
  videoCount: integer("video_count").default(0),
  bio: text("bio"),
  isVerified: boolean("is_verified").default(false),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
