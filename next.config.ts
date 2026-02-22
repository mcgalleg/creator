import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
