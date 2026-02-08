"use client";

import * as React from "react";
import { Share2 } from "lucide-react";
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

interface ViralityScoreWidgetProps extends WidgetProps {
  data?: {
    viralityScore: number;
    totalShares: number;
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

function ViralityScoreWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
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

function ViralityScoreWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Virality Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Share2 className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ViralityScoreWidget({
  data = null,
  isLoading = false,
}: ViralityScoreWidgetProps) {
  if (isLoading) {
    return <ViralityScoreWidgetSkeleton />;
  }

  if (!data) {
    return <ViralityScoreWidgetEmpty />;
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Virality Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold">
            {data.viralityScore.toFixed(2)}%
          </span>
          <p className="text-xs text-muted-foreground">
            {formatNumber(data.totalShares)} shares from {formatNumber(data.totalPlays)} plays
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Share-to-view ratio
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const viralityScoreWidgetDefinition: WidgetDefinition = {
  id: "virality-score",
  name: "Virality Score",
  description: "Share-to-view ratio as a percentage",
  category: "engagement",
  icon: Share2,
  component: ViralityScoreWidget,
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 3 },
  dataRequirements: [
    {
      type: "metrics",
      fields: ["shares", "plays"],
    },
  ],
};

// Register the widget
widgetRegistry.register(viralityScoreWidgetDefinition);

export { ViralityScoreWidget };
