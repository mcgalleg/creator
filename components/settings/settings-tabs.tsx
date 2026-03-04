"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { SubscriptionTier } from "@/lib/subscriptions";

const TabSkeleton = () => <Skeleton className="h-48 w-full" />;
const CreditBalanceTab = dynamic(() => import("./credit-balance-tab").then(m => ({ default: m.CreditBalanceTab })), { loading: TabSkeleton });
const TransactionHistoryTab = dynamic(() => import("./transaction-history-tab").then(m => ({ default: m.TransactionHistoryTab })), { loading: TabSkeleton });
const GoalsTab = dynamic(() => import("./goals-tab").then(m => ({ default: m.GoalsTab })), { loading: TabSkeleton });
const SubscriptionManager = dynamic(() => import("./subscription-manager").then(m => ({ default: m.SubscriptionManager })), { loading: TabSkeleton });
const McpConnectionSetup = dynamic(() => import("./mcp-configuration").then(m => ({ default: m.McpConnectionSetup })), { loading: TabSkeleton });

const VALID_TABS = ["plan", "goals", "credits", "transactions"] as const;
type SettingsTab = (typeof VALID_TABS)[number];

interface SettingsTabsProps {
  tier: SubscriptionTier;
  goals: string[];
  tab?: string;
}

function toValidTab(value: string | undefined): SettingsTab {
  return VALID_TABS.includes(value as SettingsTab) ? (value as SettingsTab) : "plan";
}

function SettingsTabsInner({ tier, goals, tab }: SettingsTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => toValidTab(tab));

  const handleTabChange = (value: string) => {
    setActiveTab(value as SettingsTab);
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
        <TabsTrigger value="goals">Goals</TabsTrigger>
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

      <TabsContent value="goals" className="mt-4">
        <GoalsTab initialGoals={goals} />
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

export function SettingsTabs({ tier, goals, tab }: SettingsTabsProps) {
  return <SettingsTabsInner tier={tier} goals={goals} tab={tab} />;
}
