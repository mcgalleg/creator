import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 2678400, // 31 days — cache optimized images longer
    localPatterns: [
      {
        pathname: "/**",
      },
      {
        pathname: "/api/image",
        search: "?url=*",
      },
    ],
  },
  serverExternalPackages: ["remotion", "@remotion/player", "@remotion/media", "@remotion/media-utils"],
};

export default nextConfig;
