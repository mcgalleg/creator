import { pgTable, text, integer, timestamp, serial, uniqueIndex } from "drizzle-orm/pg-core";
import { tiktokAccounts } from "./tiktok-accounts";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => tiktokAccounts.id, { onDelete: "cascade" }),
  tiktokId: text("tiktok_id").notNull(), // The TikTok video ID (unique per account)
  description: text("description"),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  plays: integer("plays").default(0),
  saves: integer("saves").default(0),
  duration: integer("duration"), // Duration in seconds
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("posts_account_tiktok_id_idx").on(table.accountId, table.tiktokId),
]);
