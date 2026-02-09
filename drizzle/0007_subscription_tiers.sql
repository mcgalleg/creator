-- Migration: Update subscription tiers (enterprise -> basic) and add credits_reset_at
-- This migration handles the Postgres enum change safely:
-- 1. Create new enum type with updated values
-- 2. Migrate existing "enterprise" rows to "pro"
-- 3. Swap the column to use the new enum
-- 4. Drop old enum and rename new one

-- Step 1: Create new enum type
CREATE TYPE "public"."subscription_tier_new" AS ENUM('free', 'basic', 'pro');--> statement-breakpoint

-- Step 2: Migrate any "enterprise" users to "pro" before changing the enum
UPDATE "users" SET "subscription_tier" = 'pro' WHERE "subscription_tier" = 'enterprise';--> statement-breakpoint

-- Step 3: Alter column to use new enum (via text cast)
ALTER TABLE "users"
  ALTER COLUMN "subscription_tier" SET DATA TYPE "public"."subscription_tier_new"
  USING "subscription_tier"::text::"public"."subscription_tier_new";--> statement-breakpoint

-- Step 4: Drop old enum and rename new one
DROP TYPE "public"."subscription_tier";--> statement-breakpoint
ALTER TYPE "public"."subscription_tier_new" RENAME TO "subscription_tier";--> statement-breakpoint

-- Step 5: Add credits_reset_at column
ALTER TABLE "users" ADD COLUMN "credits_reset_at" timestamp;
