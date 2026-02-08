"use client";

import dynamic from "next/dynamic";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EngagementDataPoint } from "@/components/dashboard/dashboard-engagement-chart";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

// Dynamically import the chart to defer Recharts compilation
const DashboardEngagementChart = dynamic(
  () => import("@/components/dashboard/dashboard-engagement-chart").then((mod) => mod.DashboardEngagementChart),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    ),
  }
);

interface EngagementTrendWidgetProps extends WidgetProps {
  data?: EngagementDataPoint[] | null;
  isLoading?: boolean;
}

function EngagementTrendWidget({
  data = null,
  isLoading = false,
}: EngagementTrendWidgetProps) {
  return <DashboardEngagementChart data={data} isLoading={isLoading} />;
}

export const engagementTrendWidgetDefinition: WidgetDefinition = {
  id: "engagement-trend",
  name: "Engagement Trends",
  description: "Area chart showing plays and likes trends over time",
  category: "engagement",
  icon: TrendingUp,
  component: EngagementTrendWidget,
  defaultSize: { w: 12, h: 4 },
  minSize: { w: 6, h: 3 },
  maxSize: { w: 12, h: 6 },
  dataRequirements: [
    {
      type: "metrics",
      fields: ["plays", "likes", "comments", "shares", "saves", "date"],
    },
  ],
};

// Register the widget
widgetRegistry.register(engagementTrendWidgetDefinition);

export { EngagementTrendWidget };
export type { EngagementDataPoint };
