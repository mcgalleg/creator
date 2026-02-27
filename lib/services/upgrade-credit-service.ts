import { getPolar } from "@/lib/polar";
import { TIER_AI_TOKENS, TIER_SYNC_CREDITS } from "@/lib/subscriptions";
import type { SubscriptionTier } from "@/lib/subscriptions";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { creditTransactions } from "@/lib/db/schema/credits";
import { eq } from "drizzle-orm";

/**
 * When a user upgrades from one tier to another, carry over unused credits
 * from the old tier as a bonus on the new tier.
 *
 * Instead of sending negative Polar meter events (which don't work with Sum
 * aggregation), we store the carryover in local DB columns. These are added
 * to Polar balances when reading credits.
 *
 * Formula per meter: carryover = max(0, oldAllocation - consumed)
 *   - If consumed >= oldAllocation: no carryover (all credits were used)
 *   - If consumed < oldAllocation: unused portion carries forward
 */
export async function compensateUpgradeCredits(
  userId: string,
  oldTier: SubscriptionTier
): Promise<void> {
  const oldAiTokens = TIER_AI_TOKENS[oldTier] ?? 0;
  const oldSyncCredits = TIER_SYNC_CREDITS[oldTier] ?? 0;

  // Nothing to compensate if the old tier had no credits
  if (oldAiTokens === 0 && oldSyncCredits === 0) return;

  // Idempotency guard: skip if carryover was already set
  const [existingUser] = await db
    .select({
      carryoverAiTokens: users.carryoverAiTokens,
      carryoverSyncCredits: users.carryoverSyncCredits,
    })
    .from(users)
    .where(eq(users.id, userId));
  if (existingUser && (existingUser.carryoverAiTokens > 0 || existingUser.carryoverSyncCredits > 0)) return;

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

  // Calculate unused portion of old tier's allocation
  const aiCarryover = Math.max(0, oldAiTokens - aiConsumed);
  const syncCarryover = Math.max(0, oldSyncCredits - syncConsumed);

  // Store carryover in local DB columns
  if (aiCarryover > 0 || syncCarryover > 0) {
    await db.update(users)
      .set({
        carryoverAiTokens: aiCarryover,
        carryoverSyncCredits: syncCarryover,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Log the compensation as a credit transaction
  const parts: string[] = [];
  if (aiCarryover > 0) parts.push(`${aiCarryover.toLocaleString()} AI tokens`);
  if (syncCarryover > 0) parts.push(`${syncCarryover} sync credits`);

  if (parts.length > 0) {
    await db.insert(creditTransactions).values({
      userId,
      amount: syncCarryover,
      type: "upgrade_compensation",
      description: `Upgrade credit compensation: ${parts.join(", ")} carried over from ${oldTier} tier`,
    });

    console.log(
      `Upgrade compensation for ${userId}: ${parts.join(", ")} (old tier: ${oldTier})`
    );
  }
}
