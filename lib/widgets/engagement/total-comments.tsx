"use client";

import * as React from "react";
import { MessageCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

interface TotalCommentsWidgetProps extends WidgetProps {
  data?: {
    totalComments: number;
    commentsChange?: number;
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

function TotalCommentsWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
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

function TotalCommentsWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Total Comments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TotalCommentsWidget({
  data = null,
  isLoading = false,
}: TotalCommentsWidgetProps) {
  if (isLoading) {
    return <TotalCommentsWidgetSkeleton />;
  }

  if (!data) {
    return <TotalCommentsWidgetEmpty />;
  }

  const hasChange = data.commentsChange !== undefined && data.commentsChange !== 0;
  const trend = hasChange
    ? data.commentsChange! > 0
      ? "up"
      : "down"
    : null;
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
          <MessageCircle className="h-4 w-4" />
          Total Comments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold" title={data.totalComments.toLocaleString()}>
            {formatNumber(data.totalComments)}
          </span>
          {hasChange && trend && (
            <div className={cn("flex items-center gap-1", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {data.commentsChange! > 0 ? "+" : ""}
                {data.commentsChange!.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const totalCommentsWidgetDefinition: WidgetDefinition = {
  id: "total-comments",
  name: "Total Comments",
  description: "Display total comments sum with optional trend indicator",
  category: "engagement",
  icon: MessageCircle,
  component: TotalCommentsWidget,
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 3 },
  dataRequirements: [
    {
      type: "metrics",
      fields: ["totalComments"],
    },
  ],
};

// Register the widget
widgetRegistry.register(totalCommentsWidgetDefinition);

export { TotalCommentsWidget };
