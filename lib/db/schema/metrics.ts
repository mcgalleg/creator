import { pgTable, integer, bigint, timestamp, serial, index } from "drizzle-orm/pg-core";
import { tiktokAccounts } from "./tiktok-accounts";

export const accountMetricsHistory = pgTable("account_metrics_history", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => tiktokAccounts.id, { onDelete: "cascade" }),
  followerCount: bigint("follower_count", { mode: "number" }).default(0),
  followingCount: bigint("following_count", { mode: "number" }).default(0),
  likesCount: bigint("likes_count", { mode: "number" }).default(0),
  videoCount: bigint("video_count", { mode: "number" }).default(0),
  recordedAt: timestamp("recorded_at").notNull(),
}, (table) => [
  index("metrics_account_recorded_idx").on(table.accountId, table.recordedAt),
]);
