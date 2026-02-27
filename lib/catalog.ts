import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { z } from "zod";
import { asProps, chartDataPointSchema } from "./schema-helpers";

// Pick standard shadcn component definitions
const {
  Stack, Grid, Card, Heading, Text, Badge, Alert,
  Progress, Separator, Avatar, Skeleton, Tooltip,
  Accordion, Tabs, Collapsible, Image, Table,
} = shadcnComponentDefinitions;

// =============================================================================
// Catalog Definition
// =============================================================================

export const catalog = defineCatalog(schema, {
  components: {
    // === Standard shadcn components (definitions from @json-render/shadcn) ===
    Stack, Grid, Card, Heading, Text, Badge, Alert,
    Progress, Separator, Avatar, Skeleton, Tooltip,
    Accordion, Tabs, Collapsible, Image, Table,

    // === Custom analytics components ===
    MetricCard: {
      props: asProps(z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        change: z.number().optional(),
        trend: z.enum(["up", "down", "neutral"]).nullable().optional(),
        format: z.enum(["number", "currency", "percent", "compact"]).optional(),
      })),
      description: "Single metric display showing a key value with optional trend indicator. Use for KPIs and important statistics.",
    },
    BarChart: {
      props: asProps(z.object({
        data: z.array(chartDataPointSchema),
        xKey: z.string(),
        yKeys: z.array(z.string()).min(1),
        title: z.string().optional(),
        height: z.number().optional().default(300),
        stacked: z.boolean().optional().default(false),
        horizontal: z.boolean().optional().default(false),
      })),
      description: "Bar chart for comparing categorical data.",
    },
    LineChart: {
      props: asProps(z.object({
        data: z.array(chartDataPointSchema),
        xKey: z.string(),
        yKeys: z.array(z.string()).min(1),
        title: z.string().optional(),
        height: z.number().optional().default(300),
      })),
      description: "Line chart for showing trends over time.",
    },
    AreaChart: {
      props: asProps(z.object({
        data: z.array(chartDataPointSchema),
        xKey: z.string(),
        yKeys: z.array(z.string()).min(1),
        title: z.string().optional(),
        height: z.number().optional().default(300),
        stacked: z.boolean().optional().default(false),
      })),
      description: "Area chart for showing volume over time.",
    },
    PieChart: {
      props: asProps(z.object({
        data: z.array(chartDataPointSchema),
        nameKey: z.string(),
        valueKey: z.string(),
        title: z.string().optional(),
        height: z.number().optional().default(300),
      })),
      description: "Pie chart for showing proportions of a whole.",
    },
    DataTable: {
      props: asProps(z.object({
        columns: z.array(z.object({
          key: z.string(),
          header: z.string().optional(),
          label: z.string().optional(),
          width: z.string().optional(),
          align: z.enum(["left", "center", "right"]).optional(),
          format: z.enum(["text", "number", "currency", "percent", "date"]).optional(),
        })).min(1),
        data: z.array(z.record(z.string(), z.unknown())),
        title: z.string().optional(),
        pageSize: z.number().optional().default(10),
      })),
      description: "Rich data table for displaying structured data in rows and columns.",
    },
  },
  actions: {},
});

// =============================================================================
// Catalog Prompt Generation
// =============================================================================

/**
 * Generates the chat-mode prompt with JSONL output instructions.
 * Includes the full component reference and spec-stream format instructions.
 */
export function getAnalyticsChatPrompt(): string {
  return catalog.prompt({ mode: "chat" });
}

/** @deprecated Use getAnalyticsChatPrompt() instead */
export function getAnalyticsCatalogPrompt(): string {
  return getAnalyticsChatPrompt();
}

// =============================================================================
// Type Exports (custom components only)
// =============================================================================

export type Catalog = typeof catalog;
