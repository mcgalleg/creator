"use client";

import { PieChart } from "lucide-react";
import {
  DashboardBreakdownChart,
  type BreakdownItem,
} from "@/components/dashboard/dashboard-breakdown-chart";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

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
