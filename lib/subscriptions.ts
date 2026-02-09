// ─── Subscription Configuration (single source of truth) ─────────────────────

export type SubscriptionTier = "free" | "basic" | "pro";

// Polar product ID mappings
export const POLAR_PRODUCTS = {
  free: process.env.NEXT_PUBLIC_POLAR_PRODUCT_FREE!,
  basic: process.env.NEXT_PUBLIC_POLAR_PRODUCT_BASIC!,
  pro: process.env.NEXT_PUBLIC_POLAR_PRODUCT_PRO!,
};

export const POLAR_CREDIT_PRODUCTS: Record<string, string> = {
  starter: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_STARTER!,
  value: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_VALUE!,
  power: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_POWER!,
  bulk: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_BULK!,
};

// Monthly AI token allocations per tier
export const TIER_AI_TOKENS = {
  free: 50_000,
  basic: 1_000_000,
  pro: 3_000_000,
} as const satisfies Record<SubscriptionTier, number>;

// Monthly sync credit allocations per tier
export const TIER_SYNC_CREDITS = {
  free: 20,
  basic: 250,
  pro: 750,
} as const satisfies Record<SubscriptionTier, number>;

// Account limits per tier
export const TIER_ACCOUNT_LIMITS = {
  free: 1,
  basic: 5,
  pro: 25,
} as const satisfies Record<SubscriptionTier, number>;

// Data retention in days per tier
export const TIER_DATA_RETENTION = {
  free: 7,
  basic: 30,
  pro: 90,
} as const satisfies Record<SubscriptionTier, number>;

// Trial configuration
export const TRIAL_DURATION_DAYS = 14;

// Credit pack definitions for Polar one-time purchases (sync credits only)
export const CREDIT_PACKS = [
  { id: "starter", name: "Starter", credits: 100, priceInCents: 499 },
  { id: "value", name: "Value", credits: 300, priceInCents: 999 },
  { id: "power", name: "Power", credits: 750, priceInCents: 1999 },
  { id: "bulk", name: "Bulk", credits: 1500, priceInCents: 3499 },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];

export function getCreditPack(packId: string) {
  return CREDIT_PACKS.find((p) => p.id === packId);
}

// Display info for pricing pages and settings
export function getTierDisplayInfo(tier: SubscriptionTier) {
  const info = {
    free: {
      name: "Free",
      description: "Get started with basic features",
      monthlyAiTokens: TIER_AI_TOKENS.free,
      monthlySyncCredits: TIER_SYNC_CREDITS.free,
      accountLimit: TIER_ACCOUNT_LIMITS.free,
      dataRetention: TIER_DATA_RETENTION.free,
    },
    basic: {
      name: "Creator",
      description: "For growing creators",
      monthlyAiTokens: TIER_AI_TOKENS.basic,
      monthlySyncCredits: TIER_SYNC_CREDITS.basic,
      accountLimit: TIER_ACCOUNT_LIMITS.basic,
      dataRetention: TIER_DATA_RETENTION.basic,
    },
    pro: {
      name: "Pro",
      description: "For professional creators and agencies",
      monthlyAiTokens: TIER_AI_TOKENS.pro,
      monthlySyncCredits: TIER_SYNC_CREDITS.pro,
      accountLimit: TIER_ACCOUNT_LIMITS.pro,
      dataRetention: TIER_DATA_RETENTION.pro,
    },
  } as const;

  return info[tier];
}
