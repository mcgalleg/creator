import { Suspense } from "react";
import { auth, isAuthBypassed, hasFeature, FEATURES } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tiktokAccounts, users } from "@/lib/db/schema";
import { CompactHeader } from "@/components/dashboard/compact-header";
import { ResponsiveLayout } from "@/components/dashboard/responsive-layout";
import { Loader2 } from "lucide-react";
import { CreditsProvider } from "@/components/dashboard/credits-provider";
import { FeatureAccessProvider } from "@/contexts/feature-context";
import { SyncProvider } from "@/contexts/sync-context";
import { ensureUserExists } from "@/lib/services/user-service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // Only redirect to sign-in if not in bypass mode
  if (!userId && !isAuthBypassed()) {
    redirect("/sign-in");
  }

  // Ensure user exists in the database (auto-provisions from Clerk if missing)
  if (userId) {
    await ensureUserExists(userId);
  }

  // Fetch user's TikTok accounts, onboarding status, and subscription tier
  const accounts = userId
    ? await db
        .select({
          id: tiktokAccounts.id,
          username: tiktokAccounts.username,
          avatarUrl: tiktokAccounts.avatarUrl,
        })
        .from(tiktokAccounts)
        .where(eq(tiktokAccounts.userId, userId))
    : [];

  const userRecord = userId
    ? await db
        .select({
          onboardingCompletedAt: users.onboardingCompletedAt,
          subscriptionTier: users.subscriptionTier,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
    : [];

  const onboardingCompletedAt = userRecord[0]?.onboardingCompletedAt ?? null;
  const subscriptionTier = userRecord[0]?.subscriptionTier ?? "free";
  const showOnboarding = accounts.length === 0 && !onboardingCompletedAt;

  if (showOnboarding) {
    redirect("/onboarding");
  }

  // MCP tier users: redirect from /dashboard to /dashboard/mcp
  if (subscriptionTier === "mcp") {
    const hdrs = await headers();
    const url = new URL(hdrs.get("x-url") || hdrs.get("x-invoke-path") || "/dashboard", "http://localhost");
    const pathname = url.pathname;
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      redirect("/dashboard/mcp");
    }
  }

  // Resolve feature access server-side via Clerk has() (DB fallback in bypass mode)
  let features: Record<string, boolean> = {
    canvas: false,
    analytics_assistant: false,
  };

  if (userId) {
    const [canvasAccess, chatAccess] = await Promise.all([
      hasFeature(FEATURES.CANVAS),
      hasFeature(FEATURES.ANALYTICS_ASSISTANT),
    ]);
    features = {
      canvas: canvasAccess,
      analytics_assistant: chatAccess,
    };
  }

  return (
    <FeatureAccessProvider features={features}>
      <CreditsProvider>
        <SyncProvider>
          <div className="h-screen flex flex-col overflow-hidden">
            <CompactHeader subscriptionTier={subscriptionTier} />
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              }>
                <ResponsiveLayout accounts={accounts}>
                  {children}
                </ResponsiveLayout>
              </Suspense>
            </div>
          </div>
        </SyncProvider>
      </CreditsProvider>
    </FeatureAccessProvider>
  );
}
