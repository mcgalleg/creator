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
import { Coins, ArrowRight, TrendingUp, TrendingDown, Gift, Calendar, Sparkles } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { TIER_SYNC_CREDITS, TIER_AI_TOKENS } from "@/lib/subscriptions";
import type { SubscriptionTier } from "@/lib/subscriptions";

interface SubscriptionInfo {
  subscriptionTier: SubscriptionTier;
  creditsResetAt: string | null;
}

interface CreditTransaction {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

function formatTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    sync_posts: "Posts Sync",
    sync_comments: "Comments Sync",
    purchase: "Purchase",
    refund: "Refund",
    signup_bonus: "Signup Bonus",
    ai_chat: "AI Chat",
  };
  return typeMap[type] || type;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

function TransactionIcon({ type, amount }: { type: string; amount: number }) {
  if (type === "signup_bonus" || type === "refund") {
    return <Gift className="h-4 w-4 text-green-500" />;
  }
  if (amount > 0) {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  }
  return <TrendingDown className="h-4 w-4 text-red-500" />;
}

export function CreditDisplay() {
  const { balance, aiTokens, loading: creditsLoading, error: creditsError } = useCredits();
  const [pricing, setPricing] = useState<Record<string, { rate: number; description: string }> | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [extraLoading, setExtraLoading] = useState(true);

  const loading = creditsLoading || extraLoading;
  const error = creditsError;

  useEffect(() => {
    async function fetchData() {
      try {
        const [creditsRes, historyRes, subRes] = await Promise.all([
          fetch("/api/credits"),
          fetch("/api/credits/history?limit=3"),
          fetch("/api/user/subscription"),
        ]);

        if (creditsRes.ok) {
          const credits = await creditsRes.json();
          setPricing(credits.pricing);
        }

        if (historyRes.ok) {
          const history = await historyRes.json();
          setTransactions(history.transactions || []);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Balance</CardTitle>
        <CardDescription>Your available credits for syncing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-6">
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
        {subInfo && (TIER_SYNC_CREDITS[subInfo.subscriptionTier] > 0 || TIER_AI_TOKENS[subInfo.subscriptionTier] > 0) && (
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
                  <> &middot; Resets {formatDate(subInfo.creditsResetAt)}</>
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

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Transactions</p>
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <TransactionIcon type={tx.type} amount={tx.amount} />
                    <div>
                      <p className="text-sm font-medium">
                        {formatTransactionType(tx.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-medium ${
                      tx.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/pricing#credits">
            Purchase Credits
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
