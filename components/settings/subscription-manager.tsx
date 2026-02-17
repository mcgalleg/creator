"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Crown, ArrowRight, Calendar, Coins, Bot, XCircle, Plug } from "lucide-react";
import { getTierDisplayInfo, TIER_AI_TOKENS, TIER_SYNC_CREDITS } from "@/lib/subscriptions";
import type { SubscriptionTier } from "@/lib/subscriptions";

interface UserSubscriptionData {
  subscriptionTier: SubscriptionTier;
  subscriptionStartedAt: string | null;
  subscriptionExpiresAt: string | null;
  creditsResetAt: string | null;
}

const TIER_BADGE_VARIANT: Record<SubscriptionTier, "secondary" | "default" | "outline"> = {
  free: "outline",
  basic: "secondary",
  pro: "default",
  mcp: "secondary",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function SubscriptionManager() {
  useUser();
  const [data, setData] = useState<UserSubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/user/subscription");
        if (res.ok) {
          setData(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  async function handleCancel() {
    setCanceling(true);
    try {
      const res = await fetch("/api/user/subscription/cancel", { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        // Update local state to reflect the pending cancellation
        if (data && result.expiresAt) {
          setData({ ...data, subscriptionExpiresAt: result.expiresAt });
        }
        // Refresh to get the latest state from the webhook
        window.location.reload();
      }
    } finally {
      setCanceling(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  const tier = data?.subscriptionTier ?? "free";
  const tierInfo = getTierDisplayInfo(tier);
  const monthlySyncCredits = TIER_SYNC_CREDITS[tier];
  const monthlyAiTokens = TIER_AI_TOKENS[tier];
  const isMcp = tier === "mcp";
  const isPaid = tier !== "free" && !isMcp;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isMcp ? (
                <Plug className="h-5 w-5 text-primary" />
              ) : (
                <Crown className="h-5 w-5 text-primary" />
              )}
              Subscription
            </CardTitle>
            <CardDescription className="mt-1">
              {tierInfo.description}
              {" "}
              <Link href="/docs/pricing" className="text-primary hover:underline text-xs">
                Learn more
              </Link>
            </CardDescription>
          </div>
          <Badge variant={TIER_BADGE_VARIANT[tier]}>
            {tierInfo.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* MCP tier: simplified info */}
        {isMcp ? (
          <>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <Coins className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Buy credit packs as needed</p>
                <p className="text-xs text-muted-foreground">
                  No monthly allocation — purchase sync credits a la carte
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Bring your own AI</p>
                <p className="text-xs text-muted-foreground">
                  Use Claude Desktop, ChatGPT, or any MCP-compatible client
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Monthly allocations */}
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <Coins className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {monthlySyncCredits > 0
                    ? `${monthlySyncCredits.toLocaleString()} sync credits/month`
                    : "No monthly sync credits"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {monthlySyncCredits > 0
                    ? "Included with your plan"
                    : "Upgrade for monthly credits"}
                </p>
              </div>
            </div>

            {monthlyAiTokens > 0 && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {(monthlyAiTokens / 1000).toLocaleString()}K AI tokens/month
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Included with your plan
                  </p>
                </div>
              </div>
            )}

            {/* Billing dates */}
            {isPaid && data?.subscriptionExpiresAt && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Next billing date
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(data.subscriptionExpiresAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Credit reset date */}
            {isPaid && data?.creditsResetAt && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Credits reset</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(data.creditsResetAt)}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Account limits */}
        <div className="text-sm text-muted-foreground">
          Up to {tierInfo.accountLimit} connected{" "}
          {(tierInfo.accountLimit as number) === 1 ? "account" : "accounts"}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {isMcp ? (
          <Button asChild variant="outline" className="w-full">
            <Link href="/pricing">
              Switch to Creator or Pro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <>
            <Button asChild variant={isPaid ? "outline" : "default"} className="w-full">
              <Link href="/pricing">
                {isPaid ? "Change Plan" : "Upgrade Plan"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {isPaid && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel your {tierInfo.name} subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your subscription will remain active until the end of your current billing period
                      {data?.subscriptionExpiresAt && (
                        <> ({formatDate(data.subscriptionExpiresAt)})</>
                      )}
                      . After that, you&apos;ll lose access to paid features.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={canceling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {canceling ? "Canceling..." : "Cancel Subscription"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
