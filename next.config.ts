import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.dev"],
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
  async redirects() {
    return [
      { source: '/dashboard', destination: '/workspace', permanent: true },
      { source: '/dashboard/:path*', destination: '/workspace/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
