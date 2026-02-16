import { pgTable, text, integer, bigint, timestamp, serial, uniqueIndex } from "drizzle-orm/pg-core";
import { tiktokAccounts } from "./tiktok-accounts";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => tiktokAccounts.id, { onDelete: "cascade" }),
  tiktokId: text("tiktok_id").notNull(), // The TikTok video ID (unique per account)
  description: text("description"),
  likes: bigint("likes", { mode: "number" }).default(0),
  comments: bigint("comments", { mode: "number" }).default(0),
  shares: bigint("shares", { mode: "number" }).default(0),
  plays: bigint("plays", { mode: "number" }).default(0),
  saves: bigint("saves", { mode: "number" }).default(0),
  duration: integer("duration"), // Duration in seconds
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  hashtags: text("hashtags").array(),
  videoDirectUrl: text("video_direct_url"),
  aspectRatio: text("aspect_ratio"),
  songTitle: text("song_title"),
  songArtist: text("song_artist"),
  songDuration: integer("song_duration"), // seconds
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  commentsSyncedAt: timestamp("comments_synced_at"),
  syncedCommentCount: integer("synced_comment_count").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("posts_account_tiktok_id_idx").on(table.accountId, table.tiktokId),
]);
