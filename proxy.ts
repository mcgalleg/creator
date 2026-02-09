import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Protected routes require authentication
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

// Public routes: /, /api/auth/webhook (handled implicitly by not calling auth.protect())

export default clerkMiddleware(async (auth, req) => {
  // Bypass auth entirely in test mode
  if (process.env.BYPASS_AUTH === "true") {
    return NextResponse.next();
  }

  // Redirect signed-in users from landing page to dashboard
  if (req.nextUrl.pathname === "/") {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Protect dashboard routes - require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and webhook routes
    "/((?!_next|api/auth/webhook|api/webhooks/polar|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
