import { pgTable, text, integer, timestamp, serial, uniqueIndex, boolean, index, real, customType } from "drizzle-orm/pg-core";
import { posts } from "./posts";

const vector256 = customType<{ data: number[]; driverValue: string }>({
  dataType() { return "vector(256)"; },
  toDriver(value: number[]) { return `[${value.join(",")}]`; },
  fromDriver(value: unknown) { return JSON.parse(value as string) as number[]; },
});

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
  // Pre-computed sentiment & embedding columns
  sentiment: text("sentiment"),                    // 'supportive' | 'neutral' | 'unsupportive'
  sentimentCategory: text("sentiment_category"),   // 'praise' | 'question' | 'sarcasm' | 'spam' | etc.
  sentimentScore: real("sentiment_score"),          // 0.0–1.0 confidence
  textEmbedding: vector256("text_embedding"),       // 256d vector for semantic search
}, (table) => [
  uniqueIndex("comments_post_tiktok_id_idx").on(table.postId, table.tiktokId),
  index("comments_sentiment_idx").on(table.sentiment),
  index("comments_sentiment_category_idx").on(table.sentimentCategory),
]);
