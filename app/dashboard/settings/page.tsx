import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AccountInfo } from "@/components/settings/account-info";
import { CreditDisplay } from "@/components/settings/credit-display";
import { ConnectedAccountsPreview } from "@/components/settings/connected-accounts-preview";
import { DangerZone } from "@/components/settings/danger-zone";

export const metadata = {
  title: "Settings | Creator Analytics",
  description: "Manage your account settings and preferences",
};

function AccountInfoSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-60 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-4 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

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

        {/* Account Info Section */}
        <section>
          <Suspense fallback={<AccountInfoSkeleton />}>
            <AccountInfo />
          </Suspense>
        </section>

        {/* Credit Balance and Connected Accounts - Side by side on larger screens */}
        <section className="grid gap-6 md:grid-cols-2">
          <CreditDisplay />
          <ConnectedAccountsPreview />
        </section>

        <Separator />

        {/* Danger Zone */}
        <section>
          <DangerZone />
        </section>
      </div>
    </div>
  );
}
