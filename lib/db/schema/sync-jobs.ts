import { pgTable, text, integer, timestamp, serial, jsonb, index } from "drizzle-orm/pg-core";
import { tiktokAccounts } from "./tiktok-accounts";
import { users } from "./users";

// Legacy type for backward compatibility with existing comment sync rows
export interface CommentSyncConfigSchema {
  mode: "selection" | "top_performers" | "date_range";
  selectedPostIds?: string[];
  topCount?: number;
  dateRange?: { start: string; end: string }; // ISO date strings in DB
  maxPerPost?: number;
}

// Unified sync configuration covering all sync types
export interface SyncConfigSchema {
  // Post sync options
  postsLimit?: number;
  oldestPostDate?: string;
  newestPostDate?: string;
  // Comment sync options
  commentMode?: "selection" | "top_performers" | "date_range";
  selectedPostIds?: string[];
  topCount?: number;
  dateRange?: { start: string; end: string };
  maxCommentsPerPost?: number;
}

export const syncJobs = pgTable("sync_jobs", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => tiktokAccounts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull().$type<"profile" | "posts" | "comments" | "full">(),
  status: text("status").notNull().$type<"pending" | "running" | "completed" | "failed">().default("pending"),
  apifyRunId: text("apify_run_id"),
  creditsEstimated: integer("credits_estimated"),
  creditsHeld: integer("credits_held").default(0),
  creditsUsed: integer("credits_used"),
  postsCount: integer("posts_count"),
  commentsCount: integer("comments_count"),
  commentsEstimated: integer("comments_estimated"),
  newPostsCount: integer("new_posts_count"),
  updatedPostsCount: integer("updated_posts_count"),
  newCommentsCount: integer("new_comments_count"),
  updatedCommentsCount: integer("updated_comments_count"),
  syncConfig: jsonb("sync_config").$type<SyncConfigSchema>(),
  commentSyncConfig: jsonb("comment_sync_config").$type<CommentSyncConfigSchema>(), // Legacy, kept for existing rows
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("sync_jobs_apify_run_id_idx").on(table.apifyRunId),
  index("sync_jobs_account_status_idx").on(table.accountId, table.status),
]);
