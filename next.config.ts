import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const sandboxOrigin = process.env.NEXT_PUBLIC_MCP_SANDBOX_ORIGIN || "";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
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
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.clerk.accounts.dev *.clerk.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: *.tiktokcdn.com *.tiktokcdn-us.com *.tiktokcdn-eu.com *.clerk.com https://img.clerk.com https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com; connect-src 'self' *.clerk.accounts.dev *.clerk.com https://clerk-telemetry.com https://*.clerk-telemetry.com *.polar.sh vitals.vercel-insights.com https://esm.sh https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; font-src 'self' https://esm.sh; frame-src 'self' blob: *.clerk.accounts.dev *.clerk.com https://challenges.cloudflare.com${sandboxOrigin ? ` ${sandboxOrigin}` : ""}; worker-src 'self' blob:` },
    ];
    return [
      {
        // Apply security headers to all routes EXCEPT the sandbox proxy
        // and render endpoint. When running without a separate sandbox
        // origin, the proxy is served from the same origin and the inner
        // iframe needs to load MCP App CDN scripts without our CSP.
        source: "/((?!sandbox/|api/connectors/render).*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/workspace', permanent: true },
      { source: '/dashboard/:path*', destination: '/workspace/:path*', permanent: true },
    ];
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
