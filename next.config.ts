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
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.clerk.accounts.dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: *.tiktokcdn.com *.tiktokcdn-us.com *.tiktokcdn-eu.com *.clerk.com; connect-src 'self' *.clerk.accounts.dev *.clerk.com *.polar.sh vitals.vercel-insights.com; font-src 'self'; frame-src 'self' *.clerk.accounts.dev" },
      ],
    }];
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/workspace', permanent: true },
      { source: '/dashboard/:path*', destination: '/workspace/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
