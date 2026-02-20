import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans & Pricing — Astriq",
  description:
    "Compare Creator and Pro subscription plans with features and pricing.",
};

export default function PricingPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <CreditCard className="size-3" />
          Plans & Pricing
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Subscription Plans
        </h1>
        <p className="text-lg text-muted-foreground">
          Choose the plan that fits your needs. All plans include access to the
          core dashboard, canvas workspace, and AI Copilot — higher tiers unlock
          more capacity and longer data retention.
        </p>
      </div>

      {/* Plans */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Creator</CardTitle>
              <Badge variant="secondary" className="text-xs">
                Popular
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold">
              $14.99
              <span className="text-sm font-normal text-muted-foreground">
                /month
              </span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1M AI tokens per month</li>
              <li>250 sync credits per month</li>
              <li>30-day data retention</li>
              <li>5 TikTok accounts</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold">
              $29.99
              <span className="text-sm font-normal text-muted-foreground">
                /month
              </span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>3M AI tokens per month</li>
              <li>750 sync credits per month</li>
              <li>90-day data retention</li>
              <li>25 TikTok accounts</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
