import { auth, isAuthBypassed, hasFeature, FEATURES } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tiktokAccounts, users } from "@/lib/db/schema";
import { CompactHeader } from "@/components/dashboard/compact-header";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { ResponsiveLayout } from "@/components/dashboard/responsive-layout";
import { OnboardingFlow } from "@/components/onboarding";
import { CreditsProvider } from "@/components/dashboard/credits-provider";
import { FeatureAccessProvider } from "@/contexts/feature-context";
import { SyncProvider } from "@/contexts/sync-context";
import { ensureUserExists } from "@/lib/services/user-service";
import { getTrialInfo } from "@/lib/services/trial-service";

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

  // Fetch user's TikTok accounts and onboarding status
  const accounts = userId
    ? await db
        .select({
          id: tiktokAccounts.id,
          username: tiktokAccounts.username,
        })
        .from(tiktokAccounts)
        .where(eq(tiktokAccounts.userId, userId))
    : [];

  const userRecord = userId
    ? await db
        .select({ onboardingCompletedAt: users.onboardingCompletedAt })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
    : [];

  const onboardingCompletedAt = userRecord[0]?.onboardingCompletedAt ?? null;
  const showOnboarding = accounts.length === 0 && !onboardingCompletedAt;

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

  const trialInfo = userId ? await getTrialInfo(userId) : null;

  return (
    <FeatureAccessProvider features={features}>
      <CreditsProvider>
        <SyncProvider>
          <div className="h-screen flex flex-col overflow-hidden">
            <CompactHeader />
            {trialInfo?.isOnTrial && trialInfo.trialEndsAt && (
              <TrialBanner
                trialEndsAt={trialInfo.trialEndsAt.toISOString()}
                daysRemaining={trialInfo.daysRemaining}
              />
            )}
            <div className="flex-1 overflow-hidden">
              {showOnboarding ? (
                <div className="h-full overflow-auto">
                  <OnboardingFlow />
                </div>
              ) : (
                <ResponsiveLayout accounts={accounts}>
                  {children}
                </ResponsiveLayout>
              )}
            </div>
          </div>
        </SyncProvider>
      </CreditsProvider>
    </FeatureAccessProvider>
  );
}
