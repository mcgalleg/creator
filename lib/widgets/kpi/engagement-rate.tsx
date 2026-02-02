"use client";

import * as React from "react";
import { Percent, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

interface EngagementRateWidgetProps extends WidgetProps {
  data?: {
    engagementRate: number;
    engagementRateChange: number;
  } | null;
  isLoading?: boolean;
}

function getTrend(change: number): "up" | "down" | "neutral" {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "neutral";
}

function EngagementRateWidgetSkeleton() {
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

function EngagementRateWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Engagement Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Percent className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EngagementRateWidget({
  data = null,
  isLoading = false,
}: EngagementRateWidgetProps) {
  if (isLoading) {
    return <EngagementRateWidgetSkeleton />;
  }

  if (!data) {
    return <EngagementRateWidgetEmpty />;
  }

  const trend = getTrend(data.engagementRateChange);
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
          <Percent className="h-4 w-4" />
          Engagement Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold">
            {data.engagementRate.toFixed(2)}%
          </span>
          <div className={cn("flex items-center gap-1", trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {data.engagementRateChange > 0 ? "+" : ""}
              {data.engagementRateChange.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const engagementRateWidgetDefinition: WidgetDefinition = {
  id: "engagement-rate",
  name: "Engagement Rate",
  description: "Display calculated engagement rate with trend indicator",
  category: "kpi",
  icon: Percent,
  component: EngagementRateWidget,
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 3 },
  dataRequirements: [
    {
      type: "metrics",
      fields: ["engagementRate", "engagementRateChange"],
    },
  ],
};

// Register the widget
widgetRegistry.register(engagementRateWidgetDefinition);

export { EngagementRateWidget };
