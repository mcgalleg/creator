import { streamText, tool, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { tiktokAccounts, posts, comments, accountMetricsHistory } from "@/lib/db/schema";
import { eq, desc, and, gte, sql, inArray } from "drizzle-orm";
import { getAnalyticsCatalogPrompt } from "@/lib/catalog";

// Helper function to get time range filter
function getTimeRangeDate(timeRange: string): Date | null {
  const now = new Date();
  switch (timeRange) {
    case "7d":
      return new Date(now.setDate(now.getDate() - 7));
    case "30d":
      return new Date(now.setDate(now.getDate() - 30));
    case "90d":
      return new Date(now.setDate(now.getDate() - 90));
    case "all":
    default:
      return null;
  }
}

// Additional instructions for the AI
const additionalInstructions = `

## Instructions for Analytics Queries

You are a TikTok analytics assistant. When users ask about their analytics:

1. **First, fetch the relevant data** using the fetchAnalyticsData tool. Choose the appropriate query type:
   - 'overview': Get account overview metrics (followers, likes, videos)
   - 'posts': Get post/video data with engagement metrics
   - 'engagement': Get engagement trends over time
   - 'top_content': Get top performing videos
   - 'comments': Get comments from videos

2. **Then, generate the UI** using the generateUI tool. Choose components based on the data:
   - For overview questions, use MetricGroup or MetricCard components
   - For trends over time, use LineChart or AreaChart
   - For comparisons, use BarChart
   - For composition analysis, use PieChart
   - For detailed listings, use DataTable
   - For showcasing videos, use TopVideosGrid or VideoCard
   - Use Card to group related content
   - Use Grid for dashboard layouts

3. **Be conversational** - Explain what the data shows and provide insights.

4. **Handle missing data gracefully** - If no data is available, explain and suggest what the user can do.

5. **Format numbers appropriately**:
   - Large numbers should use compact format (e.g., 1.2M instead of 1,234,567)
   - Percentages should include the % symbol
   - Trends should indicate direction (up/down/neutral)

Example flow:
- User: "Show me my top performing videos"
- You: Call fetchAnalyticsData with query='top_content'
- You: Call generateUI with TopVideosGrid or DataTable component
- You: Provide a brief analysis of the results
`;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get the user's connected TikTok accounts for context
    const userAccounts = await db
      .select({
        id: tiktokAccounts.id,
        username: tiktokAccounts.username,
        displayName: tiktokAccounts.displayName,
      })
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.userId, userId));

    const accountContext =
      userAccounts.length > 0
        ? `\n\nThe user has ${userAccounts.length} connected TikTok account(s): ${userAccounts.map((a) => `@${a.username} (${a.displayName || a.username})`).join(", ")}.`
        : "\n\nThe user has no connected TikTok accounts yet. Suggest they connect an account to see their analytics.";

    const result = streamText({
      model: anthropic(process.env.ANTHROPIC_MODEL || "claude-haiku-4-5"),
      system:
        getAnalyticsCatalogPrompt() + additionalInstructions + accountContext,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(5), // Allow multiple tool calls (fetch data → generate UI)
      tools: {
        fetchAnalyticsData: tool({
          description:
            "Fetch analytics data from the database. Use this to get TikTok account metrics, posts, engagement data, top content, or comments.",
          inputSchema: z.object({
            query: z
              .enum([
                "overview",
                "posts",
                "engagement",
                "top_content",
                "comments",
              ])
              .describe(
                "Type of data to fetch: overview (account metrics), posts (video list), engagement (trends over time), top_content (best performing videos), comments (video comments)"
              ),
            accountIds: z
              .array(z.string())
              .optional()
              .describe(
                "Optional list of account IDs to filter by. If omitted, aggregate all user accounts."
              ),
            timeRange: z
              .enum(["7d", "30d", "90d", "all"])
              .optional()
              .describe("Time range filter: 7d, 30d, 90d, or all"),
            metric: z
              .string()
              .optional()
              .describe("Metric to sort or filter by (e.g., likes, plays, comments)"),
            limit: z
              .number()
              .optional()
              .describe("Maximum number of results to return"),
          }),
          execute: async ({ query, accountIds, timeRange, metric, limit }) => {
            // Get user's accounts if not specified
            let targetAccountIds: number[] = [];

            if (accountIds && accountIds.length > 0) {
              targetAccountIds = accountIds.map((id) => parseInt(id, 10));
            } else {
              const accounts = await db
                .select({ id: tiktokAccounts.id })
                .from(tiktokAccounts)
                .where(eq(tiktokAccounts.userId, userId));
              targetAccountIds = accounts.map((a) => a.id);
            }

            if (targetAccountIds.length === 0) {
              return {
                error: "No TikTok accounts connected",
                message:
                  "Please connect a TikTok account first to see your analytics.",
              };
            }

            const timeRangeDate = timeRange
              ? getTimeRangeDate(timeRange)
              : null;
            const resultLimit = limit || 10;

            switch (query) {
              case "overview": {
                // Get account overview metrics
                const accounts = await db
                  .select({
                    id: tiktokAccounts.id,
                    username: tiktokAccounts.username,
                    displayName: tiktokAccounts.displayName,
                    avatarUrl: tiktokAccounts.avatarUrl,
                    followerCount: tiktokAccounts.followerCount,
                    followingCount: tiktokAccounts.followingCount,
                    likesCount: tiktokAccounts.likesCount,
                    videoCount: tiktokAccounts.videoCount,
                    lastSyncedAt: tiktokAccounts.lastSyncedAt,
                  })
                  .from(tiktokAccounts)
                  .where(inArray(tiktokAccounts.id, targetAccountIds));

                // Get aggregate post metrics
                const postStats = await db
                  .select({
                    totalPosts: sql<number>`count(*)`,
                    totalLikes: sql<number>`coalesce(sum(${posts.likes}), 0)`,
                    totalComments: sql<number>`coalesce(sum(${posts.comments}), 0)`,
                    totalShares: sql<number>`coalesce(sum(${posts.shares}), 0)`,
                    totalPlays: sql<number>`coalesce(sum(${posts.plays}), 0)`,
                    avgLikes: sql<number>`coalesce(avg(${posts.likes}), 0)`,
                    avgPlays: sql<number>`coalesce(avg(${posts.plays}), 0)`,
                  })
                  .from(posts)
                  .where(inArray(posts.accountId, targetAccountIds));

                return {
                  type: "overview",
                  accounts,
                  aggregateStats: postStats[0] || {
                    totalPosts: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalShares: 0,
                    totalPlays: 0,
                    avgLikes: 0,
                    avgPlays: 0,
                  },
                };
              }

              case "posts": {
                // Get posts with optional time filter
                const conditions = [inArray(posts.accountId, targetAccountIds)];
                if (timeRangeDate) {
                  conditions.push(gte(posts.postedAt, timeRangeDate));
                }

                // Determine sort order
                const sortColumn = metric === "plays" ? posts.plays :
                                   metric === "comments" ? posts.comments :
                                   metric === "shares" ? posts.shares :
                                   posts.likes;

                const postData = await db
                  .select({
                    id: posts.id,
                    tiktokId: posts.tiktokId,
                    description: posts.description,
                    likes: posts.likes,
                    comments: posts.comments,
                    shares: posts.shares,
                    plays: posts.plays,
                    saves: posts.saves,
                    duration: posts.duration,
                    thumbnailUrl: posts.thumbnailUrl,
                    videoUrl: posts.videoUrl,
                    postedAt: posts.postedAt,
                    accountUsername: tiktokAccounts.username,
                  })
                  .from(posts)
                  .leftJoin(tiktokAccounts, eq(posts.accountId, tiktokAccounts.id))
                  .where(and(...conditions))
                  .orderBy(desc(sortColumn))
                  .limit(resultLimit);

                return {
                  type: "posts",
                  posts: postData,
                  count: postData.length,
                };
              }

              case "engagement": {
                // Get engagement trends over time
                const conditions = [
                  inArray(accountMetricsHistory.accountId, targetAccountIds),
                ];
                if (timeRangeDate) {
                  conditions.push(
                    gte(accountMetricsHistory.recordedAt, timeRangeDate)
                  );
                }

                const metricsData = await db
                  .select({
                    recordedAt: accountMetricsHistory.recordedAt,
                    followerCount: accountMetricsHistory.followerCount,
                    followingCount: accountMetricsHistory.followingCount,
                    likesCount: accountMetricsHistory.likesCount,
                    videoCount: accountMetricsHistory.videoCount,
                  })
                  .from(accountMetricsHistory)
                  .where(and(...conditions))
                  .orderBy(accountMetricsHistory.recordedAt)
                  .limit(resultLimit * 10); // Get more data points for charts

                // Also get daily post engagement
                const postConditions = [
                  inArray(posts.accountId, targetAccountIds),
                ];
                if (timeRangeDate) {
                  postConditions.push(gte(posts.postedAt, timeRangeDate));
                }

                const dailyEngagement = await db
                  .select({
                    date: sql<string>`date(${posts.postedAt})`,
                    likes: sql<number>`coalesce(sum(${posts.likes}), 0)`,
                    comments: sql<number>`coalesce(sum(${posts.comments}), 0)`,
                    shares: sql<number>`coalesce(sum(${posts.shares}), 0)`,
                    plays: sql<number>`coalesce(sum(${posts.plays}), 0)`,
                    postCount: sql<number>`count(*)`,
                  })
                  .from(posts)
                  .where(and(...postConditions))
                  .groupBy(sql`date(${posts.postedAt})`)
                  .orderBy(sql`date(${posts.postedAt})`);

                return {
                  type: "engagement",
                  accountMetrics: metricsData,
                  dailyEngagement,
                };
              }

              case "top_content": {
                // Get top performing content
                const conditions = [inArray(posts.accountId, targetAccountIds)];
                if (timeRangeDate) {
                  conditions.push(gte(posts.postedAt, timeRangeDate));
                }

                // Default sort by engagement score (likes + comments*2 + shares*3)
                const topPosts = await db
                  .select({
                    id: posts.id,
                    tiktokId: posts.tiktokId,
                    description: posts.description,
                    likes: posts.likes,
                    comments: posts.comments,
                    shares: posts.shares,
                    plays: posts.plays,
                    saves: posts.saves,
                    duration: posts.duration,
                    thumbnailUrl: posts.thumbnailUrl,
                    videoUrl: posts.videoUrl,
                    postedAt: posts.postedAt,
                    accountUsername: tiktokAccounts.username,
                    engagementScore: sql<number>`(${posts.likes} + ${posts.comments} * 2 + ${posts.shares} * 3)`,
                  })
                  .from(posts)
                  .leftJoin(tiktokAccounts, eq(posts.accountId, tiktokAccounts.id))
                  .where(and(...conditions))
                  .orderBy(
                    desc(
                      sql`(${posts.likes} + ${posts.comments} * 2 + ${posts.shares} * 3)`
                    )
                  )
                  .limit(resultLimit);

                return {
                  type: "top_content",
                  posts: topPosts,
                  count: topPosts.length,
                };
              }

              case "comments": {
                // Get comments from posts
                const postConditions = [
                  inArray(posts.accountId, targetAccountIds),
                ];
                if (timeRangeDate) {
                  postConditions.push(gte(posts.postedAt, timeRangeDate));
                }

                // Get post IDs first
                const postIds = await db
                  .select({ id: posts.id })
                  .from(posts)
                  .where(and(...postConditions));

                if (postIds.length === 0) {
                  return {
                    type: "comments",
                    comments: [],
                    count: 0,
                  };
                }

                const commentsData = await db
                  .select({
                    id: comments.id,
                    text: comments.text,
                    authorUsername: comments.authorUsername,
                    authorAvatarUrl: comments.authorAvatarUrl,
                    likes: comments.likes,
                    postedAt: comments.postedAt,
                    postDescription: posts.description,
                  })
                  .from(comments)
                  .leftJoin(posts, eq(comments.postId, posts.id))
                  .where(
                    inArray(
                      comments.postId,
                      postIds.map((p) => p.id)
                    )
                  )
                  .orderBy(desc(comments.likes))
                  .limit(resultLimit);

                return {
                  type: "comments",
                  comments: commentsData,
                  count: commentsData.length,
                };
              }

              default:
                return {
                  error: "Unknown query type",
                  message: `Query type '${query}' is not supported.`,
                };
            }
          },
        }),

        generateUI: tool({
          description:
            "Generate a UI component tree to display analytics data. Use this after fetching data to create visualizations.",
          inputSchema: z.object({
            component: z
              .string()
              .describe(
                "The root component type from the catalog (e.g., MetricGroup, LineChart, DataTable, Card, Grid)"
              ),
            props: z
              .record(z.any())
              .describe("The props for the component according to its schema"),
            children: z
              .array(z.any())
              .optional()
              .describe(
                "Optional array of nested component definitions for container components"
              ),
          }),
          execute: async ({ component, props, children }) => {
            // Return the UI tree - validation happens on the client side via the catalog
            return {
              component,
              props,
              children,
            };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
