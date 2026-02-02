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

interface DayFrequency {
  day: string;
  shortDay: string;
  posts: number;
}

interface PostingFrequencyWidgetProps extends WidgetProps {
  data?: DayFrequency[] | null;
  isLoading?: boolean;
}

const DAYS_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const chartConfig: ChartConfig = {
  posts: {
    label: "Posts",
    color: "var(--chart-1)",
  },
};

function PostingFrequencyWidgetSkeleton() {
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

function PostingFrequencyWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Posting Frequency</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[200px] flex-col items-center justify-center text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No posting data available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Post frequency by day of week will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PostingFrequencyWidget({
  data = null,
  isLoading = false,
}: PostingFrequencyWidgetProps) {
  if (isLoading) {
    return <PostingFrequencyWidgetSkeleton />;
  }

  if (!data || data.length === 0) {
    return <PostingFrequencyWidgetEmpty />;
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
          Posting Frequency
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
              allowDecimals={false}
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
                />
              }
            />
            <Bar
              dataKey="posts"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
            />
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const postingFrequencyWidgetDefinition: WidgetDefinition = {
  id: "posting-frequency",
  name: "Posting Frequency",
  description: "Bar chart showing posts by day of week",
  category: "chart",
  icon: CalendarDays,
  component: PostingFrequencyWidget,
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  maxSize: { w: 12, h: 6 },
  dataRequirements: [
    {
      type: "posts",
      fields: ["postedAt"],
    },
  ],
};

// Register the widget
widgetRegistry.register(postingFrequencyWidgetDefinition);

export { PostingFrequencyWidget };
export type { DayFrequency };
