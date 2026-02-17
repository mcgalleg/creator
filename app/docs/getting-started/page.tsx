import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Getting Started — Not a Bot",
  description:
    "Get up and running with Not a Bot in just a few minutes. Connect your TikTok account and start analyzing your content.",
};

export default function GettingStartedPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <Rocket className="size-3" />
          Getting Started
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Getting Started</h1>
        <p className="text-lg text-muted-foreground">
          Get up and running with Not a Bot in just a few minutes. Follow these
          steps to connect your TikTok account and start analyzing your content.
        </p>
      </div>

      {/* Steps */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Create Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sign up using your email, Google, or Apple account through our
              secure Clerk authentication. No credit card required to get
              started.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Connect TikTok</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Link your TikTok account through the Accounts page. We use
              TikTok&apos;s official API to securely access your public
              analytics data.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Run Your First Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Trigger a full sync to pull in your videos, comments, and
              engagement metrics. This initial sync provides a complete snapshot
              of your account.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. Explore Your Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Every new account starts with a 7-day free trial with full access
              to all features including AI Copilot, Canvas, and advanced
              analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
