"use client"

import * as React from "react"
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { TrendingUp } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

interface EngagementDataPoint {
  date: string
  plays: number
  likes: number
  comments: number
  shares: number
  saves: number
}

interface DashboardEngagementChartProps {
  data: EngagementDataPoint[] | null
  isLoading?: boolean
}

const chartConfig: ChartConfig = {
  plays: {
    label: "Plays",
    color: "var(--chart-1)",
  },
  likes: {
    label: "Likes",
    color: "var(--chart-2)",
  },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function DashboardEngagementChart({
  data,
  isLoading = false,
}: DashboardEngagementChartProps) {
  const formattedData = React.useMemo(() => {
    if (!data) return []
    return data.map((point) => ({
      ...point,
      formattedDate: formatDate(point.date),
    }))
  }, [data])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] flex-col items-center justify-center text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-muted-foreground">
              No engagement data available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Engagement trends will appear here as your content gains traction.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <RechartsAreaChart data={formattedData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="formattedDate"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={<ChartTooltipContent />}
              labelFormatter={(_, payload) => {
                if (payload && payload.length > 0) {
                  return formatDate(payload[0].payload.date)
                }
                return ""
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="plays"
              stroke="var(--chart-1)"
              fill="var(--chart-1)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="likes"
              stroke="var(--chart-2)"
              fill="var(--chart-2)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RechartsAreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export { DashboardEngagementChart }
export type { EngagementDataPoint, DashboardEngagementChartProps }
