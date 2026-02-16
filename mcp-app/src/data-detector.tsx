import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import type { StructuredContent } from "./types";

// KPI & Overview
import { AccountOverview } from "./views/account-overview";
import { AccountsList } from "./views/accounts-list";
// Charts & Trends
import { EngagementTrends } from "./views/engagement-trends";
import { EngagementBreakdown } from "./views/engagement-breakdown";
import { FollowerGrowth } from "./views/follower-growth";
import { PostingFrequency } from "./views/posting-frequency";
import { BestPostingTimes } from "./views/best-posting-times";
import { DurationPerformance } from "./views/duration-performance";
import { ViewsDistribution } from "./views/views-distribution";
import { EngagementByDay } from "./views/engagement-by-day";
import { EngagementRate } from "./views/engagement-rate";
// Content
import { RecentPosts } from "./views/recent-posts";
import { TopContent } from "./views/top-content";
import { ViralPosts } from "./views/viral-posts";
import { Underperforming } from "./views/underperforming";
// Engagement Metrics
import { SavesRate } from "./views/saves-rate";
import { ViralityScore } from "./views/virality-score";
import { FollowerEngagement } from "./views/follower-engagement";
// Comments & Community
import { RecentComments } from "./views/recent-comments";
import { TopCommenters } from "./views/top-commenters";
import { CommentActivity } from "./views/comment-activity";
import { AudienceLoyalty } from "./views/audience-loyalty";
// Comparisons
import { PeriodComparison } from "./views/period-comparison";
import { AccountComparison } from "./views/account-comparison";
// Hashtags
import { TopHashtags } from "./views/top-hashtags";
import { HashtagPerformance } from "./views/hashtag-performance";
import { HashtagTrends } from "./views/hashtag-trends";
// Sound
import { SoundAnalytics } from "./views/sound-analytics";
// Audience
import { AudienceGeography } from "./views/audience-geography";
import { AudienceLanguages } from "./views/audience-languages";
import { CreatorEngagement } from "./views/creator-engagement";

interface DataViewProps {
  data: StructuredContent;
  app: App;
  hostContext?: McpUiHostContext;
}

export function DataView({ data, app }: DataViewProps) {
  switch (data._type) {
    // KPI & Overview
    case "accounts":              return <AccountsList data={data} />;
    case "account_overview":      return <AccountOverview data={data} app={app} />;
    // Charts & Trends
    case "engagement_trends":     return <EngagementTrends data={data} app={app} />;
    case "engagement_breakdown":  return <EngagementBreakdown data={data} />;
    case "follower_growth":       return <FollowerGrowth data={data} app={app} />;
    case "posting_frequency":     return <PostingFrequency data={data} />;
    case "best_posting_times":    return <BestPostingTimes data={data} />;
    case "duration_performance":  return <DurationPerformance data={data} />;
    case "views_distribution":    return <ViewsDistribution data={data} />;
    case "engagement_by_day":     return <EngagementByDay data={data} />;
    case "engagement_rate":       return <EngagementRate data={data} app={app} />;
    // Content
    case "recent_posts":          return <RecentPosts data={data} app={app} />;
    case "top_content":           return <TopContent data={data} app={app} />;
    case "viral_posts":           return <ViralPosts data={data} />;
    case "underperforming":       return <Underperforming data={data} />;
    // Engagement Metrics
    case "saves_rate":            return <SavesRate data={data} />;
    case "virality_score":        return <ViralityScore data={data} />;
    case "follower_engagement":   return <FollowerEngagement data={data} />;
    // Comments & Community
    case "recent_comments":       return <RecentComments data={data} app={app} />;
    case "top_commenters":        return <TopCommenters data={data} />;
    case "comment_activity":      return <CommentActivity data={data} app={app} />;
    case "audience_loyalty":      return <AudienceLoyalty data={data} />;
    // Comparisons
    case "period_comparison":     return <PeriodComparison data={data} />;
    case "account_comparison":    return <AccountComparison data={data} />;
    // Hashtags
    case "top_hashtags":          return <TopHashtags data={data} />;
    case "hashtag_performance":   return <HashtagPerformance data={data} app={app} />;
    case "hashtag_trends":        return <HashtagTrends data={data} app={app} />;
    // Sound
    case "sound_analytics":       return <SoundAnalytics data={data} app={app} />;
    // Audience
    case "audience_geography":    return <AudienceGeography data={data} />;
    case "audience_languages":    return <AudienceLanguages data={data} />;
    case "creator_engagement":    return <CreatorEngagement data={data} />;
    // Fallback
    default:
      return (
        <div style={{ padding: 24, fontFamily: "var(--font-mono)", fontSize: "0.75rem", whiteSpace: "pre-wrap", color: "var(--color-text-secondary)" }}>
          {JSON.stringify(data, null, 2)}
        </div>
      );
  }
}
