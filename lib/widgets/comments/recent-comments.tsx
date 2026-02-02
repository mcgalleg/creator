"use client";

import * as React from "react";
import Image from "next/image";
import {
  MessageCircle,
  User,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ThumbsUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

interface Comment {
  id: number;
  tiktokId: string | null;
  text: string | null;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  likes: number;
  postedAt: string | null;
  createdAt: string;
  post: {
    id: number;
    tiktokId: string;
    description: string | null;
    thumbnailUrl: string | null;
  };
}

interface RecentCommentsData {
  comments: Comment[];
  total: number;
}

interface RecentCommentsWidgetProps extends WidgetProps {
  data?: RecentCommentsData | null;
  isLoading?: boolean;
}

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? "Just now" : `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }

  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 14) return "1w ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 60) return "1mo ago";
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;

  return `${Math.floor(diffDays / 365)}y ago`;
}

function truncateText(text: string | null, maxLength: number = 100): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3 p-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm font-medium text-muted-foreground">
        No comments yet
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Comments on your posts will appear here.
      </p>
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const textLength = comment.text?.length ?? 0;
  const shouldTruncate = textLength > 100;
  const displayText =
    shouldTruncate && !isExpanded
      ? truncateText(comment.text, 100)
      : comment.text;

  const tiktokUrl = comment.post.tiktokId
    ? `https://www.tiktok.com/@/video/${comment.post.tiktokId}`
    : null;

  return (
    <div className="flex gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <Avatar size="sm">
        {comment.authorAvatarUrl ? (
          <AvatarImage
            src={comment.authorAvatarUrl}
            alt={comment.authorUsername || "User"}
          />
        ) : null}
        <AvatarFallback>
          <User className="h-3 w-3" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium truncate">
            {comment.authorUsername || "Anonymous"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(comment.postedAt || comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground break-words">
          {displayText || <span className="italic">No text</span>}
        </p>
        {shouldTruncate && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show more
              </>
            )}
          </Button>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {comment.likes > 0 && (
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {comment.likes.toLocaleString()}
            </span>
          )}
          {tiktokUrl && (
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              View post
            </a>
          )}
        </div>
      </div>
      {comment.post.thumbnailUrl && (
        <div className="flex-shrink-0">
          <Image
            src={comment.post.thumbnailUrl}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded object-cover"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}

function RecentCommentsWidget({
  data = null,
  isLoading = false,
}: RecentCommentsWidgetProps) {
  const hasData = data && data.comments && data.comments.length > 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Recent Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <CommentSkeleton key={i} />
            ))}
          </div>
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <div className="divide-y">
            {data.comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const recentCommentsWidgetDefinition: WidgetDefinition = {
  id: "recent-comments",
  name: "Recent Comments",
  description: "Display latest comments across all posts",
  category: "comments",
  icon: MessageCircle,
  component: RecentCommentsWidget,
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  maxSize: { w: 12, h: 8 },
  dataRequirements: [
    {
      type: "comments",
      fields: [
        "id",
        "tiktokId",
        "text",
        "authorUsername",
        "authorAvatarUrl",
        "likes",
        "postedAt",
        "createdAt",
        "post",
      ],
    },
  ],
};

// Register the widget
widgetRegistry.register(recentCommentsWidgetDefinition);

export { RecentCommentsWidget };
export type { Comment, RecentCommentsData, RecentCommentsWidgetProps };
