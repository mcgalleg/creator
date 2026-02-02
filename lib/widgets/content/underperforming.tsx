"use client";

import * as React from "react";
import { TrendingDown, Play, Heart, MessageCircle, ExternalLink, AlertTriangle } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

interface UnderperformingPost {
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
  avgEngagementRate: number; // Average for comparison
  performanceGap: number; // How much below average (percentage)
}

interface UnderperformingWidgetProps extends WidgetProps {
  data?: UnderperformingPost[] | null;
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

function UnderperformingWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
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

function UnderperformingWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-amber-500" />
          Needs Attention
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
            <TrendingDown className="h-6 w-6 text-green-600 dark:text-green-400 rotate-180" />
          </div>
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            All content performing well!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            No underperforming posts detected
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function UnderperformingPostCard({ post }: { post: UnderperformingPost }) {
  const gapSeverity =
    post.performanceGap > 50 ? "high" :
    post.performanceGap > 25 ? "medium" : "low";

  const severityColors = {
    high: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
    medium: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
    low: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
  };

  return (
    <div className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
      {/* Thumbnail */}
      <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
        {post.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover opacity-75"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Play className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2 leading-tight">
          {post.description || "No description"}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            {formatNumber(post.plays)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {formatNumber(post.likes)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {formatNumber(post.comments)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {formatDate(post.postedAt)}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${severityColors[gapSeverity]}`}
                >
                  <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                  {post.performanceGap.toFixed(0)}% below avg
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Engagement: {post.engagementRate.toFixed(2)}%
                  <br />
                  Average: {post.avgEngagementRate.toFixed(2)}%
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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

function UnderperformingWidget({
  data = null,
  isLoading = false,
}: UnderperformingWidgetProps) {
  if (isLoading) {
    return <UnderperformingWidgetSkeleton />;
  }

  if (!data || data.length === 0) {
    return <UnderperformingWidgetEmpty />;
  }

  // Count by severity
  const highCount = data.filter(p => p.performanceGap > 50).length;
  const mediumCount = data.filter(p => p.performanceGap > 25 && p.performanceGap <= 50).length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-amber-500" />
          Needs Attention
          <div className="ml-auto flex items-center gap-1">
            {highCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5">
                {highCount} critical
              </Badge>
            )}
            {mediumCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {mediumCount} moderate
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-1">
          {data.map((post) => (
            <UnderperformingPostCard key={post.id} post={post} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const underperformingWidgetDefinition: WidgetDefinition = {
  id: "underperforming",
  name: "Underperforming Content",
  description: "Shows content with below-average engagement that needs attention",
  category: "content",
  icon: TrendingDown,
  component: UnderperformingWidget,
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
        "engagementRate",
        "avgEngagementRate",
        "performanceGap",
      ],
    },
  ],
};

// Register the widget
widgetRegistry.register(underperformingWidgetDefinition);

export { UnderperformingWidget };
export type { UnderperformingPost, UnderperformingWidgetProps };
