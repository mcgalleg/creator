"use client";

import * as React from "react";
import { Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

interface ContentVelocityWidgetProps extends WidgetProps {
  data?: {
    postsPerWeek: number;
    postsPerMonth: number;
    velocityChange: number; // percentage change from previous period
    totalPosts: number;
    periodDays: number;
  } | null;
  isLoading?: boolean;
}

function getTrend(change: number): "up" | "down" | "neutral" {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "neutral";
}

function ContentVelocityWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function ContentVelocityWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Content Velocity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Zap className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentVelocityWidget({
  data = null,
  isLoading = false,
}: ContentVelocityWidgetProps) {
  if (isLoading) {
    return <ContentVelocityWidgetSkeleton />;
  }

  if (!data) {
    return <ContentVelocityWidgetEmpty />;
  }

  const trend = getTrend(data.velocityChange);
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  // For content velocity, more posts = positive (green), fewer = could be concerning (amber)
  const trendColor =
    trend === "up"
      ? "text-green-600 dark:text-green-400"
      : trend === "down"
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";

  // Determine velocity status
  const velocityStatus =
    data.postsPerWeek >= 7 ? "high" :
    data.postsPerWeek >= 3 ? "moderate" :
    data.postsPerWeek >= 1 ? "low" : "inactive";

  const statusColors = {
    high: "text-green-600 dark:text-green-400",
    moderate: "text-blue-600 dark:text-blue-400",
    low: "text-amber-600 dark:text-amber-400",
    inactive: "text-red-600 dark:text-red-400",
  };

  const statusLabels = {
    high: "High Output",
    moderate: "Consistent",
    low: "Low Output",
    inactive: "Inactive",
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-500" />
          Content Velocity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {data.postsPerWeek.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">posts/week</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p>{data.postsPerMonth.toFixed(1)} posts/month</p>
                  <p>{data.totalPosts} posts in {data.periodDays} days</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-1", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {data.velocityChange > 0 ? "+" : ""}
                {data.velocityChange.toFixed(0)}%
              </span>
            </div>
            <span className={cn("text-xs font-medium", statusColors[velocityStatus])}>
              {statusLabels[velocityStatus]}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const contentVelocityWidgetDefinition: WidgetDefinition = {
  id: "content-velocity",
  name: "Content Velocity",
  description: "Shows posting frequency and content output rate",
  category: "kpi",
  icon: Zap,
  component: ContentVelocityWidget,
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 3 },
  dataRequirements: [
    {
      type: "metrics",
      fields: ["postsPerWeek", "postsPerMonth", "velocityChange", "totalPosts", "periodDays"],
    },
  ],
};

// Register the widget
widgetRegistry.register(contentVelocityWidgetDefinition);

export { ContentVelocityWidget };
export type { ContentVelocityWidgetProps };
