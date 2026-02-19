// ── Structured Content Types ──
// Each type maps to a specific view component via the _type discriminator.

export interface EngagementTrendsData { _type: "engagement_trends"; period: string; data: Array<{ date: string; plays: number; likes: number; comments: number; shares: number; saves: number }>; }
export interface FollowerGrowthData { _type: "follower_growth"; period: string; points: Array<{ date: string; followers: number; delta: number }>; }
export interface PostingFrequencyData { _type: "posting_frequency"; days: Array<{ day: string; shortDay: string; posts: number }>; }
export interface EngagementRateData { _type: "engagement_rate"; period: string; data: Array<{ date: string; engagementRate: number }>; }

export interface PostData { id: string; tiktokId: string; description: string | null; thumbnailUrl: string | null; plays: number; likes: number; comments: number; shares: number; saves: number; postedAt: string | null; engagementRate: number; }
export interface RecentPostsData { _type: "recent_posts"; posts: PostData[]; total: number; }
export interface TopContentData { _type: "top_content"; metric: string; posts: PostData[]; }
export interface ViralPostsData { _type: "viral_posts"; posts: (PostData & { shareRate: number })[]; }
export interface UnderperformingData { _type: "underperforming"; posts: (PostData & { avgEngagementRate: number; performanceGap: number })[]; }

export interface RecentCommentsData { _type: "recent_comments"; comments: Array<{ id: string; text: string | null; authorUsername: string | null; authorAvatarUrl: string | null; likes: number; postThumbnailUrl: string | null; createdAt: string | null }>; total: number; }
export interface TopCommentersData { _type: "top_commenters"; commenters: Array<{ username: string | null; avatarUrl: string | null; commentCount: number; lastCommentAt: string | null; followerCount: number; influenceScore: number }>; }
export interface CommentActivityData { _type: "comment_activity"; activity: Array<{ date: string; comments: number }>; total: number; period: string; }
export interface AudienceLoyaltyData { _type: "audience_loyalty"; loyaltyRate: number; repeat: number; oneTime: number; total: number; }

export interface PeriodComparisonData { _type: "period_comparison"; period1: Record<string, unknown>; period2: Record<string, unknown>; changes: Record<string, number>; }
export interface AccountComparisonData { _type: "account_comparison"; accounts: Array<{ username: string; metrics: { followers: number; likes: number; engagement: number; plays: number; shares: number } }>; }

export interface AudienceGeographyData { _type: "audience_geography"; regions: Array<{ code: string; name: string; commentCount: number; percentage: number }>; totalCommenters: number; }
export interface AudienceLanguagesData { _type: "audience_languages"; languages: Array<{ code: string; name: string; commentCount: number; percentage: number }>; totalComments: number; }
export interface CreatorEngagementData { _type: "creator_engagement"; likedRate: number; totalLiked: number; totalComments: number; trend: Array<{ date: string; likedRate: number }>; }

export type StructuredContent =
  | EngagementTrendsData
  | FollowerGrowthData
  | PostingFrequencyData
  | EngagementRateData
  | RecentPostsData
  | TopContentData
  | ViralPostsData
  | UnderperformingData
  | RecentCommentsData
  | TopCommentersData
  | CommentActivityData
  | AudienceLoyaltyData
  | PeriodComparisonData
  | AccountComparisonData
  | AudienceGeographyData
  | AudienceLanguagesData
  | CreatorEngagementData;
