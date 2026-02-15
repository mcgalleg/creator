import { pgTable, text, bigint, timestamp, serial, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const tiktokAccounts = pgTable("tiktok_accounts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  followerCount: bigint("follower_count", { mode: "number" }).default(0),
  followingCount: bigint("following_count", { mode: "number" }).default(0),
  likesCount: bigint("likes_count", { mode: "number" }).default(0),
  videoCount: bigint("video_count", { mode: "number" }).default(0),
  bio: text("bio"),
  isVerified: boolean("is_verified").default(false),
  bioUrl: text("bio_url"),
  coverImageUrl: text("cover_image_url"),
  profileCategory: text("profile_category"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Prevent duplicate accounts for the same user
  uniqueIndex("tiktok_accounts_user_username_idx").on(table.userId, table.username),
]);
