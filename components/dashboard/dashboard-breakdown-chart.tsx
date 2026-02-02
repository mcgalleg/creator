"use client"

import * as React from "react"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"
import { PieChart } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface BreakdownItem {
  type: "likes" | "comments" | "shares" | "saves"
  value: number
  percentage: number
}

interface DashboardBreakdownChartProps {
  data: BreakdownItem[] | null
  isLoading?: boolean
}

const ENGAGEMENT_COLORS: Record<BreakdownItem["type"], string> = {
  likes: "var(--chart-1)",
  comments: "var(--chart-2)",
  shares: "var(--chart-3)",
  saves: "var(--chart-4)",
}

const ENGAGEMENT_LABELS: Record<BreakdownItem["type"], string> = {
  likes: "Likes",
  comments: "Comments",
  shares: "Shares",
  saves: "Saves",
}

function BreakdownChartSkeleton() {
  return (
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
  )
}

function EmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[250px] flex-col items-center justify-center text-center">
          <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No engagement data available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Breakdown of likes, comments, shares, and saves will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardBreakdownChart({ data, isLoading }: DashboardBreakdownChartProps) {
  if (isLoading) {
    return <BreakdownChartSkeleton />
  }

  const total = data?.reduce((sum, item) => sum + item.value, 0) ?? 0

  if (!data || data.length === 0 || total === 0) {
    return <EmptyState />
  }

  const chartConfig: ChartConfig = data.reduce((config, item) => {
    config[item.type] = {
      label: ENGAGEMENT_LABELS[item.type],
      color: ENGAGEMENT_COLORS[item.type],
    }
    return config
  }, {} as ChartConfig)

  const chartData = data.map((item) => ({
    ...item,
    name: item.type,
    fill: ENGAGEMENT_COLORS[item.type],
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] w-full"
        >
          <RechartsPieChart accessibilityLayer>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="type"
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {ENGAGEMENT_LABELS[name as BreakdownItem["type"]]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium tabular-nums">
                          {Number(value).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                          ({item.payload.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="type"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="type" />}
              className="flex-wrap gap-2"
            />
          </RechartsPieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export { DashboardBreakdownChart }
export type { DashboardBreakdownChartProps, BreakdownItem }
