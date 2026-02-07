ALTER TABLE "posts" ADD COLUMN "comments_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "synced_comment_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "new_posts_count" integer;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "updated_posts_count" integer;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "new_comments_count" integer;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "updated_comments_count" integer;