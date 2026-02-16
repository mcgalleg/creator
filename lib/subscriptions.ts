// ─── Subscription Configuration (single source of truth) ─────────────────────

export type SubscriptionTier = "free" | "basic" | "pro" | "mcp";

// Polar product ID mappings
export const POLAR_PRODUCTS = {
  free: process.env.NEXT_PUBLIC_POLAR_PRODUCT_FREE!,
  basic: process.env.NEXT_PUBLIC_POLAR_PRODUCT_BASIC!,
  pro: process.env.NEXT_PUBLIC_POLAR_PRODUCT_PRO!,
  mcp: process.env.NEXT_PUBLIC_POLAR_PRODUCT_MCP!,
};

export const POLAR_CREDIT_PRODUCTS: Record<string, string> = {
  starter: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_STARTER!,
  value: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_VALUE!,
  power: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_POWER!,
  bulk: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_BULK!,
};

// Monthly AI token allocations per tier
export const TIER_AI_TOKENS = {
  free: 0,
  basic: 1_000_000,
  pro: 3_000_000,
  mcp: 0,
} as const satisfies Record<SubscriptionTier, number>;

// Monthly sync credit allocations per tier
export const TIER_SYNC_CREDITS = {
  free: 0,
  basic: 250,
  pro: 750,
  mcp: 0,
} as const satisfies Record<SubscriptionTier, number>;

// Account limits per tier
export const TIER_ACCOUNT_LIMITS = {
  free: 0,
  basic: 5,
  pro: 25,
  mcp: 10,
} as const satisfies Record<SubscriptionTier, number>;

// Data retention in days per tier
export const TIER_DATA_RETENTION = {
  free: 0,
  basic: 30,
  pro: 90,
  mcp: 90,
} as const satisfies Record<SubscriptionTier, number>;

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
      name: "Unsubscribed",
      description: "No active subscription",
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
    mcp: {
      name: "MCP Apps",
      description: "Bring your own AI client",
      monthlyAiTokens: TIER_AI_TOKENS.mcp,
      monthlySyncCredits: TIER_SYNC_CREDITS.mcp,
      accountLimit: TIER_ACCOUNT_LIMITS.mcp,
      dataRetention: TIER_DATA_RETENTION.mcp,
    },
  } as const;

  return info[tier];
}
