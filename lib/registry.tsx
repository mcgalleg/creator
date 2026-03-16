"use client";

import { defineRegistry } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { catalog } from "@/lib/catalog";
import {
  AreaChart as RAreaChart,
  Area,
  BarChart as RBarChart,
  Bar,
  LineChart as RLineChart,
  Line,
  PieChart as RPieChart,
  Pie,
  RadarChart as RRadarChart,
  Radar,
  RadialBarChart as RRadialBarChart,
  RadialBar,
  CartesianGrid,
  XAxis,
  YAxis,
  PolarGrid,
  PolarAngleAxis,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const {
  Accordion, Alert, Avatar, Badge, Button, ButtonGroup, Card, Carousel,
  Checkbox, Collapsible, Dialog, Drawer, DropdownMenu, Heading,
  Image, Input, Link, Pagination, Popover, Progress, Radio, Select,
  Separator, Skeleton, Slider, Spinner, Stack, Switch, Table, Tabs,
  Text, Textarea, Toggle, ToggleGroup, Tooltip,
} = shadcnComponents;

// ---------------------------------------------------------------------------
// Chart helpers
// ---------------------------------------------------------------------------

/** Shared tick styling for cartesian axes — ensures text is always visible. */
const AXIS_TICK = { fontSize: 12, fill: "currentColor" };

/** Abbreviate large numbers for Y-axis readability: 1500 → "1.5K", 2300000 → "2.3M" */
function compactNumber(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${+(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const CHART_COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
  "var(--chart-4)", "var(--chart-5)",
];

function getColor(index: number, explicit?: string | null): string {
  return explicit ?? CHART_COLORS[index % CHART_COLORS.length];
}

type SeriesItem = {
  dataKey: string;
  label?: string | null;
  color?: string | null;
  stackId?: string | null;
};

/** Build ChartConfig for series-based charts (Area/Bar/Line/Radar). */
function buildSeriesConfig(series: SeriesItem[]): ChartConfig {
  if (!Array.isArray(series)) return {};
  const config: ChartConfig = {};
  series.forEach((s, i) => {
    config[s.dataKey] = {
      label: s.label ?? s.dataKey,
      color: getColor(i, s.color),
    };
  });
  return config;
}

/** Build ChartConfig for categorical charts (Pie/Radial) and inject fill colors into data. */
function buildCategoricalChart(
  data: Record<string, unknown>[],
  nameKey: string,
): { config: ChartConfig; coloredData: Record<string, unknown>[] } {
  const config: ChartConfig = {};
  if (!Array.isArray(data)) return { config: {}, coloredData: [] };
  const coloredData = data.map((row, i) => {
    const name = String(row[nameKey] ?? `item-${i}`);
    config[name] = {
      label: name,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
    return { ...row, fill: CHART_COLORS[i % CHART_COLORS.length] };
  });
  return { config, coloredData };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const { registry } = defineRegistry(catalog, {
  components: {
    Accordion, Alert, Avatar, Badge, Button, ButtonGroup, Card, Carousel,
    Checkbox, Collapsible, Dialog, Drawer, DropdownMenu, Heading,
    Image, Input, Link, Pagination, Popover, Progress, Radio, Select,
    Separator, Skeleton, Slider, Spinner, Stack, Switch, Table, Tabs,
    Text, Textarea, Toggle, ToggleGroup, Tooltip,

    // Override Grid with responsive breakpoints (shadcn Grid uses fixed columns)
    Grid: ({ props, children }) => {
      const { columns, gap: gapProp } = props as {
        columns?: number | null;
        gap?: "sm" | "md" | "lg" | null;
      };
      const gapMap: Record<string, string> = { sm: "gap-2", md: "gap-3", lg: "gap-4" };
      const n = Math.max(1, Math.min(6, columns ?? 1));
      const gap = gapMap[gapProp ?? "md"] ?? "gap-3";
      const cols =
        n <= 1 ? "grid-cols-1"
        : n === 2 ? "grid-cols-1 sm:grid-cols-2"
        : n === 3 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        : n === 4 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        : `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${n}`;
      return <div className={`grid ${cols} ${gap}`}>{children}</div>;
    },

    // -----------------------------------------------------------------------
    // Chart components
    // -----------------------------------------------------------------------

    AreaChart: ({ props }) => {
      const { data, xKey, series, stacked, tooltip, legend } = props as {
        data: Record<string, unknown>[];
        xKey: string;
        series: SeriesItem[];
        stacked?: boolean | null;
        tooltip?: boolean | null;
        legend?: boolean | null;
      };
      const config = buildSeriesConfig(series);
      return (
        <ChartContainer config={config}>
          <RAreaChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} tick={AXIS_TICK} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={AXIS_TICK} tickFormatter={compactNumber} />
            {tooltip !== false && (
              <ChartTooltip content={<ChartTooltipContent />} />
            )}
            {legend && <ChartLegend content={<ChartLegendContent />} />}
            {series.map((s) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                fill={`var(--color-${s.dataKey})`}
                stroke={`var(--color-${s.dataKey})`}
                fillOpacity={0.3}
                stackId={stacked ? "stack" : (s.stackId ?? undefined)}
              />
            ))}
          </RAreaChart>
        </ChartContainer>
      );
    },

    BarChart: ({ props }) => {
      const { data, xKey, series, stacked, horizontal, tooltip, legend } = props as {
        data: Record<string, unknown>[];
        xKey: string;
        series: SeriesItem[];
        stacked?: boolean | null;
        horizontal?: boolean | null;
        tooltip?: boolean | null;
        legend?: boolean | null;
      };
      const config = buildSeriesConfig(series);
      // Horizontal bar charts need enough height for each bar row
      const minH = horizontal && Array.isArray(data)
        ? `${Math.max(200, data.length * 40)}px`
        : undefined;
      return (
        <ChartContainer config={config} style={minH ? { minHeight: minH } : undefined}>
          <RBarChart
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} />
            {horizontal ? (
              <>
                <YAxis
                  dataKey={xKey}
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={AXIS_TICK}
                  width={120}
                />
                <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} tick={AXIS_TICK} tickFormatter={compactNumber} />
              </>
            ) : (
              <>
                <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} tick={AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={AXIS_TICK} tickFormatter={compactNumber} />
              </>
            )}
            {tooltip !== false && (
              <ChartTooltip content={<ChartTooltipContent />} />
            )}
            {legend && <ChartLegend content={<ChartLegendContent />} />}
            {series.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                fill={`var(--color-${s.dataKey})`}
                radius={4}
                stackId={stacked ? "stack" : (s.stackId ?? undefined)}
              >
                {/* Single-series categorical: color each bar differently */}
                {series.length === 1 && Array.isArray(data) && data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            ))}
          </RBarChart>
        </ChartContainer>
      );
    },

    LineChart: ({ props }) => {
      const { data, xKey, series, dots, tooltip, legend } = props as {
        data: Record<string, unknown>[];
        xKey: string;
        series: SeriesItem[];
        dots?: boolean | null;
        tooltip?: boolean | null;
        legend?: boolean | null;
      };
      const config = buildSeriesConfig(series);
      return (
        <ChartContainer config={config}>
          <RLineChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} tick={AXIS_TICK} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={AXIS_TICK} tickFormatter={compactNumber} />
            {tooltip !== false && (
              <ChartTooltip content={<ChartTooltipContent />} />
            )}
            {legend && <ChartLegend content={<ChartLegendContent />} />}
            {series.map((s) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                stroke={`var(--color-${s.dataKey})`}
                strokeWidth={2}
                dot={!!dots}
              />
            ))}
          </RLineChart>
        </ChartContainer>
      );
    },

    PieChart: ({ props }) => {
      const { data, nameKey, valueKey, donut, tooltip, legend } = props as {
        data: Record<string, unknown>[];
        nameKey: string;
        valueKey: string;
        donut?: boolean | null;
        tooltip?: boolean | null;
        legend?: boolean | null;
      };
      const { config, coloredData } = buildCategoricalChart(data, nameKey);
      return (
        <ChartContainer config={config} className="mx-auto aspect-square" style={{ minHeight: 250, maxHeight: 350 }}>
          <RPieChart accessibilityLayer>
            {tooltip !== false && (
              <ChartTooltip content={<ChartTooltipContent nameKey={nameKey} hideLabel />} />
            )}
            {legend !== false && (
              <ChartLegend content={<ChartLegendContent nameKey={nameKey} />} />
            )}
            <Pie
              data={coloredData}
              dataKey={valueKey}
              nameKey={nameKey}
              innerRadius={donut ? "40%" : 0}
            />
          </RPieChart>
        </ChartContainer>
      );
    },

    RadarChart: ({ props }) => {
      const { data, subjectKey, series, tooltip, legend } = props as {
        data: Record<string, unknown>[];
        subjectKey: string;
        series: SeriesItem[];
        tooltip?: boolean | null;
        legend?: boolean | null;
      };
      const config = buildSeriesConfig(series);
      return (
        <ChartContainer config={config}>
          <RRadarChart data={data} accessibilityLayer>
            <PolarGrid />
            <PolarAngleAxis dataKey={subjectKey} tick={AXIS_TICK} />
            {tooltip !== false && (
              <ChartTooltip content={<ChartTooltipContent />} />
            )}
            {legend && <ChartLegend content={<ChartLegendContent />} />}
            {series.map((s) => (
              <Radar
                key={s.dataKey}
                dataKey={s.dataKey}
                fill={`var(--color-${s.dataKey})`}
                stroke={`var(--color-${s.dataKey})`}
                fillOpacity={0.3}
              />
            ))}
          </RRadarChart>
        </ChartContainer>
      );
    },

    RadialChart: ({ props }) => {
      const { data, nameKey, valueKey, tooltip, legend } = props as {
        data: Record<string, unknown>[];
        nameKey: string;
        valueKey: string;
        tooltip?: boolean | null;
        legend?: boolean | null;
      };
      const { config, coloredData } = buildCategoricalChart(data, nameKey);
      return (
        <ChartContainer config={config} className="mx-auto aspect-square" style={{ minHeight: 250, maxHeight: 350 }}>
          <RRadialBarChart
            data={coloredData}
            innerRadius="30%"
            outerRadius="90%"
            accessibilityLayer
          >
            {tooltip !== false && (
              <ChartTooltip content={<ChartTooltipContent nameKey={nameKey} hideLabel />} />
            )}
            {legend !== false && (
              <ChartLegend content={<ChartLegendContent nameKey={nameKey} />} />
            )}
            <RadialBar dataKey={valueKey} background />
          </RRadialBarChart>
        </ChartContainer>
      );
    },
  },
});
