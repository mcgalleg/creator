ALTER TABLE "sync_jobs" ADD COLUMN "comment_sync_config" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "tiktok_accounts_user_username_idx" ON "tiktok_accounts" USING btree ("user_id","username");