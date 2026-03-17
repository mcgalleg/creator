"use client";

import { usePathname } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://astriq.app";

const PAGE_NAMES: Record<string, string> = {
  "/docs": "Documentation",
  "/docs/getting-started": "Getting Started",
  "/docs/ai-copilot": "AI Copilot",
  "/docs/sync-credits": "Sync Credits",
  "/docs/ai-tokens": "AI Tokens",
  "/docs/accounts": "Managing Accounts",
  "/docs/connectors": "Connectors",
  "/docs/billing": "Billing & Plans",
};

export function DocsBreadcrumbJsonLd() {
  const pathname = usePathname();

  const items: { name: string; url: string }[] = [
    { name: "Home", url: BASE_URL },
    { name: "Docs", url: `${BASE_URL}/docs` },
  ];

  if (pathname !== "/docs") {
    const name = PAGE_NAMES[pathname] || pathname.split("/").pop() || "";
    items.push({ name, url: `${BASE_URL}${pathname}` });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
