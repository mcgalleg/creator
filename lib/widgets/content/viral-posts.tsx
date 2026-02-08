"use client";

import * as React from "react";
import { Flame, Play, Heart, Share2, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

interface ViralPost {
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
  shareRate: number; // shares / plays * 100
}

interface ViralPostsWidgetProps extends WidgetProps {
  data?: ViralPost[] | null;
  isLoading?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function ViralPostsWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-16 w-16 rounded-md shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ViralPostsWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Viral Posts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Flame className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No viral posts yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Posts with high share rates will appear here
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ViralPostCard({ post }: { post: ViralPost }) {
  return (
    <div className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
      {/* Thumbnail */}
      <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
        {post.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Play className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <Badge
          variant="secondary"
          className="absolute top-1 left-1 text-[10px] px-1 py-0 bg-orange-500/90 text-white border-0"
        >
          <Flame className="h-2.5 w-2.5 mr-0.5" />
          Viral
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2 leading-tight">
          {post.description || "No description"}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            {formatNumber(post.shares)}
          </span>
          <span className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            {formatNumber(post.plays)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {formatNumber(post.likes)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {formatDate(post.postedAt)}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-orange-600 border-orange-300">
            {post.shareRate.toFixed(1)}% share rate
          </Badge>
        </div>
      </div>

      {/* External link */}
      {post.videoUrl && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          asChild
        >
          <a href={post.videoUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  );
}

function ViralPostsWidget({
  data = null,
  isLoading = false,
}: ViralPostsWidgetProps) {
  if (isLoading) {
    return <ViralPostsWidgetSkeleton />;
  }

  if (!data || data.length === 0) {
    return <ViralPostsWidgetEmpty />;
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Viral Posts
          <Badge variant="secondary" className="ml-auto text-xs">
            {data.length} posts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-1">
          {data.map((post) => (
            <ViralPostCard key={post.id} post={post} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const viralPostsWidgetDefinition: WidgetDefinition = {
  id: "viral-posts",
  name: "Viral Posts",
  description: "Shows content with high share rates that went viral",
  category: "content",
  icon: Flame,
  component: ViralPostsWidget,
  defaultSize: { w: 6, h: 5 },
  minSize: { w: 4, h: 4 },
  maxSize: { w: 12, h: 8 },
  dataRequirements: [
    {
      type: "posts",
      fields: [
        "id",
        "tiktokId",
        "description",
        "thumbnailUrl",
        "videoUrl",
        "likes",
        "comments",
        "shares",
        "plays",
        "saves",
        "postedAt",
        "shareRate",
      ],
    },
  ],
};

// Register the widget
widgetRegistry.register(viralPostsWidgetDefinition);

export { ViralPostsWidget };
export type { ViralPost, ViralPostsWidgetProps };
