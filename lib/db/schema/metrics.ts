import { pgTable, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { tiktokAccounts } from "./tiktok-accounts";

export const accountMetricsHistory = pgTable("account_metrics_history", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => tiktokAccounts.id, { onDelete: "cascade" }),
  followerCount: integer("follower_count").default(0),
  followingCount: integer("following_count").default(0),
  likesCount: integer("likes_count").default(0),
  videoCount: integer("video_count").default(0),
  recordedAt: timestamp("recorded_at").notNull(),
});
