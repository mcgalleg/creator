"use client"

import * as React from "react"
import Image from "next/image"
import { Heart, MessageCircle, Share2, Play, X, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { TikTokEmbed } from "react-social-media-embed"

export interface VideoCardProps {
  thumbnailUrl: string
  description: string
  likes: number
  comments: number
  shares: number
  plays: number
  postedAt: string
  videoUrl?: string
  tiktokId?: string
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
  videoUrl,
  tiktokId,
  className,
}: VideoCardProps) {
  const [showEmbed, setShowEmbed] = React.useState(false)
  const [embedError, setEmbedError] = React.useState(false)

  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(postedAt), { addSuffix: true })
    } catch {
      return postedAt
    }
  }, [postedAt])

  // Determine if we can embed this video
  const canEmbed = !!(videoUrl || tiktokId)

  // Construct the TikTok URL for embedding
  const embedUrl = React.useMemo(() => {
    if (videoUrl) return videoUrl
    if (tiktokId) {
      // Construct a generic TikTok video URL
      // The embed component will handle it
      return `https://www.tiktok.com/video/${tiktokId}`
    }
    return null
  }, [videoUrl, tiktokId])

  const handleClick = () => {
    if (canEmbed && !embedError) {
      setShowEmbed(true)
    } else if (videoUrl) {
      // Fallback: open in new tab
      window.open(videoUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoUrl) {
      window.open(videoUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden @container transition-all",
          canEmbed && "cursor-pointer hover:ring-2 hover:ring-primary/50",
          className
        )}
        onClick={handleClick}
      >
        <div className="relative aspect-[9/16] @xs:aspect-video bg-muted">
          {thumbnailUrl ? (
            <>
              <Image
                src={thumbnailUrl}
                alt={description || "Video thumbnail"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {/* Play button overlay for embeddable videos */}
              {canEmbed && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="rounded-full bg-white/90 p-3 shadow-lg">
                    <Play className="h-8 w-8 text-black fill-black" />
                  </div>
                </div>
              )}
            </>
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
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 shrink-0" />
              <span>{formatNumber(likes)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span>{formatNumber(comments)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="h-4 w-4 shrink-0" />
              <span>{formatNumber(shares)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Embed Modal */}
      {showEmbed && embedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowEmbed(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-md w-full bg-background rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm font-medium truncate pr-2">{description}</span>
              <div className="flex items-center gap-1 shrink-0">
                {videoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenExternal}
                    className="h-8 w-8 p-0"
                    title="Open on TikTok"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmbed(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* TikTok Embed */}
            <div className="relative w-full overflow-hidden" style={{ minHeight: '500px' }}>
              <TikTokEmbed
                url={embedUrl}
                width="100%"
                onError={() => setEmbedError(true)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export { VideoCard }
