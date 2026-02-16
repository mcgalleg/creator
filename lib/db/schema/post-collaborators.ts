import { pgTable, text, integer, bigint, timestamp, serial, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { posts } from "./posts";

export const postCollaborators = pgTable("post_collaborators", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  tiktokUserId: text("tiktok_user_id").notNull(),
  username: text("username").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  isVerified: boolean("is_verified").default(false),
  followerCount: bigint("follower_count", { mode: "number" }).default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("post_collabs_post_user_idx").on(table.postId, table.tiktokUserId),
]);
