"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { VideoCard, type VideoCardProps } from "./video-card"
import { Grid } from "@/components/layout"

export interface TopVideosGridProps {
  videos: VideoCardProps[]
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
}

function TopVideosGrid({
  videos,
  columns = 3,
  className,
}: TopVideosGridProps) {
  return (
    <Grid
      columns={columns}
      gap="md"
      className={cn("w-full", className)}
    >
      {videos.map((video, index) => (
        <VideoCard key={`video-${index}`} {...video} />
      ))}
    </Grid>
  )
}

export { TopVideosGrid }
