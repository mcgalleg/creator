"use client";

import * as React from "react";
import { Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

interface FollowerEngagementRatioWidgetProps extends WidgetProps {
  data?: {
    ratio: number;
    totalPlays: number;
    followers: number;
  } | null;
  isLoading?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

function FollowerEngagementRatioWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
      </CardContent>
    </Card>
  );
}

function FollowerEngagementRatioWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Reach Ratio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Users className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FollowerEngagementRatioWidget({
  data = null,
  isLoading = false,
}: FollowerEngagementRatioWidgetProps) {
  if (isLoading) {
    return <FollowerEngagementRatioWidgetSkeleton />;
  }

  if (!data) {
    return <FollowerEngagementRatioWidgetEmpty />;
  }

  const reachContext = data.ratio > 100
    ? "Reaching beyond your follower base"
    : "Views relative to follower count";

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Reach Ratio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold">
            {data.ratio.toFixed(1)}%
          </span>
          <p className="text-xs text-muted-foreground">
            {formatNumber(data.totalPlays)} views / {formatNumber(data.followers)} followers
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {reachContext}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const followerEngagementRatioWidgetDefinition: WidgetDefinition = {
  id: "follower-engagement-ratio",
  name: "Reach Ratio",
  description: "Views-to-followers ratio showing content reach beyond follower base",
  category: "engagement",
  icon: Users,
  component: FollowerEngagementRatioWidget,
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 3 },
  dataRequirements: [
    {
      type: "metrics",
      fields: ["totalPlays", "followers"],
    },
  ],
};

// Register the widget
widgetRegistry.register(followerEngagementRatioWidgetDefinition);

export { FollowerEngagementRatioWidget };
