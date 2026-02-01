"use client"

import * as React from "react"
import {
  BarChart as RechartsBarChart,
  Bar,
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

export interface BarChartProps<T extends Record<string, unknown>> {
  data: T[]
  xKey: keyof T & string
  yKeys: (keyof T & string)[]
  title?: string
  height?: number
  className?: string
}

function BarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKeys = [],
  title,
  height = 300,
  className,
}: BarChartProps<T>) {
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
      <RechartsBarChart data={data} accessibilityLayer>
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
          <Bar
            key={key}
            dataKey={key}
            fill={COLORS[index % COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
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

export { BarChart }
