import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Re-export SubscriptionTier from the single source of truth
export type { SubscriptionTier } from "@/lib/subscriptions";
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
      description: "Get started for free",
      features: [
        "100K monthly AI tokens",
        "50 monthly sync credits",
        "1 connected account",
        "Canvas workspace",
        "AI Analytics Assistant",
        "Export reports",
      ],
    },
    basic: {
      name: "Creator",
      description: "Essential analytics for growing creators",
      features: [
        "Canvas workspace for custom visualizations",
        "AI Analytics Assistant",
        "500 monthly sync credits",
        "1M monthly AI tokens",
        "Up to 5 connected accounts",
        "Export reports",
      ],
    },
    pro: {
      name: "Pro",
      description: "Advanced analytics for serious creators",
      features: [
        "Canvas workspace for custom visualizations",
        "AI Analytics Assistant",
        "1,500 monthly sync credits",
        "3M monthly AI tokens",
        "Up to 15 connected accounts",
        "Export reports",
      ],
    },
    agency: {
      name: "Agency",
      description: "For agencies and teams",
      features: [
        "Canvas workspace for custom visualizations",
        "AI Analytics Assistant",
        "4,000 monthly sync credits",
        "10M monthly AI tokens",
        "Up to 50 connected accounts",
        "Export reports",
      ],
    },
    mcp: {
      name: "MCP Apps",
      description: "Bring your own AI client",
      features: [
        "MCP server access for external AI clients",
        "Up to 10 connected accounts",
        "Buy sync credit packs as needed",
      ],
    },
  };

  return tierDetails[tier];
}
