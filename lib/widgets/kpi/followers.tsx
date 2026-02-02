"use client";

import * as React from "react";
import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface FollowersWidgetProps extends WidgetProps {
  data?: {
    followers: number;
    followerChange: number;
  } | null;
  isLoading?: boolean;
}

function getTrend(change: number): "up" | "down" | "neutral" {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "neutral";
}

function FollowersWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function FollowersWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Followers
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

function FollowersWidget({
  data = null,
  isLoading = false,
}: FollowersWidgetProps) {
  if (isLoading) {
    return <FollowersWidgetSkeleton />;
  }

  if (!data) {
    return <FollowersWidgetEmpty />;
  }

  const trend = getTrend(data.followerChange);
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-green-600 dark:text-green-400"
      : trend === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Followers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold">
            {data.followers.toLocaleString()}
          </span>
          <div className={cn("flex items-center gap-1", trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {data.followerChange > 0 ? "+" : ""}
              {data.followerChange.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const followersWidgetDefinition: WidgetDefinition = {
  id: "followers",
  name: "Followers",
  description: "Display follower count with trend indicator",
  category: "kpi",
  icon: Users,
  component: FollowersWidget,
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 3 },
  dataRequirements: [
    {
      type: "profile",
      fields: ["followers", "followerChange"],
    },
  ],
};

// Register the widget
widgetRegistry.register(followersWidgetDefinition);

export { FollowersWidget };
