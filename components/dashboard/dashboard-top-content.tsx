'use client';

import * as React from 'react';
import Image from 'next/image';
import { Play, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TopContentVideo {
  id: number;
  tiktokId: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  plays: number;
  saves: number;
  postedAt: string | null;
  engagementRate: number;
}

interface DashboardTopContentProps {
  data: TopContentVideo[] | null;
  isLoading?: boolean;
}

function formatNumber(num: number | undefined | null): string {
  if (num == null) {
    return '0';
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatEngagementRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

function VideoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Skeleton className="aspect-[9/16] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function TopContentVideoCard({ video }: { video: TopContentVideo }) {
  const [imageError, setImageError] = React.useState(false);

  const handleClick = () => {
    if (video.videoUrl) {
      window.open(video.videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const showFallback = !video.thumbnailUrl || imageError;

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-card transition-all ${
        video.videoUrl ? 'cursor-pointer hover:ring-2 hover:ring-primary/50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="relative aspect-[9/16] bg-muted">
        {showFallback ? (
          <div className="flex h-full w-full items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        ) : (
          <>
            <Image
              src={video.thumbnailUrl!}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
              unoptimized
              onError={() => setImageError(true)}
            />
            {video.videoUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                <div className="rounded-full bg-white/90 p-3 shadow-lg">
                  <Play className="h-6 w-6 text-black fill-black" />
                </div>
              </div>
            )}
          </>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex items-center gap-1 text-white">
            <Play className="h-4 w-4" />
            <span className="text-sm font-medium">
              {formatNumber(video.plays)} plays
            </span>
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium min-h-[2.5rem]">
          {video.description || 'No description'}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {formatNumber(video.plays)} plays
          </span>
          <Badge variant="secondary" className="text-xs">
            {formatEngagementRate(video.engagementRate)} ER
          </Badge>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Video className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm font-medium text-muted-foreground">
        No top content available
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Post content to see your top performing videos here.
      </p>
    </div>
  );
}

export function DashboardTopContent({
  data,
  isLoading = false,
}: DashboardTopContentProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <VideoCardSkeleton key={index} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Content</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.map((video) => (
            <TopContentVideoCard key={video.id} video={video} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
