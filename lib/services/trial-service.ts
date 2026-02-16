import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, lt, isNull } from "drizzle-orm";
import { STARTER_BONUS_SYNC_CREDITS, STARTER_BONUS_AI_TOKENS } from "@/lib/credits";
import { ingestSyncCreditEvent, ingestAiTokenEvent } from "@/lib/polar";
import { syncCreditBalance } from "@/lib/services/credit-service";

export const STARTER_EXPIRY_DAYS = 30;

/**
 * Start the allocation-based Starter period for a new user.
 * Sets tier to "basic" (Creator-level features), sets starterExpiresAt = now + 30 days,
 * and ingests bonus credits to Polar meters.
 * Local credit balance syncs on first GET /api/credits via sync-on-read.
 */
export async function startStarter(userId: string): Promise<void> {
  // Guard against double invocation (race between Clerk webhook and ensureUserExists)
  const existing = await db
    .select({ starterExpiresAt: users.starterExpiresAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existing.length > 0 && existing[0].starterExpiresAt) {
    return; // Starter already started
  }

  const starterExpiresAt = new Date();
  starterExpiresAt.setDate(starterExpiresAt.getDate() + STARTER_EXPIRY_DAYS);

  await db
    .update(users)
    .set({
      subscriptionTier: "basic",
      starterExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Grant Creator-level bonus credits to Polar meters.
  // Negative values = credit grants in Polar's meter system.
  await ingestSyncCreditEvent(userId, -STARTER_BONUS_SYNC_CREDITS, {
    type: "starter_bonus",
  });
  await ingestAiTokenEvent(userId, -STARTER_BONUS_AI_TOKENS, {
    type: "starter_bonus",
  });
}

/**
 * Expire a user's starter period by reverting them to the free tier.
 * Clears subscription-related dates since they never subscribed.
 */
export async function expireStarter(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      subscriptionTier: "free",
      subscriptionStartedAt: null,
      subscriptionExpiresAt: null,
      creditsResetAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Sync balance from Polar (free tier baseline) — non-fatal if Polar unreachable
  try {
    await syncCreditBalance(userId);
  } catch (err) {
    console.error(`Failed to sync credit balance during starter expiry for ${userId}:`, err);
  }
}

/**
 * Find users with expired starter periods who never subscribed to a paid plan.
 * Uses subscriptionStartedAt IS NULL to detect users who never activated a paid subscription.
 * Used by the cron job to batch-expire starters.
 */
export async function findExpiredStarters(): Promise<string[]> {
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        lt(users.starterExpiresAt, new Date()),
        eq(users.subscriptionTier, "basic"),
        isNull(users.subscriptionStartedAt)
      )
    );

  return result.map((r) => r.id);
}
