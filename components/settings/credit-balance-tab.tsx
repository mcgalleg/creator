"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Coins, ArrowRight, Calendar, Sparkles } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { TIER_SYNC_CREDITS, TIER_AI_TOKENS } from "@/lib/subscriptions";
import type { SubscriptionTier } from "@/lib/subscriptions";
import { formatRelativeDate } from "@/lib/transaction-utils";

interface SubscriptionInfo {
  subscriptionTier: SubscriptionTier;
  creditsResetAt: string | null;
}

export function CreditBalanceTab() {
  const { balance, aiTokens, loading: creditsLoading, error: creditsError } = useCredits();
  const [pricing, setPricing] = useState<Record<string, { rate: number; description: string }> | null>(null);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [extraLoading, setExtraLoading] = useState(true);

  const loading = creditsLoading || extraLoading;
  const error = creditsError;

  useEffect(() => {
    async function fetchData() {
      try {
        const [creditsRes, subRes] = await Promise.all([
          fetch("/api/credits"),
          fetch("/api/user/subscription"),
        ]);

        if (creditsRes.ok) {
          const credits = await creditsRes.json();
          setPricing(credits.pricing);
        }

        if (subRes.ok) {
          setSubInfo(await subRes.json());
        }
      } finally {
        setExtraLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Balance</CardTitle>
          <CardDescription>Your available credits for syncing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Balance</CardTitle>
          <CardDescription>Your available credits for syncing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const isMcp = subInfo?.subscriptionTier === "mcp";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Balance</CardTitle>
        <CardDescription>
          Your available credits for syncing.{" "}
          <Link href="/docs/credits" className="text-primary hover:underline">
            How credits work
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-6">
          {/* AI tokens - hidden for MCP tier */}
          {!isMcp && (
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-4xl font-bold">
                  {aiTokens !== null
                    ? aiTokens >= 1_000_000
                      ? `${(aiTokens / 1_000_000).toFixed(1)}M`
                      : aiTokens >= 1000
                        ? `${Math.round(aiTokens / 1000)}K`
                        : aiTokens
                    : "—"}
                </p>
                <p className="text-sm text-muted-foreground">AI tokens remaining</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Coins className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-4xl font-bold">{balance}</p>
              <p className="text-sm text-muted-foreground">Sync credits available</p>
            </div>
          </div>
        </div>

        {/* Monthly allocations & reset */}
        {subInfo && !isMcp && (TIER_SYNC_CREDITS[subInfo.subscriptionTier] > 0 || TIER_AI_TOKENS[subInfo.subscriptionTier] > 0) && (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="text-sm space-y-0.5">
              {TIER_AI_TOKENS[subInfo.subscriptionTier] > 0 && (
                <p>
                  <span className="font-medium">
                    {TIER_AI_TOKENS[subInfo.subscriptionTier].toLocaleString()} AI tokens/month
                  </span>
                </p>
              )}
              {TIER_SYNC_CREDITS[subInfo.subscriptionTier] > 0 && (
                <p>
                  <span className="font-medium">
                    {TIER_SYNC_CREDITS[subInfo.subscriptionTier].toLocaleString()} sync credits/month
                  </span>
                </p>
              )}
              <p className="text-muted-foreground">
                {subInfo.subscriptionTier.charAt(0).toUpperCase() + subInfo.subscriptionTier.slice(1)} plan
                {subInfo.creditsResetAt && (
                  <> &middot; Resets {formatRelativeDate(subInfo.creditsResetAt)}</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Credit Pricing */}
        {pricing && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Credit Costs:</p>
            <div className="grid gap-2 text-sm">
              {Object.entries(pricing).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-1 border-b border-border/50 last:border-0"
                >
                  <span className="text-muted-foreground">{value.description}</span>
                  <Badge variant="secondary">{value.rate} credits</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/pricing#credits">
            Purchase Sync Credits
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        {!isMcp && (
          <Button asChild className="flex-1">
            <Link href="/pricing#ai-tokens">
              Purchase AI Tokens
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
