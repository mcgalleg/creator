"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Bot, RefreshCw, Plug, Coins, Zap } from "lucide-react";
import { SignUpButton, SignedOut } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";
import {
  getTierDisplayInfo,
  TIER_AI_TOKENS,
  TIER_SYNC_CREDITS,
  TIER_ACCOUNT_LIMITS,
  TIER_DATA_RETENTION,
  CREDIT_PACKS,
  type SubscriptionTier,
} from "@/lib/subscriptions";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return n.toString();
}

const TIERS: { tier: SubscriptionTier; price: string; priceNote?: string; highlighted?: boolean }[] = [
  { tier: "mcp" as SubscriptionTier, price: "Pay as you go", priceNote: "Buy sync credit packs" },
  { tier: "basic", price: "$14.99/mo", highlighted: true },
  { tier: "pro", price: "$29.99/mo" },
];

type Tab = "plans" | "credits";

// Find the pack with the lowest per-credit rate for the "Best Value" badge
const bestValuePackId = CREDIT_PACKS.reduce((best, pack) => {
  const bestRate = best.priceInCents / best.credits;
  const currentRate = pack.priceInCents / pack.credits;
  return currentRate < bestRate ? pack : best;
}, CREDIT_PACKS[0]).id;

export function PricingPreview() {
  const [activeTab, setActiveTab] = useState<Tab>("plans");

  return (
    <section id="pricing" className="bg-background py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <AnimateOnScroll className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Pricing
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Bring your own AI client or use our full dashboard. Start exploring with free starter credits.
          </p>
        </AnimateOnScroll>

        {/* Tab switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center rounded-full border bg-muted p-1 gap-1">
            <button
              onClick={() => setActiveTab("plans")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                activeTab === "plans"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab("credits")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                activeTab === "credits"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sync Credit Packs
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        {activeTab === "plans" && (
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {TIERS.map(({ tier, price, priceNote, highlighted }, idx) => {
              const info = getTierDisplayInfo(tier);
              const isMcp = tier === "mcp";
              return (
                <AnimateOnScroll key={tier} delay={idx * 100}>
                  <Card
                    className={`relative h-full ${
                      highlighted
                        ? "border-primary shadow-md"
                        : ""
                    }`}
                  >
                    {highlighted && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{info.name}</CardTitle>
                      <CardDescription>{info.description}</CardDescription>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">{price}</span>
                      </div>
                      {priceNote && (
                        <p className="text-sm text-muted-foreground">{priceNote}</p>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-3 text-sm">
                        {isMcp ? (
                          <>
                            <li className="flex items-center gap-2">
                              <Plug className="size-4 text-primary shrink-0" />
                              MCP server access
                            </li>
                            <li className="flex items-center gap-2">
                              <Bot className="size-4 text-primary shrink-0" />
                              Bring your own AI client
                            </li>
                            <li className="flex items-center gap-2">
                              <RefreshCw className="size-4 text-primary shrink-0" />
                              Buy sync credit packs as needed
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="size-4 text-primary shrink-0" />
                              {TIER_ACCOUNT_LIMITS[tier]} connected accounts
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="size-4 text-primary shrink-0" />
                              {TIER_DATA_RETENTION[tier]}-day data retention
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-center gap-2">
                              <Bot className="size-4 text-primary shrink-0" />
                              {formatTokens(TIER_AI_TOKENS[tier])} AI tokens/month
                            </li>
                            <li className="flex items-center gap-2">
                              <RefreshCw className="size-4 text-primary shrink-0" />
                              {TIER_SYNC_CREDITS[tier]} sync credits/month
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="size-4 text-primary shrink-0" />
                              {TIER_ACCOUNT_LIMITS[tier]} connected{" "}
                              {(TIER_ACCOUNT_LIMITS[tier] as number) === 1
                                ? "account"
                                : "accounts"}
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="size-4 text-primary shrink-0" />
                              {TIER_DATA_RETENTION[tier]}-day data retention
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="size-4 text-primary shrink-0" />
                              Canvas Workspace
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="size-4 text-primary shrink-0" />
                              AI Analytics
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="size-4 text-primary shrink-0" />
                              Export Reports
                            </li>
                            <li className="flex items-center gap-2">
                              <Plug className="size-4 text-primary shrink-0" />
                              MCP server access included
                            </li>
                          </>
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        asChild
                        variant={highlighted ? "default" : "outline"}
                        className="w-full"
                      >
                        <Link href="/pricing">{isMcp ? "Get Started" : "See Full Details"}</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </AnimateOnScroll>
              );
            })}
          </div>
        )}

        {/* Sync Credit Packs */}
        {activeTab === "credits" && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
              {CREDIT_PACKS.map((pack, idx) => {
                const perCredit = pack.priceInCents / pack.credits;
                const isBestValue = pack.id === bestValuePackId;
                return (
                  <AnimateOnScroll key={pack.id} delay={idx * 100}>
                    <Card
                      className={`relative h-full ${
                        isBestValue ? "border-primary shadow-md" : ""
                      }`}
                    >
                      {isBestValue && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                          Best Value
                        </Badge>
                      )}
                      <CardHeader>
                        <CardTitle className="text-lg">{pack.name}</CardTitle>
                        <CardDescription>
                          {pack.credits} sync credits
                        </CardDescription>
                        <div className="mt-2">
                          <span className="text-3xl font-bold">
                            ${(pack.priceInCents / 100).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ${perCredit.toFixed(2)}/credit
                        </p>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-center gap-2">
                            <Coins className="size-4 text-primary shrink-0" />
                            {pack.credits} sync credits
                          </li>
                          <li className="flex items-center gap-2">
                            <Zap className="size-4 text-primary shrink-0" />
                            One-time purchase
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="size-4 text-primary shrink-0" />
                            Credits never expire
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button
                          asChild
                          variant={isBestValue ? "default" : "outline"}
                          className="w-full"
                        >
                          <Link href="/pricing">Buy Credits</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </AnimateOnScroll>
                );
              })}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Works with all plans including MCP Apps
            </p>
          </>
        )}

        <div className="text-center mt-8 space-y-4">
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg">Get Started</Button>
            </SignUpButton>
          </SignedOut>
          <div>
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Compare all features &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
