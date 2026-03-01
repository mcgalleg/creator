import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Protected routes require authentication
const isProtectedRoute = createRouteMatcher(["/workspace(.*)", "/onboarding"]);

// Public routes: /, /api/auth/webhook (handled implicitly by not calling auth.protect())

export default clerkMiddleware(async (auth, req) => {
  // Bypass auth entirely in test mode
  if (process.env.BYPASS_AUTH === "true") {
    return NextResponse.next();
  }

  // Protect dashboard and onboarding routes - require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, webhook routes, image proxy, and .well-known endpoints
    "/((?!_next|api/auth/webhook|api/webhooks/polar|api/cron/expire-starters|api/image|api/mcp-app|\\.well-known|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
