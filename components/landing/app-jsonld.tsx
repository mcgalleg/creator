const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://astriq.app";

export function AppJsonLd() {
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
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier with 50 sync credits and 100K AI tokens per month",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
