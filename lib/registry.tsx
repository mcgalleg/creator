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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

// Lucide icons for Alert and Collapsible
import { AlertCircle, Info, ChevronsUpDown } from "lucide-react";

// React for Children.toArray in compositional components
import React from "react";

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
        videoUrl={props.videoUrl}
        tiktokId={props.tiktokId}
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

  // ==========================================================================
  // Alert / Feedback Components
  // ==========================================================================

  Alert: ({ element }) => {
    const props = element.props as {
      variant?: "default" | "destructive";
      title?: string;
      description: string;
    };
    const variant = props.variant || "default";
    const Icon = variant === "destructive" ? AlertCircle : Info;
    return (
      <Alert variant={variant}>
        <Icon className="h-4 w-4" />
        {props.title && <AlertTitle>{props.title}</AlertTitle>}
        <AlertDescription>{props.description}</AlertDescription>
      </Alert>
    );
  },

  Progress: ({ element }) => {
    const props = element.props as { value: number; label?: string };
    return (
      <div className="w-full space-y-1">
        {(props.label || props.value !== undefined) && (
          <div className="flex items-center justify-between text-sm">
            {props.label && (
              <span className="text-muted-foreground">{props.label}</span>
            )}
            <span className="font-medium">{props.value}%</span>
          </div>
        )}
        <Progress value={props.value} />
      </div>
    );
  },

  Separator: ({ element }) => {
    const props = element.props as {
      orientation?: "horizontal" | "vertical";
    };
    return <Separator orientation={props.orientation || "horizontal"} />;
  },

  Avatar: ({ element }) => {
    const props = element.props as {
      src?: string;
      fallback: string;
      size?: "sm" | "default" | "lg";
    };
    const sizeClass = {
      sm: "h-6 w-6 text-xs",
      default: "h-10 w-10",
      lg: "h-14 w-14 text-lg",
    }[props.size || "default"];
    return (
      <Avatar className={sizeClass}>
        {props.src && <AvatarImage src={props.src} alt={props.fallback} />}
        <AvatarFallback>{props.fallback}</AvatarFallback>
      </Avatar>
    );
  },

  Skeleton: ({ element }) => {
    const props = element.props as {
      width?: string;
      height?: string;
      rounded?: "none" | "sm" | "md" | "lg" | "full";
    };
    const roundedClass = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    }[props.rounded || "md"];
    return (
      <Skeleton
        className={roundedClass}
        style={{ width: props.width, height: props.height }}
      />
    );
  },

  // ==========================================================================
  // Container / Wrapper Components
  // ==========================================================================

  Tooltip: ({ element, children }) => {
    const props = element.props as { content: string };
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{children}</span>
        </TooltipTrigger>
        <TooltipContent>{props.content}</TooltipContent>
      </Tooltip>
    );
  },

  HoverCard: ({ element, children }) => {
    const props = element.props as {
      title?: string;
      description?: string;
      image?: string;
    };
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="cursor-pointer underline decoration-dotted">
            {children}
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            {props.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={props.image}
                alt={props.title || ""}
                className="w-full rounded-md object-cover"
              />
            )}
            {props.title && (
              <h4 className="text-sm font-semibold">{props.title}</h4>
            )}
            {props.description && (
              <p className="text-sm text-muted-foreground">
                {props.description}
              </p>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  },

  ScrollArea: ({ element, children }) => {
    const props = element.props as { maxHeight?: string };
    return (
      <ScrollArea
        className="rounded-md border p-4"
        style={{ maxHeight: props.maxHeight || "400px" }}
      >
        {children}
      </ScrollArea>
    );
  },

  AspectRatio: ({ element, children }) => {
    const props = element.props as { ratio?: number };
    return <AspectRatio ratio={props.ratio || 16 / 9}>{children}</AspectRatio>;
  },

  // ==========================================================================
  // Compositional Components
  // ==========================================================================

  Accordion: ({ element, children }) => {
    const props = element.props as {
      items: { title: string; value?: string }[];
      type?: "single" | "multiple";
      defaultValue?: string[];
    };
    const type = props.type || "single";
    const childArray = React.Children.toArray(children);
    const items = props.items.map((item, i) => ({
      ...item,
      value: item.value || `item-${i}`,
    }));

    if (type === "multiple") {
      return (
        <Accordion
          type="multiple"
          defaultValue={props.defaultValue}
          className="w-full"
        >
          {items.map((item, i) => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger>{item.title}</AccordionTrigger>
              <AccordionContent>
                {childArray[i] ?? null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );
    }

    return (
      <Accordion
        type="single"
        collapsible
        defaultValue={props.defaultValue?.[0]}
        className="w-full"
      >
        {items.map((item, i) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>
              {childArray[i] ?? null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  },

  Tabs: ({ element, children }) => {
    const props = element.props as {
      tabs: { label: string; value: string }[];
      defaultTab?: string;
    };
    const childArray = React.Children.toArray(children);
    const defaultValue = props.defaultTab || props.tabs[0]?.value;
    return (
      <Tabs defaultValue={defaultValue} className="w-full">
        <TabsList>
          {props.tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {props.tabs.map((tab, i) => (
          <TabsContent key={tab.value} value={tab.value}>
            {childArray[i] ?? null}
          </TabsContent>
        ))}
      </Tabs>
    );
  },

  Collapsible: ({ element, children }) => {
    const props = element.props as {
      title: string;
      defaultOpen?: boolean;
    };
    return (
      <Collapsible defaultOpen={props.defaultOpen || false} className="w-full">
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-4 py-2 font-medium hover:bg-muted">
          {props.title}
          <ChevronsUpDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  },
};
