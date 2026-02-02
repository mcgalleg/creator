import { db } from "@/lib/db";
import { users, featureFlags, userFeatureOverrides } from "@/lib/db/schema";
import { eq, and, or, isNull, gt } from "drizzle-orm";

export const FEATURES = {
  CANVAS: "canvas",
  ANALYTICS_ASSISTANT: "analytics_assistant",
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];
export type SubscriptionTier = "free" | "pro" | "enterprise";

const DEFAULT_TIER_FEATURES: Record<SubscriptionTier, FeatureKey[]> = {
  free: [],
  pro: [FEATURES.CANVAS, FEATURES.ANALYTICS_ASSISTANT],
  enterprise: [FEATURES.CANVAS, FEATURES.ANALYTICS_ASSISTANT],
};

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

/**
 * Check if a user has access to a specific feature
 * Priority: user override > feature flag tier settings > default tier features
 */
export async function hasFeatureAccess(
  userId: string,
  featureKey: FeatureKey
): Promise<boolean> {
  // 1. Check userFeatureOverrides first (with expiration handling)
  const override = await db
    .select({ enabled: userFeatureOverrides.enabled })
    .from(userFeatureOverrides)
    .where(
      and(
        eq(userFeatureOverrides.userId, userId),
        eq(userFeatureOverrides.featureKey, featureKey),
        or(
          isNull(userFeatureOverrides.expiresAt),
          gt(userFeatureOverrides.expiresAt, new Date())
        )
      )
    )
    .limit(1);

  if (override.length > 0) {
    return override[0].enabled;
  }

  // Get user's tier
  const tier = await getUserTier(userId);

  // 2. Check featureFlags table for tier-based access
  const featureFlag = await db
    .select({
      defaultEnabled: featureFlags.defaultEnabled,
      enabledForTiers: featureFlags.enabledForTiers,
    })
    .from(featureFlags)
    .where(eq(featureFlags.key, featureKey))
    .limit(1);

  if (featureFlag.length > 0) {
    const flag = featureFlag[0];
    const enabledTiers = flag.enabledForTiers as string[];

    // Check if user's tier is in the enabled tiers list
    if (enabledTiers.includes(tier)) {
      return true;
    }

    // Check default enabled status
    return flag.defaultEnabled;
  }

  // 3. Fall back to DEFAULT_TIER_FEATURES
  return DEFAULT_TIER_FEATURES[tier].includes(featureKey);
}

/**
 * Get all features and their access status for a user
 */
export async function getUserFeatures(
  userId: string
): Promise<Record<FeatureKey, boolean>> {
  const featureKeys = Object.values(FEATURES);
  const result: Record<string, boolean> = {};

  // Check access for each feature
  await Promise.all(
    featureKeys.map(async (key) => {
      result[key] = await hasFeatureAccess(userId, key);
    })
  );

  return result as Record<FeatureKey, boolean>;
}

/**
 * Get tier details for display in UI
 */
export function getTierDetails(tier: SubscriptionTier): {
  name: string;
  description: string;
  features: string[];
} {
  const tierDetails: Record<
    SubscriptionTier,
    { name: string; description: string; features: string[] }
  > = {
    free: {
      name: "Free",
      description: "Basic analytics with limited features",
      features: [
        "Basic dashboard metrics",
        "Up to 1 connected account",
        "7-day data retention",
      ],
    },
    pro: {
      name: "Pro",
      description: "Advanced analytics for serious creators",
      features: [
        "Canvas workspace for custom visualizations",
        "AI Analytics Assistant",
        "Up to 5 connected accounts",
        "30-day data retention",
        "Export reports",
      ],
    },
    enterprise: {
      name: "Enterprise",
      description: "Full-featured analytics for teams and agencies",
      features: [
        "Everything in Pro",
        "Unlimited connected accounts",
        "Unlimited data retention",
        "Team collaboration",
        "API access",
        "Priority support",
      ],
    },
  };

  return tierDetails[tier];
}
