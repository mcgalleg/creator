"use client"

import * as React from "react"
import { BarChart3 } from "lucide-react"
import { MetricCard } from "@/components/analytics/metric-card"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardKPIsProps {
  data: {
    followers: number
    followerChange: number
    totalPlays: number
    playsChange: number
    engagementRate: number
    engagementRateChange: number
    contentVelocity: number
  } | null
  isLoading?: boolean
}

function getTrend(change: number): "up" | "down" | "neutral" {
  if (change > 0) return "up"
  if (change < 0) return "down"
  return "neutral"
}

function formatNumber(num: number): string {
  return num.toLocaleString()
}

function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`
}

function KPICardSkeleton() {
  return (
    <Card className="py-3 min-w-0">
      <CardHeader className="pb-1 px-3">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent className="px-3">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardKPIs({ data, isLoading }: DashboardKPIsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="py-8">
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-muted-foreground">
              No metrics available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Data will appear here once analytics are collected.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Followers"
        value={formatNumber(data.followers)}
        change={data.followerChange}
        trend={getTrend(data.followerChange)}
      />
      <MetricCard
        label="Total Plays"
        value={formatNumber(data.totalPlays)}
        change={data.playsChange}
        trend={getTrend(data.playsChange)}
      />
      <MetricCard
        label="Engagement Rate"
        value={formatPercentage(data.engagementRate)}
        change={data.engagementRateChange}
        trend={getTrend(data.engagementRateChange)}
      />
      <MetricCard
        label="Content Velocity"
        value={`${data.contentVelocity} videos`}
      />
    </div>
  )
}

export { DashboardKPIs }
export type { DashboardKPIsProps }
