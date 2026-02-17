import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multi-Account Management — Not a Bot",
  description:
    "Manage multiple TikTok accounts from a single Not a Bot dashboard.",
};

export default function AccountsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <Users className="size-3" />
          Multi-Account
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Multi-Account Management
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage multiple TikTok accounts from a single Not a Bot dashboard.
          Perfect for agencies, brands, or creators with multiple channels.
        </p>
      </div>

      {/* Account Limits */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Creator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">5</p>
            <p className="text-sm text-muted-foreground">TikTok accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">25</p>
            <p className="text-sm text-muted-foreground">TikTok accounts</p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Switch between accounts instantly from the dashboard. Each account
        maintains its own sync schedule, analytics history, and data retention
        period.
      </p>
    </div>
  );
}
