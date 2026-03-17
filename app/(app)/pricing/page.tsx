"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Coins,
  ArrowLeft,
  ArrowRight,
  Zap,
  Sparkles,
  Check,
  Bot,
  RefreshCw,
  Plug,
} from "lucide-react";
import {
  CREDIT_PACKS,
  AI_TOKEN_PACKS,
  POLAR_PRODUCTS,
  POLAR_ANNUAL_PRODUCTS,
  POLAR_CREDIT_PRODUCTS,
  POLAR_AI_TOKEN_PRODUCTS,
  getTierDisplayInfo,
  TIER_AI_TOKENS,
  TIER_SYNC_CREDITS,
  TIER_ACCOUNT_LIMITS,
  TIER_MONTHLY_PRICE_CENTS,
  TIER_ANNUAL_PRICE_CENTS,
  DATA_PURGE_DAYS,
} from "@/lib/subscriptions";
import type { SubscriptionTier } from "@/lib/subscriptions";
import { ThemeToggle } from "@/components/theme-toggle";
import { AstriqLogo } from "@/components/astriq-logo";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function perCreditRate(credits: number, cents: number): string {
  return `$${(cents / 100 / credits).toFixed(3)}`;
}

function bestValuePackId(): string {
  let bestId = CREDIT_PACKS[0].id as string;
  let bestRate = CREDIT_PACKS[0].priceInCents / CREDIT_PACKS[0].credits;
  for (const pack of CREDIT_PACKS) {
    const rate = pack.priceInCents / pack.credits;
    if (rate < bestRate) {
      bestId = pack.id;
      bestRate = rate;
    }
  }
  return bestId;
}

function bestValueAiPackId(): string {
  let bestId = AI_TOKEN_PACKS[0].id as string;
  let bestRate = AI_TOKEN_PACKS[0].priceInCents / AI_TOKEN_PACKS[0].tokens;
  for (const pack of AI_TOKEN_PACKS) {
    const rate = pack.priceInCents / pack.tokens;
    if (rate < bestRate) {
      bestId = pack.id;
      bestRate = rate;
    }
  }
  return bestId;
}

function perTokenRate(tokens: number, cents: number): string {
  return `$${((cents / 100) / (tokens / 1000)).toFixed(3)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return tokens.toString();
}

function formatPriceCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const TIERS: { tier: SubscriptionTier; highlighted: boolean }[] = [
  { tier: "free", highlighted: false },
  { tier: "basic", highlighted: false },
  { tier: "pro", highlighted: true },
  { tier: "agency", highlighted: false },
  { tier: "mcp", highlighted: false },
];

export default function PricingPage() {
  const { user } = useUser();
  const bestValue = bestValuePackId();
  const bestValueAi = bestValueAiPackId();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    if (!user) {
      setCurrentTier(null);
      return;
    }
    fetch("/api/user/subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.subscriptionTier) {
          setCurrentTier(data.subscriptionTier as SubscriptionTier);
        }
      })
      .catch(() => {});
  }, [user]);

  function getCheckoutUrl(productId: string): string {
    if (!user || !productId) return "/pricing";
    const params = new URLSearchParams({
      products: productId,
      customerExternalId: user.id,
    });
    const email = user.primaryEmailAddress?.emailAddress;
    if (email) {
      params.set("customerEmail", email);
    }
    return `/api/checkout?${params.toString()}`;
  }

  function getTierProductId(tier: SubscriptionTier): string {
    const isAnnual = billing === "annual";
    if (isAnnual && tier in POLAR_ANNUAL_PRODUCTS) {
      return POLAR_ANNUAL_PRODUCTS[tier as keyof typeof POLAR_ANNUAL_PRODUCTS];
    }
    return POLAR_PRODUCTS[tier];
  }

  function tierPrice(tier: SubscriptionTier): string {
    if (tier === "mcp") return "Pay as you go";
    if (tier === "free") return "$0";
    const cents =
      billing === "annual"
        ? TIER_ANNUAL_PRICE_CENTS[tier]
        : TIER_MONTHLY_PRICE_CENTS[tier];
    return `${formatPriceCents(cents)}/mo`;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-3 md:px-4">
          <Link href="/" className="flex items-center gap-2">
            <AstriqLogo variant="combo" size="lg" />
          </Link>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <SignedIn>
              <Link href="/workspace">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="sm:hidden">Back</span>
                  <span className="hidden sm:inline">Back to Workspace</span>
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="sm">Sign In</Button>
              </SignInButton>
            </SignedOut>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto max-w-7xl px-4 py-16 text-center md:py-20">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-1 size-3" />
            Pricing
          </Badge>
          <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Choose the plan that fits your needs. Bring your own AI client or use our full dashboard.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="inline-flex items-center rounded-full border bg-muted p-1 gap-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  billing === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  billing === "annual"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
              </button>
            </div>
            {billing === "annual" && (
              <Badge variant="secondary" className="text-xs">
                Save 20%
              </Badge>
            )}
          </div>
        </section>

        {/* Subscription Plans */}
        <section className="container mx-auto max-w-7xl px-4 pb-16">
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            {TIERS.map(({ tier, highlighted }) => {
              const info = getTierDisplayInfo(tier);
              const aiTokens = TIER_AI_TOKENS[tier];
              const syncCredits = TIER_SYNC_CREDITS[tier];
              const accountLimit = TIER_ACCOUNT_LIMITS[tier];
              const isMcp = tier === "mcp";
              const isFree = tier === "free";
              const price = tierPrice(tier);
              const isCurrentTier = currentTier === tier;

              return (
                <Card
                  key={tier}
                  id={isMcp ? "mcp" : undefined}
                  className={`relative ${isCurrentTier ? "border-primary ring-2 ring-primary/20 shadow-md" : highlighted ? "border-primary shadow-md" : ""} ${isMcp ? "scroll-mt-20" : ""}`}
                >
                  {isCurrentTier ? (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Check className="mr-1 size-3" />
                      Current Plan
                    </Badge>
                  ) : highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{info.name}</CardTitle>
                    <CardDescription>{info.description}</CardDescription>
                    <p className="text-3xl font-bold pt-2">{price}</p>
                    {isMcp && (
                      <p className="text-sm text-muted-foreground">Buy sync credit packs</p>
                    )}
                    {billing === "annual" && !isMcp && !isFree && (
                      <p className="text-sm text-muted-foreground">
                        billed annually
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      {isMcp ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Plug className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>MCP server access</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Bring your own AI (Claude Desktop, ChatGPT, Claude Code)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Buy sync credit packs as needed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>{accountLimit} connected accounts</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>
                              {aiTokens > 0
                                ? `${formatTokens(aiTokens)} AI tokens/month`
                                : "No AI tokens"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>
                              {syncCredits > 0
                                ? `${syncCredits.toLocaleString()} sync credits/month`
                                : "No sync credits"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>
                              {accountLimit} connected{" "}
                              {(accountLimit as number) === 1 ? "account" : "accounts"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Canvas Workspace</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>AI Analytics Assistant</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Plug className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>MCP server access included</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    {isCurrentTier ? (
                      <Button asChild className="w-full" variant="secondary" disabled>
                        <Link href="/workspace">
                          <Check className="mr-2 h-4 w-4" />
                          Current Plan
                        </Link>
                      </Button>
                    ) : isFree ? (
                      <>
                        <SignedIn>
                          <Button asChild className="w-full" variant="outline">
                            <Link href="/workspace">
                              Go to Workspace
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </SignedIn>
                        <SignedOut>
                          <SignInButton mode="modal">
                            <Button className="w-full" variant="outline">
                              Sign Up Free
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </SignInButton>
                        </SignedOut>
                      </>
                    ) : (
                      <>
                        <SignedIn>
                          <Button
                            className="w-full"
                            variant={highlighted && !currentTier ? "default" : "outline"}
                            onClick={() => { window.location.href = getCheckoutUrl(getTierProductId(tier)); }}
                          >
                            {isMcp ? "Get Started" : "Subscribe"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </SignedIn>
                        <SignedOut>
                          <SignInButton mode="modal">
                            <Button
                              className="w-full"
                              variant={highlighted ? "default" : "outline"}
                            >
                              {isMcp ? "Sign in to Get Started" : "Sign in to Subscribe"}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </SignInButton>
                        </SignedOut>
                      </>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Data retained while subscribed. {DATA_PURGE_DAYS} days after cancellation, data is permanently deleted.
          </p>
        </section>

        <div className="container mx-auto max-w-6xl px-4">
          <Separator />
        </div>

        {/* Credit Packs Section */}
        <section id="credits" className="container mx-auto max-w-6xl px-4 py-16 scroll-mt-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Coins className="mr-1 size-3" />
              Sync Credit Packs
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Sync Credit Packs
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Purchase additional sync credits anytime. One-time purchases that
              never expire. Use them for syncing posts, comments, and more.
            </p>
            <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
              <Plug className="h-4 w-4" />
              <span>Works with all plans including MCP Apps</span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CREDIT_PACKS.map((pack) => {
              const isBestValue = pack.id === bestValue;
              const productId = POLAR_CREDIT_PRODUCTS[pack.id];

              return (
                <Card
                  key={pack.id}
                  className={
                    isBestValue
                      ? "relative border-primary shadow-md"
                      : "relative"
                  }
                >
                  {isBestValue && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Zap className="mr-1 size-3" />
                      Best Value
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">{pack.name}</CardTitle>
                    <CardDescription>
                      {pack.credits.toLocaleString()} sync credits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <p className="text-3xl font-bold">
                      {formatPrice(pack.priceInCents)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {perCreditRate(pack.credits, pack.priceInCents)} per
                      credit
                    </p>
                  </CardContent>
                  <CardFooter>
                    <SignedIn>
                      <Button
                        className="w-full"
                        variant={isBestValue ? "default" : "outline"}
                        onClick={() => { window.location.href = getCheckoutUrl(productId); }}
                      >
                        Buy Credits
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </SignedIn>
                    <SignedOut>
                      <SignInButton mode="modal">
                        <Button
                          className="w-full"
                          variant={isBestValue ? "default" : "outline"}
                        >
                          Sign in to Buy
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </SignInButton>
                    </SignedOut>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>

        <div className="container mx-auto max-w-6xl px-4">
          <Separator />
        </div>

        {/* AI Token Packs Section */}
        <section id="ai-tokens" className="container mx-auto max-w-6xl px-4 py-16 scroll-mt-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="mr-1 size-3" />
              AI Token Packs
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              AI Token Packs
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Need more AI tokens? Purchase additional tokens anytime. One-time
              purchases that never expire.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AI_TOKEN_PACKS.map((pack) => {
              const isBestValue = pack.id === bestValueAi;
              const productId = POLAR_AI_TOKEN_PRODUCTS[pack.id];

              return (
                <Card
                  key={pack.id}
                  className={
                    isBestValue
                      ? "relative border-primary shadow-md"
                      : "relative"
                  }
                >
                  {isBestValue && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Zap className="mr-1 size-3" />
                      Best Value
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">{pack.name}</CardTitle>
                    <CardDescription>
                      {formatTokens(pack.tokens)} AI tokens
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <p className="text-3xl font-bold">
                      {formatPrice(pack.priceInCents)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {perTokenRate(pack.tokens, pack.priceInCents)} per 1K
                      tokens
                    </p>
                  </CardContent>
                  <CardFooter>
                    <SignedIn>
                      <Button
                        className="w-full"
                        variant={isBestValue ? "default" : "outline"}
                        onClick={() => { window.location.href = getCheckoutUrl(productId); }}
                      >
                        Buy Tokens
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </SignedIn>
                    <SignedOut>
                      <SignInButton mode="modal">
                        <Button
                          className="w-full"
                          variant={isBestValue ? "default" : "outline"}
                        >
                          Sign in to Buy
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </SignInButton>
                    </SignedOut>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <AstriqLogo variant="combo" size="sm" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Built with AI. Designed for creators.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
