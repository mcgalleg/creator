"use client";

import * as React from "react";
import { Play, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

interface TotalPlaysWidgetProps extends WidgetProps {
  data?: {
    totalPlays: number;
    playsChange: number;
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

function TotalPlaysWidgetSkeleton() {
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

function TotalPlaysWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Total Plays
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Play className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TotalPlaysWidget({
  data = null,
  isLoading = false,
}: TotalPlaysWidgetProps) {
  if (isLoading) {
    return <TotalPlaysWidgetSkeleton />;
  }

  if (!data) {
    return <TotalPlaysWidgetEmpty />;
  }

  const trend = getTrend(data.playsChange);
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
          <Play className="h-4 w-4" />
          Total Plays
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold" title={data.totalPlays.toLocaleString()}>
            {formatNumber(data.totalPlays)}
          </span>
          <div className={cn("flex items-center gap-1", trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {data.playsChange > 0 ? "+" : ""}
              {data.playsChange.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const totalPlaysWidgetDefinition: WidgetDefinition = {
  id: "total-plays",
  name: "Total Plays",
  description: "Display total video plays with trend indicator",
  category: "kpi",
  icon: Play,
  component: TotalPlaysWidget,
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 3 },
  dataRequirements: [
    {
      type: "metrics",
      fields: ["totalPlays", "playsChange"],
    },
  ],
};

// Register the widget
widgetRegistry.register(totalPlaysWidgetDefinition);

export { TotalPlaysWidget };
