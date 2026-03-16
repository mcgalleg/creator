import { Suspense } from "react";
import { auth, isAuthBypassed, hasFeature, FEATURES } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { tiktokAccounts, users } from "@/lib/db/schema";
import { CompactHeader } from "@/components/dashboard/compact-header";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import { Loader2 } from "lucide-react";
import { CreditsProvider } from "@/components/dashboard/credits-provider";
import { FeatureAccessProvider } from "@/contexts/feature-context";
import { SyncProvider } from "@/contexts/sync-context";
import { ensureUserExists } from "@/lib/services/user-service";
import { proxyImageUrl } from "@/lib/image-proxy";

export default async function WorkspaceRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // Only redirect to sign-in if not in bypass mode
  if (!userId && !isAuthBypassed()) {
    redirect("/sign-in");
  }

  // Ensure user exists in the database (auto-provisions from Clerk if missing).
  // Must complete before data queries since they depend on the user record.
  if (userId) {
    await ensureUserExists(userId);
  }

  // Fetch accounts, user record, and feature access in parallel
  const [rawAccounts, userRecord, canvasAccess, chatAccess] = await Promise.all([
    userId
      ? db
          .select({
            id: tiktokAccounts.id,
            username: tiktokAccounts.username,
            avatarUrl: tiktokAccounts.avatarUrl,
          })
          .from(tiktokAccounts)
          .where(and(eq(tiktokAccounts.userId, userId), eq(tiktokAccounts.status, "active")))
      : Promise.resolve([]),
    userId
      ? db
          .select({
            onboardingCompletedAt: users.onboardingCompletedAt,
            subscriptionTier: users.subscriptionTier,
            goals: users.goals,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
      : Promise.resolve([]),
    userId ? hasFeature(FEATURES.CANVAS) : Promise.resolve(false),
    userId ? hasFeature(FEATURES.ANALYTICS_ASSISTANT) : Promise.resolve(false),
  ]);
  const accounts = rawAccounts.map((a) => ({
    ...a,
    avatarUrl: proxyImageUrl(a.avatarUrl),
  }));

  const onboardingCompletedAt = userRecord[0]?.onboardingCompletedAt ?? null;
  const subscriptionTier = userRecord[0]?.subscriptionTier ?? "free";
  const goals = (userRecord[0]?.goals as string[] | null) ?? [];
  const showOnboarding = accounts.length === 0 && !onboardingCompletedAt;

  if (showOnboarding) {
    redirect("/onboarding");
  }

  // MCP tier users: redirect from /workspace to /workspace/mcp
  if (subscriptionTier === "mcp") {
    const hdrs = await headers();
    const url = new URL(hdrs.get("x-url") || hdrs.get("x-invoke-path") || "/workspace", "http://localhost");
    const pathname = url.pathname;
    if (pathname === "/workspace" || pathname === "/workspace/") {
      redirect("/workspace/mcp");
    }
  }

  const features: Record<string, boolean> = {
    canvas: canvasAccess,
    analytics_assistant: chatAccess,
  };

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
                <WorkspaceLayout accounts={accounts} goals={goals}>
                  {children}
                </WorkspaceLayout>
              </Suspense>
            </div>
          </div>
        </SyncProvider>
      </CreditsProvider>
    </FeatureAccessProvider>
  );
}
