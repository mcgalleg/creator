"use client"

import * as React from "react"
import Image from "next/image"
import { Heart, MessageCircle, Share2, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

export interface VideoCardProps {
  thumbnailUrl: string
  description: string
  likes: number
  comments: number
  shares: number
  plays: number
  postedAt: string
  className?: string
}

function formatNumber(num: number | undefined | null): string {
  if (num == null) {
    return "0"
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

function VideoCard({
  thumbnailUrl,
  description,
  likes,
  comments,
  shares,
  plays,
  postedAt,
  className,
}: VideoCardProps) {
  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(postedAt), { addSuffix: true })
    } catch {
      return postedAt
    }
  }, [postedAt])

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative aspect-[9/16] bg-muted">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={description}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex items-center gap-1 text-white">
            <Play className="h-4 w-4" />
            <span className="text-sm font-medium">{formatNumber(plays)}</span>
          </div>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="line-clamp-2 text-sm font-medium">{description}</p>
        <p className="mt-1 text-xs text-muted-foreground">{timeAgo}</p>
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{formatNumber(likes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{formatNumber(comments)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            <span>{formatNumber(shares)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { VideoCard }
