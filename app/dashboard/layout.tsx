import { auth, isAuthBypassed } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tiktokAccounts } from "@/lib/db/schema";
import { CompactHeader } from "@/components/dashboard/compact-header";
import { ResponsiveLayout } from "@/components/dashboard/responsive-layout";
import { CreditsProvider } from "@/components/dashboard/credits-provider";
import { FeatureProvider } from "@/contexts/feature-context";
import { getUserFeatures, getUserTier } from "@/lib/services/feature-service";
import type { FeatureKey, SubscriptionTier } from "@/lib/services/feature-service";
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

  // Fetch user's TikTok accounts for the layout
  const accounts = userId
    ? await db
        .select({
          id: tiktokAccounts.id,
          username: tiktokAccounts.username,
        })
        .from(tiktokAccounts)
        .where(eq(tiktokAccounts.userId, userId))
    : [];

  // Fetch user tier and features server-side
  let tier: SubscriptionTier = "free";
  let features: Record<FeatureKey, boolean> = {
    canvas: false,
    analytics_assistant: false,
  };

  if (userId) {
    [tier, features] = await Promise.all([
      getUserTier(userId),
      getUserFeatures(userId),
    ]);
  }

  return (
    <FeatureProvider tier={tier} features={features}>
      <CreditsProvider>
        <div className="h-screen flex flex-col overflow-hidden">
          <CompactHeader />
          <div className="flex-1 overflow-hidden">
            <ResponsiveLayout accounts={accounts}>
              {children}
            </ResponsiveLayout>
          </div>
        </div>
      </CreditsProvider>
    </FeatureProvider>
  );
}
