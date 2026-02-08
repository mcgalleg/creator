"use client";

import * as React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { CalendarDays } from "lucide-react";
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

interface DayEngagement {
  day: string;
  shortDay: string;
  engagementRate: number;
  posts: number;
}

interface EngagementByDayWidgetProps extends WidgetProps {
  data?: DayEngagement[] | null;
  isLoading?: boolean;
}

const DAYS_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const chartConfig: ChartConfig = {
  engagementRate: {
    label: "Engagement Rate",
    color: "var(--chart-2)",
  },
};

function EngagementByDayWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  );
}

function EngagementByDayWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Engagement by Day</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[200px] flex-col items-center justify-center text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No engagement data available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Engagement rate by day of week will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EngagementByDayWidget({
  data = null,
  isLoading = false,
}: EngagementByDayWidgetProps) {
  if (isLoading) {
    return <EngagementByDayWidgetSkeleton />;
  }

  if (!data || data.length === 0) {
    return <EngagementByDayWidgetEmpty />;
  }

  // Sort data by day order
  const sortedData = [...data].sort(
    (a, b) => DAYS_ORDER.indexOf(a.shortDay) - DAYS_ORDER.indexOf(b.shortDay)
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Engagement by Day
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <RechartsBarChart data={sortedData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="shortDay"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    if (payload && payload.length > 0) {
                      return payload[0].payload.day;
                    }
                    return "";
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2)}%`, "Engagement Rate"]}
                />
              }
            />
            <Bar
              dataKey="engagementRate"
              fill="var(--chart-2)"
              radius={[4, 4, 0, 0]}
            />
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const engagementByDayWidgetDefinition: WidgetDefinition = {
  id: "engagement-by-day",
  name: "Engagement by Day",
  description: "Bar chart showing average engagement rate by day of week",
  category: "engagement",
  icon: CalendarDays,
  component: EngagementByDayWidget,
  defaultSize: { w: 6, h: 3 },
  minSize: { w: 4, h: 3 },
  maxSize: { w: 12, h: 6 },
  dataRequirements: [
    {
      type: "metrics",
      fields: ["engagementRate", "dayOfWeek"],
    },
  ],
};

// Register the widget
widgetRegistry.register(engagementByDayWidgetDefinition);

export { EngagementByDayWidget };
export type { DayEngagement };
