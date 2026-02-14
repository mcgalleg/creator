import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
