import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type SubscriptionTier = "free" | "basic" | "pro" | "mcp";

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
      name: "Unsubscribed",
      description: "No active subscription",
      features: [
        "No monthly sync credits",
        "No monthly AI tokens",
        "No connected accounts",
        "No data retention",
      ],
    },
    pro: {
      name: "Pro",
      description: "Advanced analytics for serious creators",
      features: [
        "Canvas workspace for custom visualizations",
        "AI Analytics Assistant",
        "750 monthly sync credits",
        "3M monthly AI tokens",
        "Up to 25 connected accounts",
        "90-day data retention",
        "Export reports",
      ],
    },
    basic: {
      name: "Creator",
      description: "Essential analytics for growing creators",
      features: [
        "Canvas workspace for custom visualizations",
        "AI Analytics Assistant",
        "250 monthly sync credits",
        "1M monthly AI tokens",
        "Up to 5 connected accounts",
        "30-day data retention",
        "Export reports",
      ],
    },
    mcp: {
      name: "MCP Apps",
      description: "Bring your own AI client",
      features: [
        "MCP server access for external AI clients",
        "Up to 10 connected accounts",
        "90-day data retention",
        "Buy sync credit packs as needed",
      ],
    },
  };

  return tierDetails[tier];
}
