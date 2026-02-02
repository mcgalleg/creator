"use client";

import * as React from "react";
import { Heart, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

interface TotalLikesWidgetProps extends WidgetProps {
  data?: {
    totalLikes: number;
    likesChange?: number;
  } | null;
  isLoading?: boolean;
}

function getTrend(change: number): "up" | "down" | "neutral" {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "neutral";
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

function TotalLikesWidgetSkeleton() {
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

function TotalLikesWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Total Likes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Heart className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TotalLikesWidget({
  data = null,
  isLoading = false,
}: TotalLikesWidgetProps) {
  if (isLoading) {
    return <TotalLikesWidgetSkeleton />;
  }

  if (!data) {
    return <TotalLikesWidgetEmpty />;
  }

  const hasChange = data.likesChange !== undefined;
  const trend = hasChange ? getTrend(data.likesChange!) : null;
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
          <Heart className="h-4 w-4" />
          Total Likes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold" title={data.totalLikes.toLocaleString()}>
            {formatNumber(data.totalLikes)}
          </span>
          {hasChange && trend && (
            <div className={cn("flex items-center gap-1", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {data.likesChange! > 0 ? "+" : ""}
                {data.likesChange!.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const totalLikesWidgetDefinition: WidgetDefinition = {
  id: "total-likes",
  name: "Total Likes",
  description: "Display total likes sum with optional trend indicator",
  category: "kpi",
  icon: Heart,
  component: TotalLikesWidget,
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 3 },
  dataRequirements: [
    {
      type: "metrics",
      fields: ["totalLikes"],
    },
  ],
};

// Register the widget
widgetRegistry.register(totalLikesWidgetDefinition);

export { TotalLikesWidget };
