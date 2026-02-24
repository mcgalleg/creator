import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans & Pricing — Astriq",
  description:
    "Compare Free, Creator, Pro, Agency, and MCP Apps subscription plans with features and pricing.",
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
          more capacity.
        </p>
      </div>

      {/* Plans */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Free</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold">
              $0
              <span className="text-sm font-normal text-muted-foreground">
                /month
              </span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>100K AI tokens per month</li>
              <li>50 sync credits per month</li>
              <li>1 TikTok account</li>
            </ul>
          </CardContent>
        </Card>
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
            <p className="text-xs text-muted-foreground">
              or $11.99/mo billed annually
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1M AI tokens per month</li>
              <li>500 sync credits per month</li>
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
            <p className="text-xs text-muted-foreground">
              or $23.99/mo billed annually
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>3M AI tokens per month</li>
              <li>1,500 sync credits per month</li>
              <li>15 TikTok accounts</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold">
              $59.99
              <span className="text-sm font-normal text-muted-foreground">
                /month
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              or $47.99/mo billed annually
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>10M AI tokens per month</li>
              <li>4,000 sync credits per month</li>
              <li>50 TikTok accounts</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MCP Apps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold">
              $0
              <span className="text-sm font-normal text-muted-foreground">
                {" "}pay as you go
              </span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Bring your own AI client (BYOC)</li>
              <li>Buy sync credit packs as needed</li>
              <li>10 TikTok accounts</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Data retained while subscribed. 60 days after cancellation, data is permanently deleted.
      </p>
    </div>
  );
}
