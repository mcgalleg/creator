// Re-export registry types and instance
export {
  widgetRegistry,
  type WidgetCategory,
  type DataRequirement,
  type WidgetProps,
  type WidgetDefinition,
} from "./registry";

// Import widgets to trigger registration
// Charts
export {
  EngagementTrendWidget,
  engagementTrendWidgetDefinition,
} from "./charts/engagement-trend";

export {
  EngagementBreakdownWidget,
  engagementBreakdownWidgetDefinition,
} from "./charts/engagement-breakdown";

// Content
export {
  TopContentWidget,
  topContentWidgetDefinition,
  type TopContentVideo,
  type TopContentWidgetProps,
} from "./content/top-content";

export {
  RecentPostsWidget,
  recentPostsWidgetDefinition,
  type RecentPost,
  type RecentPostsData,
  type RecentPostsWidgetProps,
} from "./content/recent-posts";

// KPI - Overview (combined card)
export {
  OverviewMetricsWidget,
  overviewMetricsWidgetDefinition,
  type OverviewMetricsData,
  type OverviewMetricsWidgetProps,
} from "./kpi/overview-metrics";

// KPI - Individual cards
export {
  FollowersWidget,
  followersWidgetDefinition,
} from "./kpi/followers";

export {
  TotalPlaysWidget,
  totalPlaysWidgetDefinition,
} from "./kpi/total-plays";

export {
  EngagementRateWidget,
  engagementRateWidgetDefinition,
} from "./kpi/engagement-rate";

export {
  TotalLikesWidget,
  totalLikesWidgetDefinition,
} from "./kpi/total-likes";

export {
  TotalSharesWidget,
  totalSharesWidgetDefinition,
} from "./kpi/total-shares";

export {
  TotalSavesWidget,
  totalSavesWidgetDefinition,
} from "./kpi/total-saves";

export {
  AvgViewsWidget,
  avgViewsWidgetDefinition,
} from "./kpi/avg-views";

// Charts - Additional
export {
  PostingFrequencyWidget,
  postingFrequencyWidgetDefinition,
  type DayFrequency,
} from "./charts/posting-frequency";

export {
  BestPostingTimesWidget,
  bestPostingTimesWidgetDefinition,
  type HeatmapCell,
} from "./charts/best-posting-times";

export {
  GrowthChartWidget,
  growthChartWidgetDefinition,
  type GrowthDataPoint,
} from "./charts/growth-chart";

export {
  DurationPerformanceWidget,
  durationPerformanceWidgetDefinition,
  type DurationPerformancePoint,
} from "./charts/duration-performance";

// Comments
export {
  RecentCommentsWidget,
  recentCommentsWidgetDefinition,
  type Comment,
  type RecentCommentsData,
  type RecentCommentsWidgetProps,
} from "./comments/recent-comments";
