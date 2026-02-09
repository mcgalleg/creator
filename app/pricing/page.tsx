"use client";

import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import {
  CREDIT_PACKS,
  POLAR_PRODUCTS,
  POLAR_CREDIT_PRODUCTS,
  getTierDisplayInfo,
  TIER_AI_TOKENS,
  TIER_SYNC_CREDITS,
  TIER_ACCOUNT_LIMITS,
  TIER_DATA_RETENTION,
} from "@/lib/subscriptions";
import type { SubscriptionTier } from "@/lib/subscriptions";
import { ThemeToggle } from "@/components/theme-toggle";

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

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return tokens.toString();
}

const TIERS: { tier: SubscriptionTier; price: string; highlighted: boolean }[] = [
  { tier: "free", price: "Free", highlighted: false },
  { tier: "basic", price: "$14.99/mo", highlighted: true },
  { tier: "pro", price: "$29.99/mo", highlighted: false },
];

export default function PricingPage() {
  const { user } = useUser();
  const bestValue = bestValuePackId();

  function getCheckoutUrl(productId: string): string {
    if (!user) return "/pricing";
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

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-3 md:px-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Not a Bot"
              width={120}
              height={40}
              className="h-16 pb-2 w-auto dark:invert"
              priority
            />
          </div>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
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
        <section className="container mx-auto max-w-6xl px-4 py-16 text-center md:py-20">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-1 size-3" />
            Pricing
          </Badge>
          <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </section>

        {/* Subscription Plans */}
        <section className="container mx-auto max-w-5xl px-4 pb-16">
          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map(({ tier, price, highlighted }) => {
              const info = getTierDisplayInfo(tier);
              const aiTokens = TIER_AI_TOKENS[tier];
              const syncCredits = TIER_SYNC_CREDITS[tier];
              const accountLimit = TIER_ACCOUNT_LIMITS[tier];
              const dataRetention = TIER_DATA_RETENTION[tier];
              const productId = tier !== "free" ? POLAR_PRODUCTS[tier] : null;

              return (
                <Card
                  key={tier}
                  className={highlighted ? "relative border-primary shadow-md" : "relative"}
                >
                  {highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{info.name}</CardTitle>
                    <CardDescription>{info.description}</CardDescription>
                    <p className="text-3xl font-bold pt-2">{price}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
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
                            : "250 one-time signup credits"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {accountLimit} connected{" "}
                          {accountLimit === 1 ? "account" : "accounts"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{dataRetention}-day data retention</span>
                      </div>
                      {tier !== "free" && (
                        <>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Canvas Workspace</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>AI Analytics Assistant</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Export Reports</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    {tier === "free" ? (
                      <SignedOut>
                        <SignInButton mode="modal">
                          <Button variant="outline" className="w-full">
                            Start 14-Day Pro Trial
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </SignInButton>
                      </SignedOut>
                    ) : (
                      <>
                        <SignedIn>
                          <Button
                            asChild
                            className="w-full"
                            variant={highlighted ? "default" : "outline"}
                          >
                            <a href={productId ? getCheckoutUrl(productId) : "#"}>
                              Subscribe
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        </SignedIn>
                        <SignedOut>
                          <SignInButton mode="modal">
                            <Button
                              className="w-full"
                              variant={highlighted ? "default" : "outline"}
                            >
                              Sign in to Subscribe
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
        </section>

        <div className="container mx-auto max-w-5xl px-4">
          <Separator />
        </div>

        {/* Credit Packs Section */}
        <section id="credits" className="container mx-auto max-w-5xl px-4 py-16 scroll-mt-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Coins className="mr-1 size-3" />
              Sync Credit Packs
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Need More Sync Credits?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Purchase additional sync credits anytime. One-time purchases that
              never expire. Use them for syncing posts, comments, and more.
            </p>
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
                        asChild
                        className="w-full"
                        variant={isBestValue ? "default" : "outline"}
                      >
                        <a href={productId ? getCheckoutUrl(productId) : "#"}>
                          Buy Credits
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
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
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Not a Bot"
                width={100}
                height={33}
                className="h-6 w-auto dark:invert"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Built with AI. Designed for creators.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
