import { redirect } from "next/navigation";
import { auth, isAuthBypassed } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export const metadata = {
  title: "Settings | Creator Analytics",
  description: "Manage your account settings and preferences",
};

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId && !isAuthBypassed()) {
    redirect("/sign-in");
  }

  // Fetch subscription tier and goals
  const userRecord = userId
    ? await db
        .select({ subscriptionTier: users.subscriptionTier, goals: users.goals })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
    : [];

  const tier = userRecord[0]?.subscriptionTier ?? "free";
  const goals = (userRecord[0]?.goals as string[] | null) ?? [];

  return (
    <div className="container max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
        </div>

        <Separator />

        <SettingsTabs tier={tier} goals={goals} />
      </div>
    </div>
  );
}
