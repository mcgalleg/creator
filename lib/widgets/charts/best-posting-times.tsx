"use client";

import * as React from "react";
import { Clock } from "lucide-react";
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

interface HeatmapCell {
  day: number; // 0-6 (Sun-Sat)
  hour: number; // 0-23
  engagement: number;
  posts: number;
}

interface BestPostingTimesWidgetProps extends WidgetProps {
  data?: HeatmapCell[] | null;
  isLoading?: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getHourLabel(hour: number): string {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

function getIntensityClass(engagement: number, maxEngagement: number): string {
  if (maxEngagement === 0 || engagement === 0) return "bg-muted";

  const ratio = engagement / maxEngagement;

  if (ratio > 0.8) return "bg-green-500 dark:bg-green-600";
  if (ratio > 0.6) return "bg-green-400 dark:bg-green-500";
  if (ratio > 0.4) return "bg-green-300 dark:bg-green-400";
  if (ratio > 0.2) return "bg-green-200 dark:bg-green-300";
  if (ratio > 0) return "bg-green-100 dark:bg-green-200";
  return "bg-muted";
}

function BestPostingTimesWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[240px] w-full" />
      </CardContent>
    </Card>
  );
}

function BestPostingTimesWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Best Posting Times</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[240px] flex-col items-center justify-center text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No timing data available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Post with enough videos to see optimal posting times.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BestPostingTimesWidget({
  data = null,
  isLoading = false,
}: BestPostingTimesWidgetProps) {
  if (isLoading) {
    return <BestPostingTimesWidgetSkeleton />;
  }

  if (!data || data.length === 0) {
    return <BestPostingTimesWidgetEmpty />;
  }

  // Create a map for quick lookup
  const cellMap = new Map<string, HeatmapCell>();
  data.forEach((cell) => {
    cellMap.set(`${cell.day}-${cell.hour}`, cell);
  });

  // Find max engagement for normalization
  const maxEngagement = Math.max(...data.map((cell) => cell.engagement));

  // Show every 3rd hour label to avoid crowding
  const visibleHours = [0, 6, 12, 18];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Best Posting Times
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Hour labels */}
            <div className="flex ml-10 mb-1">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-[10px] text-muted-foreground"
                >
                  {visibleHours.includes(hour) ? getHourLabel(hour) : ""}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="space-y-1">
              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center gap-1">
                  <span className="w-9 text-xs text-muted-foreground text-right pr-1">
                    {day}
                  </span>
                  <div className="flex flex-1 gap-[2px]">
                    {HOURS.map((hour) => {
                      const cell = cellMap.get(`${dayIndex}-${hour}`);
                      const engagement = cell?.engagement ?? 0;
                      const posts = cell?.posts ?? 0;

                      return (
                        <div
                          key={hour}
                          className={cn(
                            "flex-1 aspect-square rounded-sm cursor-default transition-colors",
                            getIntensityClass(engagement, maxEngagement)
                          )}
                          title={`${day} ${getHourLabel(hour)}: ${posts} posts, ${engagement.toLocaleString()} avg engagement`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-[2px]">
                <div className="w-3 h-3 rounded-sm bg-muted" />
                <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-200" />
                <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-300" />
                <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-400" />
                <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-500" />
                <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const bestPostingTimesWidgetDefinition: WidgetDefinition = {
  id: "best-posting-times",
  name: "Best Posting Times",
  description: "Heatmap showing optimal posting times by day and hour",
  category: "chart",
  icon: Clock,
  component: BestPostingTimesWidget,
  defaultSize: { w: 8, h: 4 },
  minSize: { w: 6, h: 3 },
  maxSize: { w: 12, h: 6 },
  dataRequirements: [
    {
      type: "posts",
      fields: ["postedAt", "plays", "likes", "comments", "shares", "saves"],
    },
  ],
};

// Register the widget
widgetRegistry.register(bestPostingTimesWidgetDefinition);

export { BestPostingTimesWidget };
export type { HeatmapCell };
