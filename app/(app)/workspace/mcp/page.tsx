import { redirect } from "next/navigation";
import { auth, isAuthBypassed } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, tiktokAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { Plug, Users, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { McpConnectionSetup } from "@/components/settings/mcp-configuration";
import { CreditBalanceTab } from "@/components/settings/credit-balance-tab";
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
        .where(and(eq(tiktokAccounts.userId, userId), eq(tiktokAccounts.status, "active")))
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
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your linked TikTok accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/workspace/accounts">
                  Manage Accounts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <CreditBalanceTab />
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
