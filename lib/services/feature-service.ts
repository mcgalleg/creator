import { cache } from "react";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

import type { SubscriptionTier } from "@/lib/subscriptions";

/**
 * Get user's subscription tier from the database.
 * Wrapped with React.cache() for per-request deduplication — multiple calls
 * with the same userId within a single server render hit the DB only once.
 */
export const getUserTier = cache(async (userId: string): Promise<SubscriptionTier> => {
  const result = await db
    .select({ subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return "free";
  }

  return result[0].subscriptionTier as SubscriptionTier;
});

