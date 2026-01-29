"use client";

import type { ComponentRegistry } from "@json-render/react";

// Import layout components
import { Row, Column, Grid } from "@/components/layout";
import type {
  RowProps,
  ColumnProps,
  GridProps,
} from "@/components/layout";

// Import analytics components
import {
  MetricCard,
  MetricGroup,
  BarChart,
  LineChart,
  AreaChart,
  PieChart,
  DataTable,
  VideoCard,
  TopVideosGrid,
  EngagementTimeline,
} from "@/components/analytics";
import type {
  MetricCardProps,
  MetricGroupProps,
  DataTableProps,
  DataTableColumn,
  VideoCardProps,
  TopVideosGridProps,
  EngagementTimelineProps,
} from "@/components/analytics";

// Chart prop types - matching actual component interfaces (not catalog schemas)
type ChartData = Record<string, unknown>[];
type PieChartData = Record<string, string | number>[];
interface XYChartPropsLocal {
  data: ChartData;
  xKey: string;
  yKeys: string[];
  title?: string;
  height?: number;
}
interface AreaChartPropsLocal extends XYChartPropsLocal {
  stacked?: boolean;
}
interface PieChartPropsLocal {
  data: PieChartData;
  nameKey: string;
  valueKey: string;
  title?: string;
  height?: number;
}

// Import ShadCN components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Component Registry for json-render
 *
 * Maps catalog component types to actual React component implementations.
 * Each renderer receives:
 * - element: The UI element with props from the catalog schema
 * - children: Rendered child elements (for container components)
 * - onAction: Callback to execute actions
 *
 * The catalog validates props at parse time, so we can safely cast props here.
 * We use the component's own prop types for type safety within the registry.
 */
export const registry: ComponentRegistry = {
  // ==========================================================================
  // Layout Components
  // ==========================================================================

  Row: ({ element, children }) => {
    const props = element.props as RowProps;
    return (
      <Row
        {...(props.gap && { gap: props.gap })}
        {...(props.align && { align: props.align })}
        {...(props.justify && { justify: props.justify })}
        {...(props.wrap !== undefined && { wrap: props.wrap })}
      >
        {children}
      </Row>
    );
  },

  Column: ({ element, children }) => {
    const props = element.props as ColumnProps;
    return (
      <Column
        {...(props.gap && { gap: props.gap })}
        {...(props.align && { align: props.align })}
      >
        {children}
      </Column>
    );
  },

  Grid: ({ element, children }) => {
    const props = element.props as GridProps;
    return (
      <div className="w-full">
        <Grid
          {...(props.columns && { columns: props.columns })}
          {...(props.gap && { gap: props.gap })}
        >
          {children}
        </Grid>
      </div>
    );
  },

  Card: ({ element, children }) => {
    const props = element.props as { title?: string; description?: string };
    return (
      <div className="w-full">
        <Card>
          {(props.title || props.description) && (
            <CardHeader>
              {props.title && <CardTitle>{props.title}</CardTitle>}
              {props.description && (
                <CardDescription>{props.description}</CardDescription>
              )}
            </CardHeader>
          )}
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    );
  },

  // ==========================================================================
  // Metric Components
  // ==========================================================================

  MetricCard: ({ element }) => {
    const props = element.props as MetricCardProps;
    return (
      <MetricCard
        label={props.label}
        value={props.value}
        change={props.change}
        trend={props.trend}
      />
    );
  },

  MetricGroup: ({ element }) => {
    const props = element.props as MetricGroupProps;
    return <MetricGroup metrics={props.metrics} columns={props.columns} />;
  },

  // ==========================================================================
  // Chart Components
  // ==========================================================================

  BarChart: ({ element }) => {
    const props = element.props as XYChartPropsLocal;
    return (
      <BarChart
        data={props.data}
        title={props.title}
        height={props.height}
        xKey={props.xKey}
        yKeys={props.yKeys}
      />
    );
  },

  LineChart: ({ element }) => {
    const props = element.props as XYChartPropsLocal;
    return (
      <LineChart
        data={props.data}
        title={props.title}
        height={props.height}
        xKey={props.xKey}
        yKeys={props.yKeys}
      />
    );
  },

  AreaChart: ({ element }) => {
    const props = element.props as AreaChartPropsLocal;
    return (
      <AreaChart
        data={props.data}
        title={props.title}
        height={props.height}
        xKey={props.xKey}
        yKeys={props.yKeys}
        stacked={props.stacked}
      />
    );
  },

  PieChart: ({ element }) => {
    const props = element.props as PieChartPropsLocal;
    return (
      <PieChart
        data={props.data}
        title={props.title}
        height={props.height}
        nameKey={props.nameKey}
        valueKey={props.valueKey}
      />
    );
  },

  // ==========================================================================
  // Table Component
  // ==========================================================================

  DataTable: ({ element }) => {
    const props = element.props as DataTableProps<Record<string, unknown>>;
    return (
      <DataTable
        columns={props.columns}
        data={props.data}
        title={props.title}
      />
    );
  },

  // ==========================================================================
  // TikTok-Specific Components
  // ==========================================================================

  VideoCard: ({ element }) => {
    const props = element.props as VideoCardProps;
    return (
      <VideoCard
        thumbnailUrl={props.thumbnailUrl}
        description={props.description}
        likes={props.likes}
        comments={props.comments}
        shares={props.shares}
        plays={props.plays}
        postedAt={props.postedAt}
      />
    );
  },

  TopVideosGrid: ({ element }) => {
    const props = element.props as TopVideosGridProps;
    return <TopVideosGrid videos={props.videos} columns={props.columns} />;
  },

  EngagementTimeline: ({ element }) => {
    const props = element.props as EngagementTimelineProps;
    return (
      <EngagementTimeline
        data={props.data}
        title={props.title}
        height={props.height}
      />
    );
  },

  // ==========================================================================
  // Text Components
  // ==========================================================================

  Heading: ({ element }) => {
    const props = element.props as { text: string; level?: number | string };
    // Handle level as number, string number, or "h1"-"h6" format
    let level = 2;
    if (typeof props.level === "number") {
      level = props.level;
    } else if (typeof props.level === "string") {
      const parsed = props.level.replace(/^h/i, "");
      level = parseInt(parsed, 10) || 2;
    }
    level = Math.max(1, Math.min(6, level));
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
    const sizeClasses: Record<number, string> = {
      1: "text-4xl font-bold tracking-tight",
      2: "text-3xl font-bold tracking-tight",
      3: "text-2xl font-semibold",
      4: "text-xl font-semibold",
      5: "text-lg font-medium",
      6: "text-base font-medium",
    };
    return <Tag className={sizeClasses[level]}>{props.text}</Tag>;
  },

  Text: ({ element }) => {
    const props = element.props as {
      text: string;
      variant?: "default" | "muted" | "small";
    };
    const variant = props.variant || "default";
    const variantClasses: Record<string, string> = {
      default: "text-foreground",
      muted: "text-muted-foreground",
      small: "text-sm text-muted-foreground",
    };
    return <p className={variantClasses[variant]}>{props.text}</p>;
  },

  Badge: ({ element }) => {
    const props = element.props as {
      text: string;
      variant?: "default" | "secondary" | "destructive" | "outline";
    };
    return (
      <Badge variant={props.variant || "default"}>{props.text}</Badge>
    );
  },
};
