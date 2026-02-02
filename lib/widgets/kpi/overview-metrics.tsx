"use client";

import { BarChart3 } from "lucide-react";
import { DashboardKPIs } from "@/components/dashboard/dashboard-kpis";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

interface OverviewMetricsData {
  followers: number;
  followerChange: number;
  totalPlays: number;
  playsChange: number;
  engagementRate: number;
  engagementRateChange: number;
  contentVelocity: number;
}

interface OverviewMetricsWidgetProps extends WidgetProps {
  data?: OverviewMetricsData | null;
  isLoading?: boolean;
}

function OverviewMetricsWidget({
  data = null,
  isLoading = false,
}: OverviewMetricsWidgetProps) {
  return <DashboardKPIs data={data} isLoading={isLoading} />;
}

export const overviewMetricsWidgetDefinition: WidgetDefinition = {
  id: "overview-metrics",
  name: "Overview Metrics",
  description: "KPI cards showing followers, plays, engagement rate, and content velocity",
  category: "kpi",
  icon: BarChart3,
  component: OverviewMetricsWidget,
  defaultSize: { w: 12, h: 2 },
  minSize: { w: 8, h: 2 },
  maxSize: { w: 12, h: 3 },
  dataRequirements: [
    {
      type: "profile",
      fields: ["followers", "followerChange"],
    },
    {
      type: "metrics",
      fields: [
        "totalPlays",
        "playsChange",
        "engagementRate",
        "engagementRateChange",
        "contentVelocity",
      ],
    },
  ],
};

// Register the widget
widgetRegistry.register(overviewMetricsWidgetDefinition);

export { OverviewMetricsWidget };
export type { OverviewMetricsData, OverviewMetricsWidgetProps };
