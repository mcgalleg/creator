ALTER TABLE "tiktok_accounts" ALTER COLUMN "follower_count" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "tiktok_accounts" ALTER COLUMN "following_count" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "tiktok_accounts" ALTER COLUMN "likes_count" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "tiktok_accounts" ALTER COLUMN "video_count" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "likes" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "comments" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "shares" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "plays" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "saves" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "account_metrics_history" ALTER COLUMN "follower_count" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "account_metrics_history" ALTER COLUMN "following_count" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "account_metrics_history" ALTER COLUMN "likes_count" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "account_metrics_history" ALTER COLUMN "video_count" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "comments_estimated" integer;