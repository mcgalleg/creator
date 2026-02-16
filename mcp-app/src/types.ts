// ── Structured Content Types ──
// Each type maps to a specific view component via the _type discriminator.

export interface AccountsData { _type: "accounts"; accounts: Array<{ id: string; username: string; displayName: string | null; followerCount: number; lastSyncedAt: string | null }>; }
export interface AccountOverviewData { _type: "account_overview"; followers: number; followerChange: number; totalPlays: number; playsChange: number; engagementRate: number; engagementRateChange: number; contentVelocity: number; totalLikes: number; totalShares: number; totalSaves: number; avgViews: number; totalComments: number; commentsPerPost: number; }
export interface EngagementTrendsData { _type: "engagement_trends"; period: string; data: Array<{ date: string; plays: number; likes: number; comments: number; shares: number; saves: number }>; }
export interface EngagementBreakdownData { _type: "engagement_breakdown"; breakdown: Array<{ type: "likes" | "comments" | "shares" | "saves"; value: number; percentage: number }>; }
export interface FollowerGrowthData { _type: "follower_growth"; period: string; points: Array<{ date: string; followers: number; delta: number }>; }
export interface PostingFrequencyData { _type: "posting_frequency"; days: Array<{ day: string; shortDay: string; posts: number }>; }
export interface BestPostingTimesData { _type: "best_posting_times"; heatmap: Array<{ day: number; hour: number; avgEngagement: number }>; }
export interface DurationPerformanceData { _type: "duration_performance"; points: Array<{ id: string; duration: number; plays: number; engagementRate: number; description?: string | null }>; }
export interface ViewsDistributionData { _type: "views_distribution"; buckets: Array<{ label: string; min: number; max: number; count: number }>; }
export interface EngagementByDayData { _type: "engagement_by_day"; days: Array<{ day: string; shortDay: string; engagementRate: number; posts: number }>; }

export interface PostData { id: string; tiktokId: string; description: string | null; thumbnailUrl: string | null; plays: number; likes: number; comments: number; shares: number; saves: number; postedAt: string | null; engagementRate: number; }
export interface RecentPostsData { _type: "recent_posts"; posts: PostData[]; total: number; }
export interface TopContentData { _type: "top_content"; metric: string; posts: PostData[]; }
export interface ViralPostsData { _type: "viral_posts"; posts: (PostData & { shareRate: number })[]; }
export interface UnderperformingData { _type: "underperforming"; posts: (PostData & { avgEngagementRate: number; performanceGap: number })[]; }

export interface SavesRateData { _type: "saves_rate"; savesRate: number; totalSaves: number; totalPlays: number; }
export interface ViralityScoreData { _type: "virality_score"; viralityScore: number; totalShares: number; totalPlays: number; }
export interface FollowerEngagementData { _type: "follower_engagement"; ratio: number; totalPlays: number; followers: number; }

export interface RecentCommentsData { _type: "recent_comments"; comments: Array<{ id: string; text: string | null; authorUsername: string | null; authorAvatarUrl: string | null; likes: number; postThumbnailUrl: string | null; createdAt: string | null }>; total: number; }
export interface TopCommentersData { _type: "top_commenters"; commenters: Array<{ username: string | null; avatarUrl: string | null; commentCount: number; lastCommentAt: string | null; followerCount: number; influenceScore: number }>; }
export interface CommentActivityData { _type: "comment_activity"; activity: Array<{ date: string; comments: number }>; total: number; period: string; }
export interface AudienceLoyaltyData { _type: "audience_loyalty"; loyaltyRate: number; repeat: number; oneTime: number; total: number; }

export interface PeriodComparisonData { _type: "period_comparison"; period1: Record<string, any>; period2: Record<string, any>; changes: Record<string, number>; }
export interface AccountComparisonData { _type: "account_comparison"; accounts: Array<{ username: string; metrics: { followers: number; likes: number; engagement: number; plays: number; shares: number } }>; }

export interface TopHashtagsData { _type: "top_hashtags"; hashtags: Array<{ tag: string; usageCount: number; avgLikes: number; avgPlays: number; avgEngagementRate: number }>; total: number; }
export interface HashtagPerformanceData { _type: "hashtag_performance"; hashtags: Array<{ tag: string; usageCount: number; totalPlays: number; totalLikes: number; totalComments: number; totalShares: number; avgEngagementRate: number }>; sortBy: string; }
export interface HashtagTrendsData { _type: "hashtag_trends"; period: string; hashtags: Array<{ tag: string; points: Array<{ date: string; count: number }> }>; }

export interface SoundAnalyticsData { _type: "sound_analytics"; sounds: Array<{ title: string; artist: string | null; usageCount: number; avgPlays: number; avgLikes: number; avgEngagementRate: number; duration: number | null }>; totalOriginal: number; totalTrending: number; }

export interface AudienceGeographyData { _type: "audience_geography"; regions: Array<{ code: string; name: string; commentCount: number; percentage: number }>; totalCommenters: number; }
export interface AudienceLanguagesData { _type: "audience_languages"; languages: Array<{ code: string; name: string; commentCount: number; percentage: number }>; totalComments: number; }
export interface CreatorEngagementData { _type: "creator_engagement"; likedRate: number; totalLiked: number; totalComments: number; trend: Array<{ date: string; likedRate: number }>; }

export type StructuredContent =
  | AccountsData
  | AccountOverviewData
  | EngagementTrendsData
  | EngagementBreakdownData
  | FollowerGrowthData
  | PostingFrequencyData
  | BestPostingTimesData
  | DurationPerformanceData
  | ViewsDistributionData
  | EngagementByDayData
  | RecentPostsData
  | TopContentData
  | ViralPostsData
  | UnderperformingData
  | SavesRateData
  | ViralityScoreData
  | FollowerEngagementData
  | RecentCommentsData
  | TopCommentersData
  | CommentActivityData
  | AudienceLoyaltyData
  | PeriodComparisonData
  | AccountComparisonData
  | TopHashtagsData
  | HashtagPerformanceData
  | HashtagTrendsData
  | SoundAnalyticsData
  | AudienceGeographyData
  | AudienceLanguagesData
  | CreatorEngagementData;
