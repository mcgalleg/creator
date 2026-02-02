"use client";

import { Video } from "lucide-react";
import { DashboardTopContent } from "@/components/dashboard/dashboard-top-content";
import {
  widgetRegistry,
  type WidgetProps,
  type WidgetDefinition,
} from "../registry";

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

interface TopContentWidgetProps extends WidgetProps {
  data?: TopContentVideo[] | null;
  isLoading?: boolean;
}

function TopContentWidget({
  data = null,
  isLoading = false,
}: TopContentWidgetProps) {
  return <DashboardTopContent data={data} isLoading={isLoading} />;
}

export const topContentWidgetDefinition: WidgetDefinition = {
  id: "top-content",
  name: "Top Performing Content",
  description: "Grid of top performing videos with thumbnails and engagement stats",
  category: "content",
  icon: Video,
  component: TopContentWidget,
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
      ],
    },
  ],
};

// Register the widget
widgetRegistry.register(topContentWidgetDefinition);

export { TopContentWidget };
export type { TopContentVideo, TopContentWidgetProps };
