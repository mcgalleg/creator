import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { tiktokAccounts, users } from "@/lib/db/schema";
import { OnboardingFlow } from "@/components/onboarding";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if onboarding is already complete
  const accounts = await db
    .select({ id: tiktokAccounts.id })
    .from(tiktokAccounts)
    .where(and(eq(tiktokAccounts.userId, userId), eq(tiktokAccounts.status, "active")))
    .limit(1);

  const userRecord = await db
    .select({ onboardingCompletedAt: users.onboardingCompletedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const onboardingCompletedAt = userRecord[0]?.onboardingCompletedAt ?? null;

  if (accounts.length > 0 || onboardingCompletedAt) {
    redirect("/workspace");
  }

  return <OnboardingFlow />;
}
