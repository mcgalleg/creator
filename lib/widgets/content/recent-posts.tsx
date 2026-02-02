"use client";

import { FileVideo } from "lucide-react";
import { DashboardRecentPosts } from "@/components/dashboard/dashboard-recent-posts";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

interface RecentPost {
  id: number;
  tiktokId: string;
  description: string | null;
  thumbnailUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  plays: number;
  saves: number;
  postedAt: string | null;
  engagementRate: number;
}

interface RecentPostsData {
  posts: RecentPost[];
  total: number;
}

interface RecentPostsWidgetProps extends WidgetProps {
  data?: RecentPostsData | null;
  isLoading?: boolean;
}

function RecentPostsWidget({
  data = null,
  isLoading = false,
}: RecentPostsWidgetProps) {
  return <DashboardRecentPosts data={data} isLoading={isLoading} />;
}

export const recentPostsWidgetDefinition: WidgetDefinition = {
  id: "recent-posts",
  name: "Recent Posts",
  description: "Table of recent posts with engagement metrics",
  category: "content",
  icon: FileVideo,
  component: RecentPostsWidget,
  defaultSize: { w: 12, h: 4 },
  minSize: { w: 8, h: 3 },
  maxSize: { w: 12, h: 8 },
  dataRequirements: [
    {
      type: "posts",
      fields: [
        "id",
        "tiktokId",
        "description",
        "thumbnailUrl",
        "likes",
        "comments",
        "shares",
        "plays",
        "saves",
        "postedAt",
        "engagementRate",
      ],
    },
  ],
};

// Register the widget
widgetRegistry.register(recentPostsWidgetDefinition);

export { RecentPostsWidget };
export type { RecentPost, RecentPostsData, RecentPostsWidgetProps };
