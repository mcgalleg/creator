"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

interface CommentsPerPostWidgetProps extends WidgetProps {
  data?: {
    commentsPerPost: number;
    totalComments: number;
    postCount: number;
  } | null;
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

function CommentsPerPostWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

function CommentsPerPostWidgetEmpty() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Comments per Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentsPerPostWidget({
  data = null,
  isLoading = false,
}: CommentsPerPostWidgetProps) {
  if (isLoading) {
    return <CommentsPerPostWidgetSkeleton />;
  }

  if (!data) {
    return <CommentsPerPostWidgetEmpty />;
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments per Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold">
            {data.commentsPerPost.toFixed(1)}
          </span>
          <p className="text-xs text-muted-foreground">
            {formatNumber(data.totalComments)} comments across {data.postCount} posts
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const commentsPerPostWidgetDefinition: WidgetDefinition = {
  id: "comments-per-post",
  name: "Comments per Post",
  description: "Average number of comments per post",
  category: "engagement",
  icon: MessageSquare,
  component: CommentsPerPostWidget,
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 3 },
  dataRequirements: [
    {
      type: "metrics",
      fields: ["comments"],
    },
  ],
};

// Register the widget
widgetRegistry.register(commentsPerPostWidgetDefinition);

export { CommentsPerPostWidget };
