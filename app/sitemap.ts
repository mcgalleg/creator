import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://astriq.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, priority: 1.0, changeFrequency: "weekly" },
    { url: `${BASE_URL}/pricing`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/docs`, priority: 0.7, changeFrequency: "monthly" },
    {
      url: `${BASE_URL}/docs/getting-started`,
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/docs/ai-copilot`,
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/docs/sync-credits`,
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/docs/ai-tokens`,
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/docs/accounts`,
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/docs/connectors`,
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/docs/billing`,
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/features/engagement-analytics`,
      priority: 0.8,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/features/audience-insights`,
      priority: 0.8,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/features/video-analytics`,
      priority: 0.8,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/features/content-strategy`,
      priority: 0.8,
      changeFrequency: "monthly",
    },
    { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE_URL}/terms`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE_URL}/support`, priority: 0.5, changeFrequency: "monthly" },
  ];
}
