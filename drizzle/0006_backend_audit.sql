DELETE FROM comments WHERE tiktok_id IS NULL;--> statement-breakpoint
ALTER TABLE comments ALTER COLUMN tiktok_id SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX comments_post_tiktok_id_idx ON comments(post_id, tiktok_id);--> statement-breakpoint
CREATE INDEX sync_jobs_apify_run_id_idx ON sync_jobs(apify_run_id);--> statement-breakpoint
CREATE INDEX sync_jobs_account_status_idx ON sync_jobs(account_id, status);--> statement-breakpoint
CREATE INDEX metrics_account_recorded_idx ON account_metrics_history(account_id, recorded_at);--> statement-breakpoint
CREATE INDEX credit_tx_user_created_idx ON credit_transactions(user_id, created_at);--> statement-breakpoint
CREATE UNIQUE INDEX user_feature_overrides_user_key_idx ON user_feature_overrides(user_id, feature_key);--> statement-breakpoint
ALTER TABLE users ADD CONSTRAINT credit_balance_non_negative CHECK (credit_balance >= 0);
