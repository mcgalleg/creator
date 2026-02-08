"use client";

import * as React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { BarChart3 } from "lucide-react";
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

interface ViewsBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

interface ViewsDistributionWidgetProps extends WidgetProps {
  data?: ViewsBucket[] | null;
  isLoading?: boolean;
}

const chartConfig: ChartConfig = {
  count: {
    label: "Videos",
    color: "var(--chart-3)",
  },
};

function ViewsDistributionWidgetSkeleton() {
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

function ViewsDistributionWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Views Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[200px] flex-col items-center justify-center text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No content data available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Distribution of views across your videos will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ViewsDistributionWidget({
  data = null,
  isLoading = false,
}: ViewsDistributionWidgetProps) {
  if (isLoading) {
    return <ViewsDistributionWidgetSkeleton />;
  }

  if (!data || data.length === 0) {
    return <ViewsDistributionWidgetEmpty />;
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Views Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <RechartsBarChart data={data} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
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
                  formatter={(value) => [`${value} videos`, "Count"]}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--chart-3)"
              radius={[4, 4, 0, 0]}
            />
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const viewsDistributionWidgetDefinition: WidgetDefinition = {
  id: "views-distribution",
  name: "Views Distribution",
  description: "Histogram showing distribution of views across videos",
  category: "chart",
  icon: BarChart3,
  component: ViewsDistributionWidget,
  defaultSize: { w: 6, h: 3 },
  minSize: { w: 4, h: 3 },
  maxSize: { w: 12, h: 6 },
  dataRequirements: [
    {
      type: "posts",
      fields: ["plays"],
    },
  ],
};

// Register the widget
widgetRegistry.register(viewsDistributionWidgetDefinition);

export { ViewsDistributionWidget };
export type { ViewsBucket };
