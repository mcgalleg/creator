import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { tiktokAccounts } from "./tiktok-accounts";
import { users } from "./users";

export const syncJobs = pgTable("sync_jobs", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => tiktokAccounts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull().$type<"profile" | "posts" | "comments" | "full">(),
  status: text("status").notNull().$type<"pending" | "running" | "completed" | "failed">().default("pending"),
  apifyRunId: text("apify_run_id"),
  creditsEstimated: integer("credits_estimated"),
  creditsUsed: integer("credits_used"),
  postsCount: integer("posts_count"),
  commentsCount: integer("comments_count"),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
