"use client";

import dynamic from "next/dynamic";
import { PieChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { BreakdownItem } from "@/components/dashboard/dashboard-breakdown-chart";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

// Dynamically import the chart to defer Recharts compilation
const DashboardBreakdownChart = dynamic(
  () => import("@/components/dashboard/dashboard-breakdown-chart").then((mod) => mod.DashboardBreakdownChart),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4">
            <Skeleton className="h-48 w-48 rounded-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    ),
  }
);

interface EngagementBreakdownWidgetProps extends WidgetProps {
  data?: BreakdownItem[] | null;
  isLoading?: boolean;
}

function EngagementBreakdownWidget({
  data = null,
  isLoading = false,
}: EngagementBreakdownWidgetProps) {
  return <DashboardBreakdownChart data={data} isLoading={isLoading} />;
}

export const engagementBreakdownWidgetDefinition: WidgetDefinition = {
  id: "engagement-breakdown",
  name: "Engagement Breakdown",
  description: "Pie chart showing distribution of likes, comments, shares, and saves",
  category: "chart",
  icon: PieChart,
  component: EngagementBreakdownWidget,
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  maxSize: { w: 8, h: 6 },
  dataRequirements: [
    {
      type: "metrics",
      fields: ["likes", "comments", "shares", "saves"],
    },
  ],
};

// Register the widget
widgetRegistry.register(engagementBreakdownWidgetDefinition);

export { EngagementBreakdownWidget };
export type { BreakdownItem };
