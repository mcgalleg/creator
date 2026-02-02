"use client";

import { TrendingUp } from "lucide-react";
import {
  DashboardEngagementChart,
  type EngagementDataPoint,
} from "@/components/dashboard/dashboard-engagement-chart";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

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
  category: "chart",
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
