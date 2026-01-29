"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface MetricCardProps {
  label: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "neutral"
  className?: string
}

function MetricCard({
  label,
  value,
  change,
  trend,
  className,
}: MetricCardProps) {
  const trendIcon = React.useMemo(() => {
    if (!trend) return null

    const iconProps = { className: "h-4 w-4" }

    switch (trend) {
      case "up":
        return <TrendingUp {...iconProps} />
      case "down":
        return <TrendingDown {...iconProps} />
      case "neutral":
        return <Minus {...iconProps} />
    }
  }, [trend])

  const trendColor = React.useMemo(() => {
    if (!trend) return ""

    switch (trend) {
      case "up":
        return "text-green-600 dark:text-green-400"
      case "down":
        return "text-red-600 dark:text-red-400"
      case "neutral":
        return "text-muted-foreground"
    }
  }, [trend])

  return (
    <Card className={cn("py-3 min-w-0 @container", className)}>
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-xs @xs:text-sm font-medium text-muted-foreground line-clamp-2">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3">
        <div className="flex flex-col gap-1">
          <span className="text-lg @xs:text-xl @sm:text-2xl font-bold truncate">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 shrink-0", trendColor)}>
              {trendIcon}
              <span className="text-xs @xs:text-sm font-medium">
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { MetricCard }
