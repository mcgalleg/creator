"use client";

import * as React from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Activity, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface CommentActivityPoint {
  date: string;
  comments: number;
}

interface CommentActivityData {
  activity: CommentActivityPoint[];
  total: number;
  period: "7d" | "30d" | "90d";
}

interface CommentActivityWidgetProps extends WidgetProps {
  data?: CommentActivityData | null;
  isLoading?: boolean;
}

const chartConfig: ChartConfig = {
  comments: {
    label: "Comments",
    color: "var(--chart-2)",
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

function ActivitySkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Comment Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[200px] flex-col items-center justify-center text-center">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No comment activity data
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Comment trends over time will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentActivityWidget({
  data = null,
  isLoading = false,
}: CommentActivityWidgetProps) {
  const formattedData = React.useMemo(() => {
    if (!data?.activity) return [];
    return data.activity.map((point) => ({
      ...point,
      formattedDate: formatDate(point.date),
    }));
  }, [data]);

  if (isLoading) {
    return <ActivitySkeleton />;
  }

  if (!data || !data.activity || data.activity.length === 0) {
    return <EmptyState />;
  }

  // Calculate summary stats
  const totalComments = data.activity.reduce((sum, point) => sum + point.comments, 0);
  const avgComments = Math.round(totalComments / data.activity.length);
  const maxComments = Math.max(...data.activity.map((p) => p.comments));
  const peakDay = data.activity.find((p) => p.comments === maxComments);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Comment Activity
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="h-3 w-3" />
            <span>{formatNumber(totalComments)} total</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pb-2">
        <ChartContainer config={chartConfig} className="h-[180px] w-full flex-1">
          <RechartsAreaChart data={formattedData} accessibilityLayer>
            <defs>
              <linearGradient id="commentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="formattedDate"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => formatNumber(value)}
              width={40}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              labelFormatter={(_, payload) => {
                if (payload && payload.length > 0) {
                  return formatDate(payload[0].payload.date);
                }
                return "";
              }}
            />
            <Area
              type="monotone"
              dataKey="comments"
              stroke="var(--chart-2)"
              fill="url(#commentGradient)"
              strokeWidth={2}
            />
          </RechartsAreaChart>
        </ChartContainer>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
          <span>
            Avg: <span className="font-medium text-foreground">{formatNumber(avgComments)}/day</span>
          </span>
          {peakDay && (
            <span>
              Peak: <span className="font-medium text-foreground">{formatNumber(maxComments)}</span>
              {" on "}
              {formatDate(peakDay.date)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const commentActivityWidgetDefinition: WidgetDefinition = {
  id: "comment-activity",
  name: "Comment Activity",
  description: "Comment activity timeline showing trends over time",
  category: "comments",
  icon: Activity,
  component: CommentActivityWidget,
  defaultSize: { w: 6, h: 3 },
  minSize: { w: 4, h: 3 },
  maxSize: { w: 12, h: 5 },
  dataRequirements: [
    {
      type: "comments",
      fields: ["date", "comments", "period"],
    },
  ],
};

// Register the widget
widgetRegistry.register(commentActivityWidgetDefinition);

export { CommentActivityWidget };
export type { CommentActivityPoint, CommentActivityData, CommentActivityWidgetProps };
