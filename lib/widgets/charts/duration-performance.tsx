"use client";

import * as React from "react";
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ZAxis,
} from "recharts";
import { Timer } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

interface DurationPerformancePoint {
  id: number | string;
  duration: number; // in seconds
  plays: number;
  engagementRate: number;
  description?: string | null;
}

interface DurationPerformanceWidgetProps extends WidgetProps {
  data?: DurationPerformancePoint[] | null;
  isLoading?: boolean;
}

const chartConfig: ChartConfig = {
  performance: {
    label: "Videos",
    color: "var(--chart-1)",
  },
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

function DurationPerformanceWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  );
}

function DurationPerformanceWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Duration vs Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[250px] flex-col items-center justify-center text-center">
          <Timer className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No duration data available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Video duration vs performance analysis will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DurationPerformanceWidget({
  data = null,
  isLoading = false,
}: DurationPerformanceWidgetProps) {
  if (isLoading) {
    return <DurationPerformanceWidgetSkeleton />;
  }

  if (!data || data.length === 0) {
    return <DurationPerformanceWidgetEmpty />;
  }

  // Calculate optimal duration range (where engagement is highest)
  const sortedByEngagement = [...data].sort(
    (a, b) => b.engagementRate - a.engagementRate
  );
  const topPerformers = sortedByEngagement.slice(
    0,
    Math.max(3, Math.floor(data.length * 0.2))
  );
  const avgOptimalDuration =
    topPerformers.reduce((sum, p) => sum + p.duration, 0) / topPerformers.length;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Duration vs Performance
          </CardTitle>
          <div className="text-right">
            <span className="text-xs text-muted-foreground">
              Optimal: ~{formatDuration(Math.round(avgOptimalDuration))}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <RechartsScatterChart accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="duration"
              name="Duration"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatDuration(value)}
              label={{
                value: "Duration",
                position: "insideBottom",
                offset: -5,
                fontSize: 12,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <YAxis
              dataKey="plays"
              name="Plays"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatNumber(value)}
              label={{
                value: "Plays",
                angle: -90,
                position: "insideLeft",
                fontSize: 12,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <ZAxis
              dataKey="engagementRate"
              range={[50, 300]}
              name="Engagement"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => {
                    const point = item.payload as DurationPerformancePoint;
                    return (
                      <div className="space-y-1">
                        {point.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {point.description}
                          </p>
                        )}
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">
                            {formatDuration(point.duration)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Plays:</span>
                          <span className="font-medium">
                            {point.plays.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Engagement:</span>
                          <span className="font-medium">
                            {point.engagementRate.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Scatter
              data={data}
              fill="var(--chart-1)"
              fillOpacity={0.6}
              stroke="var(--chart-1)"
              strokeWidth={1}
            />
          </RechartsScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const durationPerformanceWidgetDefinition: WidgetDefinition = {
  id: "duration-performance",
  name: "Duration vs Performance",
  description: "Scatter plot showing video duration vs performance",
  category: "chart",
  icon: Timer,
  component: DurationPerformanceWidget,
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 5, h: 3 },
  maxSize: { w: 12, h: 6 },
  dataRequirements: [
    {
      type: "posts",
      fields: ["duration", "plays", "engagementRate"],
    },
  ],
};

// Register the widget
widgetRegistry.register(durationPerformanceWidgetDefinition);

export { DurationPerformanceWidget };
export type { DurationPerformancePoint };
