import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { z } from "zod";

const {
  Accordion, Alert, Avatar, Badge, Button, ButtonGroup, Card, Carousel,
  Checkbox, Collapsible, Dialog, Drawer, DropdownMenu, Grid, Heading,
  Image, Input, Link, Pagination, Popover, Progress, Radio, Select,
  Separator, Skeleton, Slider, Spinner, Stack, Switch, Table, Tabs,
  Text, Textarea, Toggle, ToggleGroup, Tooltip,
} = shadcnComponentDefinitions;

// Shared schemas for chart components
const seriesItemSchema = z.object({
  dataKey: z.string(),
  label: z.string().nullable(),
  color: z.string().nullable(),
  stackId: z.string().nullable(),
});
const dataRowSchema = z.record(z.string(), z.union([z.string(), z.number()]));

export const catalog = defineCatalog(schema, {
  components: {
    Accordion, Alert, Avatar, Badge, Button, ButtonGroup, Card, Carousel,
    Checkbox, Collapsible, Dialog, Drawer, DropdownMenu, Grid, Heading,
    Image, Input, Link, Pagination, Popover, Progress, Radio, Select,
    Separator, Skeleton, Slider, Spinner, Stack, Switch, Table, Tabs,
    Text, Textarea, Toggle, ToggleGroup, Tooltip,

    // Chart components
    AreaChart: {
      props: z.object({
        data: z.array(dataRowSchema),
        xKey: z.string(),
        series: z.array(seriesItemSchema),
        stacked: z.boolean().nullable(),
        tooltip: z.boolean().nullable(),
        legend: z.boolean().nullable(),
      }),
      description:
        "Area chart for time-series data with volume emphasis. Each series becomes a filled area. data is [{[xKey]: string, [series.dataKey]: number, ...}].",
      example: {
        data: [
          { month: "Jan", views: 1200, likes: 400 },
          { month: "Feb", views: 1800, likes: 600 },
          { month: "Mar", views: 2400, likes: 900 },
        ],
        xKey: "month",
        series: [
          { dataKey: "views", label: "Views" },
          { dataKey: "likes", label: "Likes" },
        ],
      },
    },
    BarChart: {
      props: z.object({
        data: z.array(dataRowSchema),
        xKey: z.string(),
        series: z.array(seriesItemSchema),
        stacked: z.boolean().nullable(),
        horizontal: z.boolean().nullable(),
        tooltip: z.boolean().nullable(),
        legend: z.boolean().nullable(),
      }),
      description:
        "Bar chart for categorical comparisons. Set horizontal=true when category labels are long. data is [{[xKey]: string, [series.dataKey]: number, ...}].",
      example: {
        data: [
          { post: "Video 1", likes: 1200, comments: 340 },
          { post: "Video 2", likes: 980, comments: 220 },
        ],
        xKey: "post",
        series: [
          { dataKey: "likes", label: "Likes" },
          { dataKey: "comments", label: "Comments" },
        ],
      },
    },
    LineChart: {
      props: z.object({
        data: z.array(dataRowSchema),
        xKey: z.string(),
        series: z.array(seriesItemSchema),
        dots: z.boolean().nullable(),
        tooltip: z.boolean().nullable(),
        legend: z.boolean().nullable(),
      }),
      description:
        "Line chart for trends over time. Cleaner than AreaChart for comparing multiple series. data is [{[xKey]: string, [series.dataKey]: number, ...}].",
      example: {
        data: [
          { day: "Mon", views: 1200 },
          { day: "Tue", views: 1800 },
          { day: "Wed", views: 1400 },
        ],
        xKey: "day",
        series: [{ dataKey: "views", label: "Views" }],
      },
    },
    PieChart: {
      props: z.object({
        data: z.array(dataRowSchema),
        nameKey: z.string(),
        valueKey: z.string(),
        donut: z.boolean().nullable(),
        tooltip: z.boolean().nullable(),
        legend: z.boolean().nullable(),
      }),
      description:
        "Pie chart for proportional data. Set donut=true for a donut chart. data is [{[nameKey]: string, [valueKey]: number}].",
      example: {
        data: [
          { source: "For You", visits: 4500 },
          { source: "Following", visits: 2100 },
          { source: "Search", visits: 800 },
        ],
        nameKey: "source",
        valueKey: "visits",
        donut: true,
      },
    },
    RadarChart: {
      props: z.object({
        data: z.array(dataRowSchema),
        subjectKey: z.string(),
        series: z.array(seriesItemSchema),
        tooltip: z.boolean().nullable(),
        legend: z.boolean().nullable(),
      }),
      description:
        "Radar chart for multi-dimensional comparison across categories. data is [{[subjectKey]: string, [series.dataKey]: number, ...}].",
      example: {
        data: [
          { metric: "Views", account1: 85, account2: 65 },
          { metric: "Likes", account1: 70, account2: 80 },
          { metric: "Shares", account1: 60, account2: 45 },
        ],
        subjectKey: "metric",
        series: [
          { dataKey: "account1", label: "Account 1" },
          { dataKey: "account2", label: "Account 2" },
        ],
      },
    },
    RadialChart: {
      props: z.object({
        data: z.array(dataRowSchema),
        nameKey: z.string(),
        valueKey: z.string(),
        tooltip: z.boolean().nullable(),
        legend: z.boolean().nullable(),
      }),
      description:
        "Radial bar chart showing proportional comparison as concentric arcs. data is [{[nameKey]: string, [valueKey]: number}].",
      example: {
        data: [
          { category: "Likes", count: 4500 },
          { category: "Comments", count: 2100 },
          { category: "Shares", count: 800 },
        ],
        nameKey: "category",
        valueKey: "count",
      },
    },
  },
  actions: {},
});

export function getAnalyticsChatPrompt(): string {
  let prompt = catalog.prompt({
    mode: "chat",
    system: "", // Role defined in the wrapping system prompt
    customRules: [
      "For ALL analytics, data, KPIs, charts, tables, and search results: use the ```spec JSONL format — never markdown tables.",
      "Wrap the overall response in a Stack (direction: vertical).",
      "For KPIs: use a Grid (columns: 3, gap: sm) of Cards. Each Card has a Heading (h3) for the metric name, Text (lead) for the value, and a Badge for trend. NEVER stack KPI cards vertically.",
      "For tabular data: use Table (columns: string[], rows: string[][]). Inline ALL row data as pre-formatted strings. Do NOT use repeat/$item with Table.",
      "For time-series: LineChart or AreaChart. For categorical: BarChart (horizontal=true for long labels). For proportions: PieChart (donut=true) or RadialChart. For multi-dimensional: RadarChart.",
      "Wrap charts in a Card with a title Heading. Max ~20 data points. Format numbers compactly (1.2M).",
      "NEVER use emoji in headings, text, or body content — plain text only.",
    ],
  });

  // The catalog's chat mode tells the model to "respond conversationally"
  // before ALL outputs, which causes narration between tool calls. Scope
  // these instructions to the final response only.
  prompt = prompt.replace(
    "You respond conversationally. When generating UI, first write a brief explanation (1-3 sentences), then output JSONL patch lines wrapped in a ```spec code fence.",
    "When your final response includes UI, write a brief analysis first, then output JSONL patch lines wrapped in a ```spec code fence. When calling tools, output NO text — call tools silently.",
  );
  prompt = prompt.replace(
    "2. Write a brief conversational response before any JSONL output",
    "2. Write your conversational response ONLY in the final step after all tool results are received — NEVER output text in a step that calls tools",
  );

  return prompt;
}

export type Catalog = typeof catalog;
