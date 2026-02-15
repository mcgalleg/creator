import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 2678400, // 31 days — TikTok CDN URLs expire, so cache optimized images longer
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.tiktokcdn.com",
      },
      {
        protocol: "https",
        hostname: "*.tiktokcdn-eu.com",
      },
      {
        protocol: "https",
        hostname: "*.tiktokcdn-us.com",
      },
    ],
  },
  serverExternalPackages: ["remotion", "@remotion/player", "@remotion/media", "@remotion/media-utils"],
};

export default nextConfig;
