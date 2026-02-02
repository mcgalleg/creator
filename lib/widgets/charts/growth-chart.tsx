"use client";

import * as React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { TrendingUp } from "lucide-react";
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

interface GrowthDataPoint {
  date: string;
  followers: number;
  formattedDate?: string;
}

interface GrowthChartWidgetProps extends WidgetProps {
  data?: GrowthDataPoint[] | null;
  isLoading?: boolean;
}

const chartConfig: ChartConfig = {
  followers: {
    label: "Followers",
    color: "var(--chart-1)",
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

function GrowthChartWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  );
}

function GrowthChartWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Follower Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[250px] flex-col items-center justify-center text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No growth data available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Follower growth over time will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function GrowthChartWidget({
  data = null,
  isLoading = false,
}: GrowthChartWidgetProps) {
  const formattedData = React.useMemo(() => {
    if (!data) return [];
    return data.map((point) => ({
      ...point,
      formattedDate: formatDate(point.date),
    }));
  }, [data]);

  if (isLoading) {
    return <GrowthChartWidgetSkeleton />;
  }

  if (!data || data.length === 0) {
    return <GrowthChartWidgetEmpty />;
  }

  // Calculate growth stats
  const firstValue = data[0]?.followers ?? 0;
  const lastValue = data[data.length - 1]?.followers ?? 0;
  const totalGrowth = lastValue - firstValue;
  const growthPercent = firstValue > 0 ? ((totalGrowth / firstValue) * 100).toFixed(1) : "0";

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Follower Growth
          </CardTitle>
          <div className="text-right">
            <span
              className={`text-sm font-medium ${
                totalGrowth >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {totalGrowth >= 0 ? "+" : ""}
              {formatNumber(totalGrowth)} ({growthPercent}%)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <RechartsLineChart data={formattedData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="formattedDate"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatNumber(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    if (payload && payload.length > 0) {
                      return formatDate(payload[0].payload.date);
                    }
                    return "";
                  }}
                  formatter={(value) => [
                    Number(value).toLocaleString(),
                    "Followers",
                  ]}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="followers"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </RechartsLineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const growthChartWidgetDefinition: WidgetDefinition = {
  id: "growth-chart",
  name: "Follower Growth",
  description: "Line chart showing follower growth over time",
  category: "chart",
  icon: TrendingUp,
  component: GrowthChartWidget,
  defaultSize: { w: 8, h: 4 },
  minSize: { w: 6, h: 3 },
  maxSize: { w: 12, h: 6 },
  dataRequirements: [
    {
      type: "profile",
      fields: ["followers", "date"],
    },
  ],
};

// Register the widget
widgetRegistry.register(growthChartWidgetDefinition);

export { GrowthChartWidget };
export type { GrowthDataPoint };
