"use client";

import * as React from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
// Import from index to trigger widget registration
import { widgetRegistry, WidgetProps } from "@/lib/widgets";
import { WidgetPosition } from "@/lib/db/schema/dashboard-layouts";
import { DashboardData } from "@/hooks/use-dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardWidgetProps {
  widget: WidgetPosition;
  accountId: number | null;
  period: "7d" | "30d" | "90d";
  dashboardData?: DashboardData;
  isDataLoading?: boolean;
  config?: Record<string, unknown>;
  onDelete?: (widgetId: string) => void;
  onConfigChange?: (widgetId: string, config: Record<string, unknown>) => void;
}

/**
 * Maps widget type to the appropriate data from dashboardData
 * Returns data in the format expected by each widget's props
 */
function getWidgetData(
  widgetType: string,
  dashboardData?: DashboardData
): unknown {
  if (!dashboardData) return null;

  const { overview, engagement, topContent, recentPosts, breakdown, recentComments, commentActivity, topCommenters, postingTimes, growth, durationPerformance } = dashboardData;

  switch (widgetType) {
    // KPI widgets - map from overview metrics
    case "followers":
      return overview?.metrics
        ? { followers: overview.metrics.followers, followerChange: overview.metrics.followerChange }
        : null;
    case "total-plays":
      return overview?.metrics
        ? { totalPlays: overview.metrics.totalPlays, playsChange: overview.metrics.playsChange }
        : null;
    case "engagement-rate":
      return overview?.metrics
        ? { engagementRate: overview.metrics.engagementRate, engagementRateChange: overview.metrics.engagementRateChange }
        : null;
    case "total-likes":
      // Calculate from engagement data
      if (engagement?.data) {
        const totalLikes = engagement.data.reduce((sum, d) => sum + d.likes, 0);
        return { totalLikes, likesChange: 0 };
      }
      return null;
    case "total-shares":
      if (engagement?.data) {
        const totalShares = engagement.data.reduce((sum, d) => sum + d.shares, 0);
        return { totalShares, sharesChange: 0 };
      }
      return null;
    case "total-saves":
      if (engagement?.data) {
        const totalSaves = engagement.data.reduce((sum, d) => sum + d.saves, 0);
        return { totalSaves, savesChange: 0 };
      }
      return null;
    case "avg-views":
      if (engagement?.data && engagement.data.length > 0) {
        const totalPlays = engagement.data.reduce((sum, d) => sum + d.plays, 0);
        const avgViews = totalPlays / engagement.data.length;
        return { avgViews, avgViewsChange: 0 };
      }
      return null;
    case "content-velocity":
      return overview?.metrics
        ? {
            postsPerWeek: overview.metrics.contentVelocity,
            postsPerMonth: overview.metrics.contentVelocity * 4,
            velocityChange: 0,
            totalPosts: recentPosts?.total ?? 0,
            periodDays: 30,
          }
        : null;
    case "overview-metrics":
      return overview?.metrics ?? null;

    // Chart widgets - pass the array directly, not wrapped in {data:}
    case "engagement-trend":
      return engagement?.data ?? null;
    case "engagement-breakdown":
      return breakdown?.breakdown ?? null;

    // Content widgets - pass the array directly
    case "top-content":
      return topContent?.videos ?? null;
    case "recent-posts":
      return recentPosts ?? null;

    // Comment widgets
    case "recent-comments":
      return recentComments ?? null;
    case "comment-activity":
      return commentActivity ?? null;
    case "top-commenters":
      return topCommenters ?? null;
    case "comment-sentiment":
      // Sentiment analysis not yet implemented - return null to show placeholder
      return null;

    case "posting-frequency":
      if (postingTimes?.summary?.byDayOfWeek) {
        const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return postingTimes.summary.byDayOfWeek.map((d, i) => ({
          day: d.dayName,
          shortDay: SHORT_DAYS[i],
          posts: d.postCount,
        }));
      }
      return null;

    // Engagement KPI widgets
    case "total-comments":
      if (engagement?.data) {
        const totalComments = engagement.data.reduce((sum, d) => sum + d.comments, 0);
        return { totalComments, commentsChange: 0 };
      }
      return null;

    case "saves-rate":
      if (engagement?.data) {
        const totalSaves = engagement.data.reduce((sum, d) => sum + d.saves, 0);
        const totalPlays = engagement.data.reduce((sum, d) => sum + d.plays, 0);
        const savesRate = totalPlays > 0 ? (totalSaves / totalPlays) * 100 : 0;
        return { savesRate, totalSaves, totalPlays };
      }
      return null;

    case "virality-score":
      if (engagement?.data) {
        const totalShares = engagement.data.reduce((sum, d) => sum + d.shares, 0);
        const totalPlays = engagement.data.reduce((sum, d) => sum + d.plays, 0);
        const viralityScore = totalPlays > 0 ? (totalShares / totalPlays) * 100 : 0;
        return { viralityScore, totalShares, totalPlays };
      }
      return null;

    case "comments-per-post":
      if (engagement?.data && engagement.data.length > 0) {
        const totalComments = engagement.data.reduce((sum, d) => sum + d.comments, 0);
        const commentsPerPost = totalComments / engagement.data.length;
        return { commentsPerPost, totalComments, postCount: engagement.data.length };
      }
      return null;

    case "engagement-by-day":
      if (postingTimes?.summary?.byDayOfWeek) {
        return postingTimes.summary.byDayOfWeek.map((d) => ({
          day: d.dayName,
          shortDay: d.dayName.slice(0, 3),
          engagementRate: d.avgEngagementRate,
          posts: d.postCount,
        }));
      }
      return null;

    case "follower-engagement-ratio":
      if (overview?.metrics) {
        const ratio = overview.metrics.followers > 0
          ? (overview.metrics.totalPlays / overview.metrics.followers) * 100
          : 0;
        return { ratio, totalPlays: overview.metrics.totalPlays, followers: overview.metrics.followers };
      }
      return null;

    // Chart widgets - additional
    case "views-distribution":
      if (topContent?.videos && topContent.videos.length > 0) {
        const buckets = [
          { label: "0-1K", min: 0, max: 1000, count: 0 },
          { label: "1K-10K", min: 1000, max: 10000, count: 0 },
          { label: "10K-100K", min: 10000, max: 100000, count: 0 },
          { label: "100K-1M", min: 100000, max: 1000000, count: 0 },
          { label: "1M+", min: 1000000, max: Infinity, count: 0 },
        ];
        topContent.videos.forEach(v => {
          const bucket = buckets.find(b => v.plays >= b.min && v.plays < b.max);
          if (bucket) bucket.count++;
        });
        return buckets;
      }
      return null;

    // Comments - audience loyalty
    case "audience-loyalty":
      if (topCommenters?.commenters && topCommenters.commenters.length > 0) {
        const repeat = topCommenters.commenters.filter(c => c.commentCount > 1).length;
        const oneTime = topCommenters.commenters.filter(c => c.commentCount === 1).length;
        const total = topCommenters.commenters.length;
        const loyaltyRate = total > 0 ? (repeat / total) * 100 : 0;
        return { loyaltyRate, repeat, oneTime, total };
      }
      return null;

    // 2A: Growth chart
    case "growth-chart":
      return growth?.followerGrowth ?? null;

    // 2B: Best posting times heatmap
    case "best-posting-times":
      if (postingTimes?.timeSlots) {
        return postingTimes.timeSlots.map((slot) => ({
          day: slot.dayOfWeek,
          hour: slot.hour,
          engagement: slot.metrics?.avgPlays || 0,
          posts: slot.postCount,
        }));
      }
      return null;

    // 2C: Viral posts
    case "viral-posts":
      if (topContent?.videos && topContent.videos.length > 0) {
        const viralThreshold = 1.0; // 1% share rate
        const postsWithShareRate = topContent.videos
          .map(v => ({ ...v, shareRate: v.plays > 0 ? (v.shares / v.plays) * 100 : 0 }))
          .filter(v => v.shareRate > viralThreshold)
          .sort((a, b) => b.shareRate - a.shareRate);
        return postsWithShareRate.length > 0 ? postsWithShareRate : null;
      }
      return null;

    // 2D: Underperforming posts
    case "underperforming":
      if (topContent?.videos && topContent.videos.length > 1) {
        const avgRate = topContent.videos.reduce((sum, v) => sum + v.engagementRate, 0) / topContent.videos.length;
        const underperforming = topContent.videos
          .filter(v => v.engagementRate < avgRate)
          .map(v => ({
            ...v,
            avgEngagementRate: avgRate,
            performanceGap: avgRate > 0 ? ((avgRate - v.engagementRate) / avgRate) * 100 : 0,
          }))
          .sort((a, b) => b.performanceGap - a.performanceGap);
        return underperforming.length > 0 ? underperforming : null;
      }
      return null;

    // 2E: Duration performance
    case "duration-performance":
      return durationPerformance?.videos ?? null;

    default:
      return null;
  }
}

export function DashboardWidget({
  widget,
  accountId,
  period,
  dashboardData,
  isDataLoading = false,
  config,
  onDelete,
  onConfigChange,
}: DashboardWidgetProps) {
  const widgetDef = widgetRegistry.get(widget.widgetType);

  // Handle missing widget definition
  if (!widgetDef) {
    return (
      <div className="group relative rounded-lg border bg-card h-full">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unknown Widget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Widget type &quot;{widget.widgetType}&quot; is not registered.
            </p>
          </CardContent>
        </Card>
        {onDelete && (
          <WidgetMenu onDelete={() => onDelete(widget.id)} />
        )}
      </div>
    );
  }

  const WidgetComponent = widgetDef.component;

  // Get the appropriate data for this widget type
  const widgetData = getWidgetData(widget.widgetType, dashboardData);

  const widgetProps: WidgetProps & { data?: unknown; isLoading?: boolean } = {
    id: widget.id,
    accountId,
    period,
    config,
    isEditing: false,
    onConfigChange: onConfigChange
      ? (newConfig) => onConfigChange(widget.id, newConfig)
      : undefined,
    // Pass data and loading state to widget
    data: widgetData,
    isLoading: isDataLoading,
  };

  return (
    <div className="group relative rounded-lg h-full">
      <div className="h-full">
        <WidgetComponent {...widgetProps} />
      </div>
      {onDelete && (
        <WidgetMenu onDelete={() => onDelete(widget.id)} />
      )}
    </div>
  );
}

interface WidgetMenuProps {
  onDelete: () => void;
}

function WidgetMenu({ onDelete }: WidgetMenuProps) {
  return (
    <div
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-background/80 backdrop-blur-sm shadow-sm"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Widget options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove widget
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export type { DashboardWidgetProps };
