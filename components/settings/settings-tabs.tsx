"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubscriptionManager } from "@/components/settings/subscription-manager";
import { McpConnectionSetup } from "@/components/settings/mcp-configuration";
import { CreditBalanceTab } from "@/components/settings/credit-balance-tab";
import { TransactionHistoryTab } from "@/components/settings/transaction-history-tab";
import type { SubscriptionTier } from "@/lib/subscriptions";

const VALID_TABS = ["plan", "credits", "transactions"] as const;
type SettingsTab = (typeof VALID_TABS)[number];

function SettingsTabsInner({ tier }: { tier: SubscriptionTier }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get("tab");
  const activeTab: SettingsTab = VALID_TABS.includes(rawTab as SettingsTab)
    ? (rawTab as SettingsTab)
    : "plan";

  const handleTabChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value === "plan") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", value);
    }
    router.replace(url.pathname + url.search, { scroll: false });
  };

  const isMcp = tier === "mcp";
  const showMcpConfig = isMcp || tier === "basic" || tier === "pro";

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="w-full">
        <TabsTrigger value="plan">Plan</TabsTrigger>
        <TabsTrigger value="credits">Credits</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
      </TabsList>

      <TabsContent value="plan" className="space-y-6 mt-4">
        {isMcp && (
          <section>
            <McpConnectionSetup />
          </section>
        )}

        <section>
          <SubscriptionManager />
        </section>

        <section>
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
        </section>

        {showMcpConfig && !isMcp && (
          <section>
            <McpConnectionSetup compact />
          </section>
        )}
      </TabsContent>

      <TabsContent value="credits" className="mt-4">
        <CreditBalanceTab />
      </TabsContent>

      <TabsContent value="transactions" className="mt-4">
        <TransactionHistoryTab />
      </TabsContent>
    </Tabs>
  );
}

export function SettingsTabs({ tier }: { tier: SubscriptionTier }) {
  return (
    <Suspense>
      <SettingsTabsInner tier={tier} />
    </Suspense>
  );
}
