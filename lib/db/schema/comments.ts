import { pgTable, text, integer, timestamp, serial, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { posts } from "./posts";

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  tiktokId: text("tiktok_id").notNull(), // TikTok comment ID
  text: text("text"),
  authorUsername: text("author_username"),
  authorAvatarUrl: text("author_avatar_url"),
  likes: integer("likes").default(0),
  authorDisplayName: text("author_display_name"),
  authorRegion: text("author_region"),
  commentLanguage: text("comment_language"),
  replyCount: integer("reply_count").default(0),
  isAuthorLiked: boolean("is_author_liked").default(false),
  authorFollowerCount: integer("author_follower_count"),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("comments_post_tiktok_id_idx").on(table.postId, table.tiktokId),
]);
