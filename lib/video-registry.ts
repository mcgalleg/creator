"use client";

import { standardComponents } from "@json-render/remotion";
import { BarChartClip } from "@/components/remotion/clips/charts/BarChartClip";
import { LineChartClip } from "@/components/remotion/clips/charts/LineChartClip";
import { AreaChartClip } from "@/components/remotion/clips/charts/AreaChartClip";
import { PieChartClip } from "@/components/remotion/clips/charts/PieChartClip";
import { EngagementTimelineClip } from "@/components/remotion/clips/charts/EngagementTimelineClip";
import { MetricCardClip } from "@/components/remotion/clips/MetricCardClip";
import { DataTableClip } from "@/components/remotion/clips/DataTableClip";
import { VideoCardClip } from "@/components/remotion/clips/VideoCardClip";
import { BadgeClip } from "@/components/remotion/clips/BadgeClip";
import { ProgressClip } from "@/components/remotion/clips/ProgressClip";
import { AlertClip } from "@/components/remotion/clips/AlertClip";
import { SeparatorClip } from "@/components/remotion/clips/SeparatorClip";
import { AvatarClip } from "@/components/remotion/clips/AvatarClip";
import { SkeletonClip } from "@/components/remotion/clips/SkeletonClip";

export const videoRegistry = {
  ...standardComponents,
  BarChart: BarChartClip,
  LineChart: LineChartClip,
  AreaChart: AreaChartClip,
  PieChart: PieChartClip,
  EngagementTimeline: EngagementTimelineClip,
  MetricCard: MetricCardClip,
  DataTable: DataTableClip,
  VideoCard: VideoCardClip,
  Badge: BadgeClip,
  Progress: ProgressClip,
  Alert: AlertClip,
  Separator: SeparatorClip,
  Avatar: AvatarClip,
  Skeleton: SkeletonClip,
};
