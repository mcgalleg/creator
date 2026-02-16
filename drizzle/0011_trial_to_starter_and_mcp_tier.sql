-- Phase 0: Rename trialEndsAt → starterExpiresAt and drop trialConverted
ALTER TABLE "users" RENAME COLUMN "trial_ends_at" TO "starter_expires_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "trial_converted";--> statement-breakpoint

-- Phase 1: Add "mcp" to subscription_tier enum
ALTER TYPE "public"."subscription_tier" ADD VALUE 'mcp';
