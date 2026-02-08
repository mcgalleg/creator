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

export {
  ViralPostsWidget,
  viralPostsWidgetDefinition,
  type ViralPost,
  type ViralPostsWidgetProps,
} from "./content/viral-posts";

export {
  UnderperformingWidget,
  underperformingWidgetDefinition,
  type UnderperformingPost,
  type UnderperformingWidgetProps,
} from "./content/underperforming";

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

export {
  ContentVelocityWidget,
  contentVelocityWidgetDefinition,
  type ContentVelocityWidgetProps,
} from "./kpi/content-velocity";

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

// Engagement
export {
  TotalCommentsWidget,
  totalCommentsWidgetDefinition,
} from "./engagement/total-comments";

export {
  SavesRateWidget,
  savesRateWidgetDefinition,
} from "./engagement/saves-rate";

export {
  ViralityScoreWidget,
  viralityScoreWidgetDefinition,
} from "./engagement/virality-score";

export {
  CommentsPerPostWidget,
  commentsPerPostWidgetDefinition,
} from "./engagement/comments-per-post";

export {
  EngagementByDayWidget,
  engagementByDayWidgetDefinition,
  type DayEngagement,
} from "./engagement/engagement-by-day";

export {
  FollowerEngagementRatioWidget,
  followerEngagementRatioWidgetDefinition,
} from "./engagement/follower-engagement-ratio";

// Charts - Additional (views-distribution)
export {
  ViewsDistributionWidget,
  viewsDistributionWidgetDefinition,
  type ViewsBucket,
} from "./charts/views-distribution";

// Comments
export {
  RecentCommentsWidget,
  recentCommentsWidgetDefinition,
  type Comment,
  type RecentCommentsData,
  type RecentCommentsWidgetProps,
} from "./comments/recent-comments";

export {
  TopCommentersWidget,
  topCommentersWidgetDefinition,
} from "./comments/top-commenters";

export {
  CommentSentimentWidget,
  commentSentimentWidgetDefinition,
} from "./comments/comment-sentiment";

export {
  CommentActivityWidget,
  commentActivityWidgetDefinition,
} from "./comments/comment-activity";

export {
  AudienceLoyaltyWidget,
  audienceLoyaltyWidgetDefinition,
} from "./comments/audience-loyalty";
