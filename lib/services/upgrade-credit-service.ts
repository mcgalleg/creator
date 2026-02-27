import { getPolar } from "@/lib/polar";
import { ingestAiTokenEvent, ingestSyncCreditEvent } from "@/lib/polar";
import { TIER_AI_TOKENS, TIER_SYNC_CREDITS } from "@/lib/subscriptions";
import type { SubscriptionTier } from "@/lib/subscriptions";
import { db } from "@/lib/db";
import { creditTransactions } from "@/lib/db/schema/credits";

/**
 * When a user upgrades from one tier to another, Polar revokes the old tier's
 * meter credits and grants the new tier's credits — but the consumed_units
 * counter doesn't reset. This means consumption from the old tier eats into
 * the new tier's allocation.
 *
 * This function issues compensating negative-consumption events to:
 * 1. Ensure old-tier consumption doesn't penalize the new tier
 * 2. Carry over any leftover old-tier credits as a bonus
 *
 * Formula per meter: compensating = max(consumed_units, old_tier_credits)
 *   - If consumed >= old_tier_credits: resets all consumption (clean slate)
 *   - If consumed < old_tier_credits: resets consumption AND adds the
 *     unused old-tier credits as a bonus on the new tier
 */
export async function compensateUpgradeCredits(
  userId: string,
  oldTier: SubscriptionTier
): Promise<void> {
  const oldAiTokens = TIER_AI_TOKENS[oldTier] ?? 0;
  const oldSyncCredits = TIER_SYNC_CREDITS[oldTier] ?? 0;

  // Nothing to compensate if the old tier had no credits
  if (oldAiTokens === 0 && oldSyncCredits === 0) return;

  // Read current meter state to find consumed_units
  const polar = getPolar();
  const state = await polar.customers.getStateExternal({ externalId: userId });

  const aiMeter = state.activeMeters?.find(
    (m) => m.meterId === process.env.POLAR_AI_METER_ID
  );
  const syncMeter = state.activeMeters?.find(
    (m) => m.meterId === process.env.POLAR_SYNC_METER_ID
  );

  const aiConsumed = aiMeter?.consumedUnits ?? 0;
  const syncConsumed = syncMeter?.consumedUnits ?? 0;

  // Calculate compensating amounts:
  // max(consumed, old_tier_credits) ensures both clean-slate and carryover
  const aiCompensation = oldAiTokens > 0
    ? Math.max(aiConsumed, oldAiTokens)
    : 0;
  const syncCompensation = oldSyncCredits > 0
    ? Math.max(syncConsumed, oldSyncCredits)
    : 0;

  // Inject negative consumption events to offset old-tier usage
  const promises: Promise<void>[] = [];

  if (aiCompensation > 0) {
    promises.push(
      ingestAiTokenEvent(userId, -aiCompensation, {
        externalId: `upgrade-comp-ai-${userId}-${Date.now()}`,
      })
    );
  }

  if (syncCompensation > 0) {
    promises.push(
      ingestSyncCreditEvent(userId, -syncCompensation, {
        externalId: `upgrade-comp-sync-${userId}-${Date.now()}`,
      })
    );
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  // Log the compensation as a credit transaction
  const parts: string[] = [];
  if (aiCompensation > 0) parts.push(`${aiCompensation.toLocaleString()} AI tokens`);
  if (syncCompensation > 0) parts.push(`${syncCompensation} sync credits`);

  if (parts.length > 0) {
    await db.insert(creditTransactions).values({
      userId,
      amount: syncCompensation,
      type: "upgrade_compensation",
      description: `Upgrade credit compensation: ${parts.join(", ")} carried over from ${oldTier} tier`,
    });

    console.log(
      `Upgrade compensation for ${userId}: ${parts.join(", ")} (old tier: ${oldTier})`
    );
  }
}
