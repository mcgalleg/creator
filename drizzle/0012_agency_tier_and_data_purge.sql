ALTER TYPE "public"."subscription_tier" ADD VALUE 'agency';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "data_purge_at" timestamp;
