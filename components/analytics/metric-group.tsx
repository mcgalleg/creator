"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MetricCard, type MetricCardProps } from "./metric-card"
import { Grid } from "@/components/layout"

export interface MetricGroupProps {
  metrics: MetricCardProps[]
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
}

function MetricGroup({
  metrics = [],
  columns = 4,
  className,
}: MetricGroupProps) {
  return (
    <Grid
      columns={columns}
      gap="md"
      className={cn("w-full", className)}
    >
      {metrics.map((metric, index) => (
        <MetricCard key={`${metric.label}-${index}`} {...metric} />
      ))}
    </Grid>
  )
}

export { MetricGroup }
