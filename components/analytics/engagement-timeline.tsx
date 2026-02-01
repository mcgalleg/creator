"use client"

import * as React from "react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface EngagementDataPoint {
  date: string
  likes: number
  comments: number
  shares: number
  plays: number
}

export interface EngagementTimelineProps {
  data: EngagementDataPoint[]
  title?: string
  description?: string
  height?: number
  className?: string
}

const chartConfig: ChartConfig = {
  likes: {
    label: "Likes",
    color: "var(--chart-1)",
  },
  comments: {
    label: "Comments",
    color: "var(--chart-2)",
  },
  shares: {
    label: "Shares",
    color: "var(--chart-3)",
  },
  plays: {
    label: "Plays",
    color: "var(--chart-4)",
  },
}

function EngagementTimeline({
  data,
  title = "Engagement Timeline",
  description,
  height = 350,
  className,
}: EngagementTimelineProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
          <RechartsLineChart data={data} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="plays"
              stroke="var(--chart-4)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="likes"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="comments"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="shares"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
            />
          </RechartsLineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export { EngagementTimeline }
