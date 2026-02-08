"use client";

import * as React from "react";
import { Bookmark } from "lucide-react";
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

interface SavesRateWidgetProps extends WidgetProps {
  data?: {
    savesRate: number;
    totalSaves: number;
    totalPlays: number;
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

function SavesRateWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

function SavesRateWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Save Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Bookmark className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SavesRateWidget({
  data = null,
  isLoading = false,
}: SavesRateWidgetProps) {
  if (isLoading) {
    return <SavesRateWidgetSkeleton />;
  }

  if (!data) {
    return <SavesRateWidgetEmpty />;
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          Save Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold">
            {data.savesRate.toFixed(2)}%
          </span>
          <p className="text-xs text-muted-foreground">
            {formatNumber(data.totalSaves)} saves from {formatNumber(data.totalPlays)} plays
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            High saves = content worth rewatching
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const savesRateWidgetDefinition: WidgetDefinition = {
  id: "saves-rate",
  name: "Save Rate",
  description: "Percentage of views that resulted in saves",
  category: "engagement",
  icon: Bookmark,
  component: SavesRateWidget,
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 3 },
  dataRequirements: [
    {
      type: "metrics",
      fields: ["saves", "plays"],
    },
  ],
};

// Register the widget
widgetRegistry.register(savesRateWidgetDefinition);

export { SavesRateWidget };
