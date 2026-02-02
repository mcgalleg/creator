"use client";

import * as React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { Smile, Meh, Frown, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

type SentimentType = "positive" | "neutral" | "negative";

interface SentimentItem {
  type: SentimentType;
  value: number;
  percentage: number;
}

interface CommentSentimentData {
  sentiment: SentimentItem[];
  total: number;
  analyzed: number;
}

interface CommentSentimentWidgetProps extends WidgetProps {
  data?: CommentSentimentData | null;
  isLoading?: boolean;
}

const SENTIMENT_COLORS: Record<SentimentType, string> = {
  positive: "var(--chart-2)", // Green-ish
  neutral: "var(--chart-4)",  // Gray-ish
  negative: "var(--chart-1)", // Red-ish (using chart-1 for contrast)
};

const SENTIMENT_LABELS: Record<SentimentType, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

const SENTIMENT_ICONS: Record<SentimentType, React.ComponentType<{ className?: string }>> = {
  positive: Smile,
  neutral: Meh,
  negative: Frown,
};

function SentimentSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-4">
          <Skeleton className="h-36 w-36 rounded-full" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChart className="h-4 w-4" />
          Comment Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[200px] flex-col items-center justify-center text-center">
          <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No sentiment data available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Sentiment analysis will appear once comments are analyzed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PlaceholderState() {
  // Placeholder data for when sentiment analysis is not yet implemented
  const placeholderData: SentimentItem[] = [
    { type: "positive", value: 60, percentage: 60 },
    { type: "neutral", value: 30, percentage: 30 },
    { type: "negative", value: 10, percentage: 10 },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChart className="h-4 w-4" />
          Comment Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center px-4 py-6">
          <div className="flex gap-6 mb-4">
            {placeholderData.map((item) => {
              const Icon = SENTIMENT_ICONS[item.type];
              return (
                <div key={item.type} className="flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-2 opacity-50"
                    style={{ backgroundColor: `color-mix(in srgb, ${SENTIMENT_COLORS[item.type]} 20%, transparent)` }}
                  >
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {SENTIMENT_LABELS[item.type]}
                  </span>
                  <span className="text-xs text-muted-foreground">--</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Sentiment analysis coming soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentSentimentWidget({
  data = null,
  isLoading = false,
}: CommentSentimentWidgetProps) {
  if (isLoading) {
    return <SentimentSkeleton />;
  }

  // If no data or empty sentiment, show placeholder state
  const total = data?.sentiment?.reduce((sum, item) => sum + item.value, 0) ?? 0;

  if (!data || !data.sentiment || data.sentiment.length === 0 || total === 0) {
    // Check if we should show empty state (no comments at all) or placeholder (analysis pending)
    if (data?.total === 0) {
      return <EmptyState />;
    }
    return <PlaceholderState />;
  }

  const chartConfig: ChartConfig = data.sentiment.reduce((config, item) => {
    config[item.type] = {
      label: SENTIMENT_LABELS[item.type],
      color: SENTIMENT_COLORS[item.type],
    };
    return config;
  }, {} as ChartConfig);

  const chartData = data.sentiment.map((item) => ({
    ...item,
    name: item.type,
    fill: SENTIMENT_COLORS[item.type],
  }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChart className="h-4 w-4" />
          Comment Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[180px] w-full flex-1"
        >
          <RechartsPieChart accessibilityLayer>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="type"
                  formatter={(value, name, item) => {
                    const Icon = SENTIMENT_ICONS[name as SentimentType];
                    return (
                      <div className="flex w-full items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-muted-foreground">
                            {SENTIMENT_LABELS[name as SentimentType]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium tabular-nums">
                            {Number(value).toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            ({item.payload.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="type"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="type" />}
              className="flex-wrap gap-2"
            />
          </RechartsPieChart>
        </ChartContainer>
        {data.analyzed !== undefined && data.total !== undefined && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {data.analyzed.toLocaleString()} of {data.total.toLocaleString()} comments analyzed
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export const commentSentimentWidgetDefinition: WidgetDefinition = {
  id: "comment-sentiment",
  name: "Comment Sentiment",
  description: "Sentiment analysis breakdown of comments",
  category: "comments",
  icon: PieChart,
  component: CommentSentimentWidget,
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 6, h: 6 },
  dataRequirements: [
    {
      type: "comments",
      fields: ["sentiment", "total", "analyzed"],
    },
  ],
};

// Register the widget
widgetRegistry.register(commentSentimentWidgetDefinition);

export { CommentSentimentWidget };
export type { SentimentType, SentimentItem, CommentSentimentData, CommentSentimentWidgetProps };
