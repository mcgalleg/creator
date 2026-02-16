import { redirect } from "next/navigation";
import { auth, isAuthBypassed } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, tiktokAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Plug } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { McpConnectionSetup } from "@/components/settings/mcp-configuration";
import { ConnectedAccountsPreview } from "@/components/settings/connected-accounts-preview";
import { CreditDisplay } from "@/components/settings/credit-display";
import { McpPlanInfo } from "./plan-info";

export const metadata = {
  title: "MCP Hub | Creator Analytics",
  description: "Connect your AI clients to your TikTok analytics",
};

export default async function McpHubPage() {
  const { userId } = await auth();

  if (!userId && !isAuthBypassed()) {
    redirect("/sign-in");
  }

  // Verify user is on MCP tier (or allow any tier to visit this page for now)
  const userRecord = userId
    ? await db
        .select({
          subscriptionTier: users.subscriptionTier,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
    : [];

  const tier = userRecord[0]?.subscriptionTier ?? "free";

  const accounts = userId
    ? await db
        .select({
          id: tiktokAccounts.id,
          username: tiktokAccounts.username,
        })
        .from(tiktokAccounts)
        .where(eq(tiktokAccounts.userId, userId))
    : [];

  return (
    <div className="container max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Plug className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">MCP Hub</h1>
            <p className="text-muted-foreground">
              Connect your AI clients to your TikTok analytics
            </p>
          </div>
        </div>

        <Separator />

        {/* MCP Connection Setup (primary section) */}
        <section>
          <McpConnectionSetup />
        </section>

        {/* Connected Accounts + Sync Credits side by side */}
        <section className="grid gap-6 md:grid-cols-2">
          <ConnectedAccountsPreview />
          <CreditDisplay />
        </section>

        {/* Plan Info */}
        <section>
          <McpPlanInfo
            tier={tier}
            accountCount={accounts.length}
          />
        </section>
      </div>
    </div>
  );
}
