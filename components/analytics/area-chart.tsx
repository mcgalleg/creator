"use client"

import * as React from "react"
import {
  AreaChart as RechartsAreaChart,
  Area,
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
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export interface AreaChartProps<T extends Record<string, unknown>> {
  data: T[]
  xKey: keyof T & string
  yKeys: (keyof T & string)[]
  title?: string
  height?: number
  className?: string
  stacked?: boolean
}

function AreaChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKeys = [],
  title,
  height = 300,
  className,
  stacked = false,
}: AreaChartProps<T>) {
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    yKeys.forEach((key, index) => {
      config[key] = {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        color: COLORS[index % COLORS.length],
      }
    })
    return config
  }, [yKeys])

  const content = (
    <ChartContainer config={chartConfig} className={cn("w-full", className)} style={{ height }}>
      <RechartsAreaChart data={data} accessibilityLayer>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {yKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[index % COLORS.length]}
            fill={COLORS[index % COLORS.length]}
            fillOpacity={0.3}
            strokeWidth={2}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </RechartsAreaChart>
    </ChartContainer>
  )

  if (!title) {
    return content
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}

export { AreaChart }
