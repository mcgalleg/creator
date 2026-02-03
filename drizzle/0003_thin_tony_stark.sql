ALTER TABLE "posts" DROP CONSTRAINT "posts_tiktok_id_unique";--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "credits_held" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "sync_config" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "posts_account_tiktok_id_idx" ON "posts" USING btree ("account_id","tiktok_id");