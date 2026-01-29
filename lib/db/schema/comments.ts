import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { posts } from "./posts";

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  tiktokId: text("tiktok_id"), // TikTok comment ID
  text: text("text"),
  authorUsername: text("author_username"),
  authorAvatarUrl: text("author_avatar_url"),
  likes: integer("likes").default(0),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
