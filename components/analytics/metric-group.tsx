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
  // Automatically adjust columns based on number of metrics for better layout
  const effectiveColumns = Math.min(columns, metrics.length) as 1 | 2 | 3 | 4 | 5 | 6;

  return (
    <div className={cn("w-full @container", className)}>
      <Grid
        columns={effectiveColumns}
        gap="sm"
      >
        {metrics.map((metric, index) => (
          <MetricCard key={`${metric.label}-${index}`} {...metric} />
        ))}
      </Grid>
    </div>
  )
}

export { MetricGroup }
