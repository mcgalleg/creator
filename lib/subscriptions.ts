// ─── Subscription Configuration (single source of truth) ─────────────────────

export type SubscriptionTier = "free" | "basic" | "pro" | "agency" | "mcp";

// Polar product ID mappings (monthly)
// Lazy-validated: env vars are read at module load (inlined by Next.js for
// NEXT_PUBLIC_*), but validated on first access so missing vars surface a
// clear error instead of silent undefined.
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function lazyEnvObject<T extends Record<string, string>>(
  mapping: Record<keyof T, string>
): T {
  let cached: T | null = null;
  return new Proxy({} as T, {
    get(_target, prop: string) {
      if (!cached) {
        cached = Object.fromEntries(
          Object.entries(mapping).map(([key, envName]) => [key, requiredEnv(envName)])
        ) as T;
      }
      return cached[prop as keyof T];
    },
    ownKeys() {
      if (!cached) {
        cached = Object.fromEntries(
          Object.entries(mapping).map(([key, envName]) => [key, requiredEnv(envName)])
        ) as T;
      }
      return Object.keys(cached);
    },
    getOwnPropertyDescriptor(_target, prop: string) {
      if (!cached) {
        cached = Object.fromEntries(
          Object.entries(mapping).map(([key, envName]) => [key, requiredEnv(envName)])
        ) as T;
      }
      if (prop in cached) {
        return { configurable: true, enumerable: true, value: cached[prop as keyof T] };
      }
      return undefined;
    },
  });
}

export const POLAR_PRODUCTS = lazyEnvObject<Record<SubscriptionTier, string>>({
  free: "NEXT_PUBLIC_POLAR_PRODUCT_FREE",
  basic: "NEXT_PUBLIC_POLAR_PRODUCT_BASIC",
  pro: "NEXT_PUBLIC_POLAR_PRODUCT_PRO",
  agency: "NEXT_PUBLIC_POLAR_PRODUCT_AGENCY",
  mcp: "NEXT_PUBLIC_POLAR_PRODUCT_MCP",
});

export const POLAR_ANNUAL_PRODUCTS = lazyEnvObject<Record<string, string>>({
  basic: "NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_BASIC",
  pro: "NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_PRO",
  agency: "NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_AGENCY",
});

export const POLAR_CREDIT_PRODUCTS: Record<string, string> = lazyEnvObject<Record<string, string>>({
  starter: "NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_STARTER",
  value: "NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_VALUE",
  power: "NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_POWER",
  bulk: "NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_BULK",
});

export const POLAR_AI_TOKEN_PRODUCTS: Record<string, string> = lazyEnvObject<Record<string, string>>({
  ai_starter: "NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_STARTER",
  ai_value: "NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_VALUE",
  ai_power: "NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_POWER",
  ai_bulk: "NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_BULK",
});

// Monthly AI token allocations per tier
export const TIER_AI_TOKENS = {
  free: 100_000,
  basic: 1_000_000,
  pro: 3_000_000,
  agency: 10_000_000,
  mcp: 0,
} as const satisfies Record<SubscriptionTier, number>;

// Monthly sync credit allocations per tier
export const TIER_SYNC_CREDITS = {
  free: 50,
  basic: 500,
  pro: 1_500,
  agency: 4_000,
  mcp: 0,
} as const satisfies Record<SubscriptionTier, number>;

// Account limits per tier
export const TIER_ACCOUNT_LIMITS = {
  free: 1,
  basic: 5,
  pro: 15,
  agency: 50,
  mcp: 10,
} as const satisfies Record<SubscriptionTier, number>;

// Days after cancellation before data is purged
export const DATA_PURGE_DAYS = 60;

// Monthly prices in cents
export const TIER_MONTHLY_PRICE_CENTS = {
  free: 0,
  basic: 1499,
  pro: 2999,
  agency: 5999,
  mcp: 0,
} as const satisfies Record<SubscriptionTier, number>;

// Annual prices in cents (per month)
export const TIER_ANNUAL_PRICE_CENTS = {
  free: 0,
  basic: 1199,
  pro: 2399,
  agency: 4799,
  mcp: 0,
} as const satisfies Record<SubscriptionTier, number>;

// Credit pack definitions for Polar one-time purchases (sync credits only)
export const CREDIT_PACKS = [
  { id: "starter", name: "Starter", credits: 250, priceInCents: 499 },
  { id: "value", name: "Value", credits: 600, priceInCents: 999 },
  { id: "power", name: "Power", credits: 1500, priceInCents: 1999 },
  { id: "bulk", name: "Bulk", credits: 3000, priceInCents: 3499 },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];

export function getCreditPack(packId: string) {
  return CREDIT_PACKS.find((p) => p.id === packId);
}

// AI token pack definitions for Polar one-time purchases
export const AI_TOKEN_PACKS = [
  { id: "ai_starter", name: "Starter", tokens: 250_000, priceInCents: 299 },
  { id: "ai_value", name: "Value", tokens: 1_000_000, priceInCents: 899 },
  { id: "ai_power", name: "Power", tokens: 3_000_000, priceInCents: 1999 },
  { id: "ai_bulk", name: "Bulk", tokens: 10_000_000, priceInCents: 4999 },
] as const;

export type AiTokenPackId = (typeof AI_TOKEN_PACKS)[number]["id"];

export function getAiTokenPack(packId: string) {
  return AI_TOKEN_PACKS.find((p) => p.id === packId);
}

// Display info for pricing pages and settings
export function getTierDisplayInfo(tier: SubscriptionTier) {
  const info = {
    free: {
      name: "Free",
      description: "Get started for free",
      monthlyAiTokens: TIER_AI_TOKENS.free,
      monthlySyncCredits: TIER_SYNC_CREDITS.free,
      accountLimit: TIER_ACCOUNT_LIMITS.free,
    },
    basic: {
      name: "Creator",
      description: "For growing creators",
      monthlyAiTokens: TIER_AI_TOKENS.basic,
      monthlySyncCredits: TIER_SYNC_CREDITS.basic,
      accountLimit: TIER_ACCOUNT_LIMITS.basic,
    },
    pro: {
      name: "Pro",
      description: "For professional creators",
      monthlyAiTokens: TIER_AI_TOKENS.pro,
      monthlySyncCredits: TIER_SYNC_CREDITS.pro,
      accountLimit: TIER_ACCOUNT_LIMITS.pro,
    },
    agency: {
      name: "Agency",
      description: "For agencies and teams",
      monthlyAiTokens: TIER_AI_TOKENS.agency,
      monthlySyncCredits: TIER_SYNC_CREDITS.agency,
      accountLimit: TIER_ACCOUNT_LIMITS.agency,
    },
    mcp: {
      name: "MCP Apps",
      description: "Bring your own AI client",
      monthlyAiTokens: TIER_AI_TOKENS.mcp,
      monthlySyncCredits: TIER_SYNC_CREDITS.mcp,
      accountLimit: TIER_ACCOUNT_LIMITS.mcp,
    },
  } as const;

  return info[tier];
}
