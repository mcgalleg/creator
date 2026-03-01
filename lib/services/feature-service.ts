import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

import type { SubscriptionTier } from "@/lib/subscriptions";

/**
 * Get user's subscription tier from the database
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const result = await db
    .select({ subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return "free";
  }

  return result[0].subscriptionTier as SubscriptionTier;
}

