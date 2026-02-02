import { pgTable, text, integer, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { tiktokAccounts } from "./tiktok-accounts";
import { users } from "./users";

// Type for comment sync configuration stored in jsonb
export interface CommentSyncConfigSchema {
  mode: "selection" | "top_performers" | "date_range" | "budget";
  selectedPostIds?: string[];
  topCount?: number;
  dateRange?: { start: string; end: string }; // ISO date strings in DB
  maxPerPost?: number;
  creditBudget?: number;
}

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
  commentSyncConfig: jsonb("comment_sync_config").$type<CommentSyncConfigSchema>(),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
