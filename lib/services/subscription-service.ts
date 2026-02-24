import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { SubscriptionTier } from "@/lib/subscriptions";
import { DATA_PURGE_DAYS } from "@/lib/subscriptions";

/**
 * Provision a new subscription: set tier and timestamps.
 * Credit allocation is handled by Polar Meter Credits Benefits — not hard-set here.
 * Called from the Polar webhook when subscription.active fires.
 */
export async function provisionSubscription(
  userId: string,
  tier: SubscriptionTier
): Promise<void> {
  const now = new Date();

  await db.update(users)
    .set({
      subscriptionTier: tier,
      subscriptionStartedAt: now,
      creditsResetAt: now,
      subscriptionExpiresAt: null,
      dataPurgeAt: null,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  console.log(`Provisioned ${tier} subscription for user ${userId}`);
}

/**
 * Cancel a subscription. The user keeps features until the period end date.
 * Data purge is scheduled for 60 days after the period end.
 */
export async function cancelSubscription(
  userId: string,
  periodEnd?: Date
): Promise<void> {
  const expiresAt = periodEnd ?? new Date();
  const purgeAt = new Date(expiresAt.getTime() + DATA_PURGE_DAYS * 24 * 60 * 60 * 1000);

  await db.update(users)
    .set({
      subscriptionExpiresAt: expiresAt,
      dataPurgeAt: purgeAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  console.log(`Subscription canceled for user ${userId}, expires at ${expiresAt.toISOString()}, purge at ${purgeAt.toISOString()}`);
}

/**
 * End a subscription. Reverts user to the free tier.
 * Data purge is scheduled for 60 days from now.
 */
export async function endSubscription(userId: string): Promise<void> {
  const now = new Date();
  const purgeAt = new Date(now.getTime() + DATA_PURGE_DAYS * 24 * 60 * 60 * 1000);

  await db.update(users)
    .set({
      subscriptionTier: "free",
      subscriptionStartedAt: null,
      subscriptionExpiresAt: null,
      creditsResetAt: null,
      dataPurgeAt: purgeAt,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  console.log(`Subscription ended for user ${userId}, reverted to free tier, purge at ${purgeAt.toISOString()}`);
}
