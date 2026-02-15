import Link from "next/link";
import { Check, Bot, RefreshCw } from "lucide-react";
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
  type SubscriptionTier,
} from "@/lib/subscriptions";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return n.toString();
}

const TIERS: { tier: SubscriptionTier; price: string; highlighted?: boolean }[] = [
  { tier: "basic", price: "$14.99/mo", highlighted: true },
  { tier: "pro", price: "$29.99/mo" },
];

export function PricingPreview() {
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
            Start with a free 7-day trial. No credit card required.
          </p>
        </AnimateOnScroll>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {TIERS.map(({ tier, price, highlighted }, idx) => {
            const info = getTierDisplayInfo(tier);
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
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3 text-sm">
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
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      variant={highlighted ? "default" : "outline"}
                      className="w-full"
                    >
                      <Link href="/pricing">See Full Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </AnimateOnScroll>
            );
          })}
        </div>

        <div className="text-center mt-8 space-y-4">
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg">Start Your Free 7-Day Trial</Button>
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
