"use client"

import * as React from "react"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export interface PieChartDataItem {
  [key: string]: string | number
}

export interface PieChartProps<T extends PieChartDataItem> {
  data: T[]
  nameKey: keyof T & string
  valueKey: keyof T & string
  title?: string
  height?: number
  className?: string
}

function PieChart<T extends PieChartDataItem>({
  data = [],
  nameKey,
  valueKey,
  title,
  height = 300,
  className,
}: PieChartProps<T>) {
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    data.forEach((item, index) => {
      const name = String(item[nameKey])
      config[name] = {
        label: name,
        color: COLORS[index % COLORS.length],
      }
    })
    return config
  }, [data, nameKey])

  const dataWithColors = React.useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }))
  }, [data])

  const content = (
    <ChartContainer config={chartConfig} className={cn("w-full", className)} style={{ height }}>
      <RechartsPieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent nameKey={nameKey} />} />
        <Pie
          data={dataWithColors}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {dataWithColors.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey={nameKey} />} />
      </RechartsPieChart>
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

export { PieChart }
