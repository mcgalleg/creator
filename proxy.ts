import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protected routes require authentication
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

// Public routes: /, /api/auth/webhook (handled implicitly by not calling auth.protect())

export default clerkMiddleware(async (auth, req) => {
  // Protect dashboard routes - require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and webhook routes
    "/((?!_next|api/auth/webhook|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
