"use client";

import * as React from "react";
import { Users, User, MessageCircle, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

interface TopCommenter {
  authorUsername: string;
  authorAvatarUrl: string | null;
  commentCount: number;
  totalLikes: number;
}

interface TopCommentersData {
  commenters: TopCommenter[];
  total: number;
}

interface TopCommentersWidgetProps extends WidgetProps {
  data?: TopCommentersData | null;
  isLoading?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

function CommenterSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-12" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm font-medium text-muted-foreground">
        No commenters yet
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Your most engaged commenters will appear here.
      </p>
    </div>
  );
}

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
        <Trophy className="h-3 w-3" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-400/20 text-gray-500 dark:text-gray-400">
        <span className="text-xs font-bold">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600/20 text-amber-600 dark:text-amber-500">
        <span className="text-xs font-bold">3</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-6 h-6">
      <span className="text-xs text-muted-foreground font-medium">{rank}</span>
    </div>
  );
}

function CommenterRow({
  commenter,
  rank,
}: {
  commenter: TopCommenter;
  rank: number;
}) {
  return (
    <div className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      {getRankBadge(rank)}
      <Avatar size="sm">
        {commenter.authorAvatarUrl ? (
          <AvatarImage
            src={commenter.authorAvatarUrl}
            alt={commenter.authorUsername}
          />
        ) : null}
        <AvatarFallback>
          <User className="h-3 w-3" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">
          {commenter.authorUsername}
        </span>
        {commenter.totalLikes > 0 && (
          <span className="text-xs text-muted-foreground">
            {formatNumber(commenter.totalLikes)} likes received
          </span>
        )}
      </div>
      <Badge variant="secondary" className="flex items-center gap-1">
        <MessageCircle className="h-3 w-3" />
        {formatNumber(commenter.commentCount)}
      </Badge>
    </div>
  );
}

function TopCommentersWidget({
  data = null,
  isLoading = false,
}: TopCommentersWidgetProps) {
  const hasData = data && data.commenters && data.commenters.length > 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Top Commenters
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <CommenterSkeleton key={i} />
            ))}
          </div>
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <div className="divide-y">
            {data.commenters.map((commenter, index) => (
              <CommenterRow
                key={commenter.authorUsername}
                commenter={commenter}
                rank={index + 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const topCommentersWidgetDefinition: WidgetDefinition = {
  id: "top-commenters",
  name: "Top Commenters",
  description: "Show most engaged commenters on your content",
  category: "comments",
  icon: Users,
  component: TopCommentersWidget,
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 6, h: 8 },
  dataRequirements: [
    {
      type: "comments",
      fields: ["authorUsername", "authorAvatarUrl", "commentCount", "totalLikes"],
    },
  ],
};

// Register the widget
widgetRegistry.register(topCommentersWidgetDefinition);

export { TopCommentersWidget };
export type { TopCommenter, TopCommentersData, TopCommentersWidgetProps };
