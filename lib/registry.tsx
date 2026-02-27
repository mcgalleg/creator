"use client";

import { defineRegistry, useStateStore } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { catalog } from "@/lib/catalog";

// Custom analytics components
import { MetricCard } from "@/components/analytics/metric-card";
import { BarChart } from "@/components/analytics/bar-chart";
import { LineChart } from "@/components/analytics/line-chart";
import { AreaChart } from "@/components/analytics/area-chart";
import { PieChart } from "@/components/analytics/pie-chart";
import { DataTable } from "@/components/analytics/data-table";

export const { registry } = defineRegistry(catalog, {
  components: {
    // === Standard shadcn implementations (pre-built) ===
    Stack: shadcnComponents.Stack,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Grid: ({ props, children }: any) => {
      const gapMap: Record<string, string> = { sm: "gap-2", md: "gap-3", lg: "gap-4" };
      const n = Math.max(1, Math.min(6, props.columns ?? 1));
      const gap = gapMap[props.gap ?? "md"] ?? "gap-3";
      // Responsive: collapse to fewer columns on small screens
      const cols =
        n <= 1 ? "grid-cols-1"
        : n === 2 ? "grid-cols-1 sm:grid-cols-2"
        : n === 3 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        : n === 4 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        : `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${n}`;
      return <div className={`grid ${cols} ${gap}`}>{children}</div>;
    },
    Card: shadcnComponents.Card,
    Heading: shadcnComponents.Heading,
    Text: shadcnComponents.Text,
    Badge: shadcnComponents.Badge,
    Alert: shadcnComponents.Alert,
    Progress: shadcnComponents.Progress,
    Separator: shadcnComponents.Separator,
    Avatar: shadcnComponents.Avatar,
    Skeleton: shadcnComponents.Skeleton,
    Tooltip: shadcnComponents.Tooltip,
    Accordion: shadcnComponents.Accordion,
    Tabs: shadcnComponents.Tabs,
    Collapsible: shadcnComponents.Collapsible,
    Image: shadcnComponents.Image,
    Table: shadcnComponents.Table,

    // === Custom analytics components ===
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MetricCard: ({ props }: any) => (
      <MetricCard
        label={props.label}
        value={props.value}
        change={props.change}
        trend={props.trend}
        className="flex-1 min-w-[140px]"
      />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BarChart: ({ props }: any) => (
      <BarChart
        data={props.data}
        xKey={props.xKey}
        yKeys={props.yKeys}
        title={props.title}
        height={props.height}
      />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    LineChart: ({ props }: any) => (
      <LineChart
        data={props.data}
        xKey={props.xKey}
        yKeys={props.yKeys}
        title={props.title}
        height={props.height}
      />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AreaChart: ({ props }: any) => (
      <AreaChart
        data={props.data}
        xKey={props.xKey}
        yKeys={props.yKeys}
        title={props.title}
        height={props.height}
        stacked={props.stacked}
      />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PieChart: ({ props }: any) => (
      <PieChart
        data={props.data}
        nameKey={props.nameKey}
        valueKey={props.valueKey}
        title={props.title}
        height={props.height}
      />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DataTable: ({ props }: any) => {
      // AI sometimes puts data in /state instead of props.data — resolve from state as fallback
      const store = useStateStore();
      let data = props.data;
      if ((!data || (Array.isArray(data) && data.length === 0)) && store.state) {
        // Find the first array in state that could be table data
        for (const [, value] of Object.entries(store.state)) {
          if (Array.isArray(value) && value.length > 0) {
            data = value;
            break;
          }
        }
      }
      return (
        <DataTable
          columns={props.columns}
          data={data}
          title={props.title}
        />
      );
    },
  },
});
