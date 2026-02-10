import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { TRIAL_DURATION_DAYS } from "@/lib/subscriptions";
import { TRIAL_BONUS_SYNC_CREDITS, TRIAL_BONUS_AI_TOKENS } from "@/lib/credits";
import { ingestSyncCreditEvent, ingestAiTokenEvent } from "@/lib/polar";
import { syncCreditBalance } from "@/lib/services/credit-service";

/**
 * Start a 14-day Pro trial for a new user.
 * Sets tier to "pro", sets trialEndsAt, and ingests bonus credits to Polar meters.
 * Local credit balance syncs on first GET /api/credits via sync-on-read.
 */
export async function startTrial(userId: string): Promise<void> {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

  await db
    .update(users)
    .set({
      subscriptionTier: "pro",
      trialEndsAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Ingest bonus credits (Pro minus Free baseline) to Polar meters
  await ingestSyncCreditEvent(userId, TRIAL_BONUS_SYNC_CREDITS, {
    type: "trial_bonus",
  });
  await ingestAiTokenEvent(userId, TRIAL_BONUS_AI_TOKENS, {
    type: "trial_bonus",
  });
}

/**
 * Expire a user's trial by reverting them to the free tier.
 * Keeps trialEndsAt as historical record.
 */
export async function expireTrial(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      subscriptionTier: "free",
      subscriptionStartedAt: null,
      subscriptionExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Sync balance from Polar (free tier baseline) — non-fatal if Polar unreachable
  try {
    await syncCreditBalance(userId);
  } catch (err) {
    console.error(`Failed to sync credit balance during trial expiry for ${userId}:`, err);
  }
}

/**
 * Check if a user's trial is currently active.
 */
export async function isTrialActive(userId: string): Promise<boolean> {
  const result = await db
    .select({
      trialEndsAt: users.trialEndsAt,
      trialConverted: users.trialConverted,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) return false;

  const { trialEndsAt, trialConverted } = result[0];
  if (!trialEndsAt || trialConverted) return false;

  return trialEndsAt > new Date();
}

/**
 * Get trial information for UI display.
 */
export async function getTrialInfo(userId: string): Promise<{
  isOnTrial: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
}> {
  const result = await db
    .select({
      trialEndsAt: users.trialEndsAt,
      trialConverted: users.trialConverted,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return { isOnTrial: false, trialEndsAt: null, daysRemaining: 0 };
  }

  const { trialEndsAt, trialConverted } = result[0];

  if (!trialEndsAt || trialConverted) {
    return { isOnTrial: false, trialEndsAt: null, daysRemaining: 0 };
  }

  const now = new Date();
  const isOnTrial = trialEndsAt > now;
  const daysRemaining = isOnTrial
    ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return { isOnTrial, trialEndsAt, daysRemaining };
}

/**
 * Mark a trial as converted (called when user subscribes to a paid plan).
 */
export async function convertTrial(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      trialConverted: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Find users with expired trials who are still on the "pro" tier.
 * Used by the cron job to batch-expire trials.
 */
export async function findExpiredTrials(): Promise<string[]> {
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        lt(users.trialEndsAt, new Date()),
        eq(users.trialConverted, false),
        eq(users.subscriptionTier, "pro")
      )
    );

  return result.map((r) => r.id);
}
