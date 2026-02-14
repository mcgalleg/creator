"use client";

import { useState, useEffect, useCallback } from "react";
import { useOnSyncCompleted, useSync } from "@/contexts/sync-context";
import { UserCircle, RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboardData, Period } from "@/hooks/use-dashboard-data";
import { DashboardKPIs } from "./dashboard-kpis";
import { DashboardEngagementChart } from "./dashboard-engagement-chart";
import { DashboardTopContent } from "./dashboard-top-content";
import { DashboardRecentPosts } from "./dashboard-recent-posts";
import { DashboardBreakdownChart } from "./dashboard-breakdown-chart";

interface DefaultDashboardProps {
  accounts: Array<{ id: number; username: string; avatarUrl: string | null }>;
}

export function DefaultDashboard({ accounts }: DefaultDashboardProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    accounts.length > 0 ? accounts[0].id : null
  );
  const [period, setPeriod] = useState<Period>("30d");

  // Update selected account if accounts list changes
  useEffect(() => {
    if (accounts.length > 0 && selectedAccountId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional initialization from async data
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const { data, isLoading, error, refetch } = useDashboardData({
    accountId: selectedAccountId,
    period,
  });

  const { isSyncing } = useSync();

  // Auto-refetch dashboard data when a sync completes
  useOnSyncCompleted(useCallback(() => refetch(), [refetch]));

  // Show skeletons while syncing and dashboard has no data yet
  const hasData = (data.recentPosts?.total ?? 0) > 0;
  const showSkeleton = isLoading || (isSyncing && !hasData);

  // Empty state when no accounts
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          No accounts connected
        </p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Connect a TikTok account to see your analytics, engagement trends, and content performance.
        </p>
        <Button asChild className="mt-4 gap-2">
          <Link href="/dashboard/accounts">
            <Plus className="h-4 w-4" />
            Connect Account
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Account Selector */}
          <Select
            value={selectedAccountId?.toString() ?? ""}
            onValueChange={(value) => setSelectedAccountId(Number(value))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select account">
                {(() => {
                  const acct = accounts.find((a) => a.id === selectedAccountId);
                  if (!acct) return null;
                  return (
                    <div className="flex items-center gap-2">
                      {acct.avatarUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- External TikTok avatar URL
                        <img src={acct.avatarUrl} alt={acct.username} className="h-5 w-5 rounded-full" />
                      )}
                      <span className="truncate">@{acct.username}</span>
                    </div>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  <div className="flex items-center gap-2">
                    {account.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- External TikTok avatar URL
                      <img src={account.avatarUrl} alt={account.username} className="h-5 w-5 rounded-full" />
                    )}
                    <span>@{account.username}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Period Selector */}
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                Error loading dashboard data
              </p>
              <p className="text-sm text-destructive/80 mt-1">{error.message}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {showSkeleton ? (
        <DashboardLoadingSkeleton />
      ) : (
        <>
          {/* KPIs - 4 cards in a row */}
          <DashboardKPIs data={data.overview?.metrics ?? null} />

          {/* Engagement Chart - full width */}
          <DashboardEngagementChart data={data.engagement?.data ?? null} />

          {/* Top Content and Breakdown Chart - side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardTopContent data={data.topContent?.videos ?? null} />
            <DashboardBreakdownChart data={data.breakdown?.breakdown ?? null} />
          </div>

          {/* Recent Posts - full width table */}
          <DashboardRecentPosts data={data.recentPosts} />
        </>
      )}
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPIs skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>

      {/* Engagement chart skeleton */}
      <Skeleton className="h-[350px] rounded-xl" />

      {/* Top content and breakdown skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>

      {/* Recent posts table skeleton */}
      <Skeleton className="h-[300px] rounded-xl" />
    </div>
  );
}
