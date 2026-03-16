const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://astriq.app";

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Astriq",
    url: BASE_URL,
    logo: `${BASE_URL}/astriq-logo-dark.png`,
    description:
      "AI-powered TikTok analytics platform for content creators.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
