import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syncing Data — Not a Bot",
  description:
    "Keep your analytics up to date with full, incremental, and quick sync options.",
};

export default function SyncingPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <RefreshCw className="size-3" />
          Syncing Data
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Syncing Data</h1>
        <p className="text-lg text-muted-foreground">
          Keep your analytics up to date with flexible sync options. Each sync
          type is optimized for different use cases and costs a different number
          of credits.
        </p>
      </div>

      {/* Sync Types */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Full Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pulls all videos, comments, and metrics from your TikTok account.
              Best for initial setup or when you need a complete data refresh.
              Uses 3 sync credits.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incremental Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fetches only new and updated content since your last sync.
              Efficient for regular updates without re-downloading everything.
              Uses 1 sync credit.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A lightweight refresh that updates engagement metrics for recent
              videos without pulling full data. Ideal for checking latest stats.
              Uses 1 sync credit.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How Credits Work */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">How Sync Credits Work</h2>
        <p className="text-sm text-muted-foreground">
          Sync credits are consumed each time you sync data from TikTok. Your
          plan includes a monthly credit allowance that resets on your billing
          date. You can purchase additional credit packs at any time if you need
          more.
        </p>
      </div>
    </div>
  );
}
