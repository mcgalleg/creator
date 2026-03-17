import {
  TIER_MONTHLY_PRICE_CENTS,
  TIER_SYNC_CREDITS,
  TIER_AI_TOKENS,
  type SubscriptionTier,
} from "@/lib/subscriptions";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://astriq.app";

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: "Free",
  basic: "Creator",
  pro: "Pro",
  agency: "Agency",
  mcp: "MCP Apps",
};

function tierDescription(tier: SubscriptionTier): string {
  const credits = TIER_SYNC_CREDITS[tier];
  const tokens = TIER_AI_TOKENS[tier];
  if (tier === "mcp") return "Bring your own AI client — pay-as-you-go sync credits";
  if (tier === "free")
    return `Free tier with ${credits} sync credits and ${(tokens / 1000).toLocaleString()}K AI tokens per month`;
  return `${credits.toLocaleString()} sync credits and ${(tokens / 1_000_000).toLocaleString()}M AI tokens per month`;
}

export function AppJsonLd() {
  const offers = (Object.keys(TIER_LABELS) as SubscriptionTier[]).map(
    (tier) => ({
      "@type": "Offer" as const,
      name: TIER_LABELS[tier],
      price: (TIER_MONTHLY_PRICE_CENTS[tier] / 100).toFixed(2),
      priceCurrency: "USD",
      description: tierDescription(tier),
    })
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Astriq",
    url: BASE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-powered TikTok analytics platform for content creators. Get actionable insights on your videos, audience, and engagement.",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: (TIER_MONTHLY_PRICE_CENTS.agency / 100).toFixed(2),
      priceCurrency: "USD",
      offerCount: offers.length,
      offers,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
