import {
  streamText,
  tool,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
  type ModelMessage,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { auth, hasFeature } from "@/lib/auth";
import { checkCredits } from "@/lib/services/credit-service";
import { ingestAiTokenEvent } from "@/lib/polar";
import { z } from "zod";
import { db } from "@/lib/db";
import { creditTransactions } from "@/lib/db/schema/credits";
import { tiktokAccounts, posts, comments, accountMetricsHistory } from "@/lib/db/schema";
import { eq, desc, and, gte, sql, inArray, isNotNull } from "drizzle-orm";
import { calculateEngagementRate } from "@/lib/dashboard-utils";
import { getAnalyticsCatalogPrompt } from "@/lib/catalog";
import { getVideoCatalogPrompt } from "@/lib/video-catalog";
import { createDiagramTool, EXCALIDRAW_FORMAT_REFERENCE } from "@/lib/ai-tools/excalidraw-tools";
import { addCacheControlToMessages, ANTHROPIC_CACHE_CONTROL } from "@/lib/ai-tools/prompt-cache";

// =============================================================================
// Message sanitization — fix malformed tool_use inputs in conversation history
// =============================================================================

/**
 * The Anthropic API requires tool_use.input to be a JSON dictionary.
 * If the model previously generated a non-dict input (e.g. an array or null),
 * the AI SDK stores it in conversation history. When the conversation is
 * replayed, the API rejects the entire request with a 400.
 *
 * This function walks the model messages and fixes any non-dict tool-call
 * inputs so the conversation can proceed.
 */
function sanitizeModelMessages(msgs: ModelMessage[]): ModelMessage[] {
  return msgs.map((msg) => {
    // Only assistant messages contain tool-call parts
    if (msg.role !== "assistant" || !Array.isArray(msg.content)) return msg;

    let needsFix = false;
    const fixedContent = msg.content.map((part) => {
      if (part.type !== "tool-call") return part;

      const input = part.input;
      if (typeof input === "object" && input !== null && !Array.isArray(input)) {
        return part; // Already a valid dict
      }

      needsFix = true;
      console.warn(
        `[chat] Sanitizing malformed tool-call input for "${part.toolName}":`,
        typeof input
      );

      // Best-effort recovery: unwrap array, or wrap in a dict
      if (Array.isArray(input) && input.length > 0 && typeof input[0] === "object") {
        return { ...part, input: input[0] };
      }
      return { ...part, input: { _raw: input ?? {} } };
    });

    return needsFix
      ? ({ ...msg, content: fixedContent } as typeof msg)
      : msg;
  });
}

// Create model for AI chat
const model = anthropic(process.env.ANTHROPIC_MODEL || "claude-haiku-4-5");

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

## Analytics Query Selection Guide

You are a TikTok analytics assistant. **Always prefer aggregation queries** for analytical questions — they return pre-computed answers that are accurate and token-efficient. Only use raw data queries when the user wants to see specific items.

### Aggregation queries (for analytical questions):
- **post_stats** → "How many videos?", "What are my averages?", total counts and averages
- **top_commenters** → "Who are my super fans?", "Most engaged followers?", ranked commenter list
- **engagement_breakdown** → "What engagement do I get most?", pie-chart-ready breakdown of likes/comments/shares/saves
- **posting_times** → "When should I post?", "Best time to post?", performance by day-of-week and hour
- **comment_activity** → "Comment trends?", "Getting more comments?", daily comment counts over time
- **growth** → "Am I growing?", "Follower trends?", metrics history with percentage changes
- **duration_performance** → "Best video length?", "Optimal duration?", performance by duration bucket

### Raw data queries (for displaying specific items):
- **overview** → Account profile and aggregate metrics
- **posts** → List of videos with engagement data (returns totalCount + limited subset)
- **engagement** → Engagement trend data points over time
- **top_content** → Best performing videos ranked by engagement score (returns totalCount + limited subset)
- **comments** → Individual comment text and details

### Important rules:
1. When a query returns \`totalCount\` and \`returnedCount\`, ALWAYS tell the user "Showing X of Y total" when X < Y.
2. For counting questions ("how many...?"), use aggregation queries (post_stats, top_commenters) — never count raw rows.
3. Use timeRange '30d' for trends and recent performance. Use 'all' for cumulative totals and lifetime stats.
4. After fetching data, use generateUI to visualize it with appropriate chart components.
5. Be conversational — explain what the data shows and provide insights.
6. Format numbers in compact form (1.2M not 1,234,567). Include % symbol for percentages.
7. Do NOT use emojis in your text responses. Use plain text only — no emoji characters anywhere in your messages.

### Rendering data visually:
After fetching data, inspect the response shape and choose the best component(s) from the video catalog to visualize it. You may combine multiple clips — for example, a MetricCard for the headline number followed by a chart for the trend, or an Avatar with a LowerThird overlay for fan spotlights. Match data property names exactly to component prop keys (xKey, yKeys, nameKey, valueKey, column keys, etc.) — do NOT rename or transform fields. When using DataTable, copy every row from the fetched result into the \`data\` prop array.
`;

export async function POST(req: Request) {
  try {
    const { messages, selectedAccountId }: { messages: UIMessage[]; selectedAccountId?: number } = await req.json();

    // Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check feature access via DB tier lookup
    const canChat = await hasFeature("analytics_assistant");
    if (!canChat) {
      return Response.json(
        { error: "Feature not available on your plan" },
        { status: 403 }
      );
    }

    // Check if user has at least 1 credit before proceeding
    const creditCheck = await checkCredits(userId, 1);
    if (!creditCheck.sufficient) {
      return Response.json(
        { error: "Insufficient credits", balance: creditCheck.balance, required: 1 },
        { status: 402 }
      );
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

    const activeAccount = selectedAccountId
      ? userAccounts.find((a) => a.id === selectedAccountId)
      : null;

    let accountContext: string;
    if (userAccounts.length === 0) {
      accountContext = "\n\nThe user has no connected TikTok accounts yet. Suggest they connect an account to see their analytics.";
    } else if (activeAccount) {
      accountContext = `\n\nThe user is viewing their TikTok account @${activeAccount.username} (${activeAccount.displayName || activeAccount.username}). All analytics queries are automatically scoped to this account. Do not reference or discuss other accounts.`;
    } else {
      accountContext = `\n\nThe user has ${userAccounts.length} connected TikTok account(s). No specific account is selected.`;
    }

    const modelMessages = sanitizeModelMessages(
      await convertToModelMessages(messages)
    );

    // Build messages with system prompt caching:
    // - Static system content (catalog, instructions, excalidraw ref) → cached
    // - Dynamic account context → uncached (changes per user/session)
    // - Conversation messages → incrementally cached via prepareStep
    const staticSystemPrompt =
      getAnalyticsCatalogPrompt() + additionalInstructions + EXCALIDRAW_FORMAT_REFERENCE + "\n\n" + getVideoCatalogPrompt();

    const allMessages: ModelMessage[] = [
      {
        role: "system",
        content: staticSystemPrompt,
        providerOptions: ANTHROPIC_CACHE_CONTROL,
      },
      {
        role: "system",
        content: accountContext,
      },
      ...modelMessages,
    ];

    const result = streamText({
      model,
      messages: allMessages,
      stopWhen: stepCountIs(5),
      // Cache the conversation prefix before each agentic step so subsequent
      // tool-use round-trips get cache hits on the growing conversation.
      prepareStep: ({ messages, model }) => ({
        messages: addCacheControlToMessages({ messages, model }),
      }),
      experimental_repairToolCall: async ({ toolCall, error }) => {
        // If the model generates a non-dict tool input, try to repair it
        console.warn(
          `[chat] Repairing tool call "${toolCall.toolName}":`,
          error.message
        );
        try {
          const parsed =
            typeof toolCall.input === "string"
              ? JSON.parse(toolCall.input)
              : toolCall.input;
          // Unwrap array wrapper — model sometimes wraps the object in [...]
          const fixed = Array.isArray(parsed) ? parsed[0] : parsed;
          if (typeof fixed === "object" && fixed !== null) {
            return { ...toolCall, input: JSON.stringify(fixed) };
          }
        } catch {
          // JSON parse failed — can't repair
        }
        return null;
      },
      onFinish: async ({ totalUsage }) => {
        const totalTokens = totalUsage.totalTokens ?? 0;
        if (totalTokens > 0) {
          // Ingest token event to Polar for metering (fire-and-forget)
          ingestAiTokenEvent(userId, totalTokens, {
            inputTokens: totalUsage.inputTokens ?? 0,
            outputTokens: totalUsage.outputTokens ?? 0,
          }).catch((err) => console.error("Polar AI token ingestion failed:", err));

          // Record in local audit log for UI display
          await db.insert(creditTransactions).values({
            userId,
            amount: -totalTokens,
            type: "ai_chat",
            description: `Chat: ${totalUsage.inputTokens ?? 0} in + ${totalUsage.outputTokens ?? 0} out = ${totalTokens} tokens`,
          });
        }
      },
      tools: {
        fetchAnalyticsData: tool({
          description:
            "Fetch analytics data from the database. Supports aggregation queries (post_stats, top_commenters, engagement_breakdown, posting_times, comment_activity, growth, duration_performance) for analytical questions, and raw data queries (overview, posts, engagement, top_content, comments) for displaying specific items.",
          inputSchema: z.object({
            query: z
              .enum([
                "overview",
                "posts",
                "engagement",
                "top_content",
                "comments",
                "post_stats",
                "top_commenters",
                "engagement_breakdown",
                "posting_times",
                "comment_activity",
                "growth",
                "duration_performance",
              ])
              .describe(
                "Aggregation queries: post_stats (counts/averages), top_commenters (ranked fans), engagement_breakdown (likes/comments/shares/saves split), posting_times (best day/hour), comment_activity (daily comment trend), growth (follower/engagement trends), duration_performance (best video length). Raw data queries: overview, posts, engagement, top_content, comments."
              ),
            // accountIds removed — account scoping is enforced server-side
            // based on the selected account in the UI
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
          execute: async ({ query, timeRange, metric, limit }) => {
            // Scope to the selected account when one is active.
            // The AI's accountIds parameter is ignored — scoping is enforced
            // server-side to prevent cross-account data leakage.
            let targetAccountIds: number[] = [];

            if (selectedAccountId) {
              // Verify the selected account belongs to this user
              const valid = userAccounts.find((a) => a.id === selectedAccountId);
              if (valid) {
                targetAccountIds = [selectedAccountId];
              }
            }

            // Fallback: no selected account — use all user accounts
            if (targetAccountIds.length === 0) {
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
            const resultLimit = limit || 50;

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
                  accounts: accounts.map(a => ({ ...a, avatarUrl: `/api/avatar?accountId=${a.id}` })),
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

                // Get total count first
                const [{ total: postsTotalCount }] = await db
                  .select({ total: sql<number>`count(*)` })
                  .from(posts)
                  .where(and(...conditions));

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
                  posts: postData.map(p => ({ ...p, thumbnailUrl: `/api/thumbnail?postId=${p.id}` })),
                  totalCount: Number(postsTotalCount),
                  returnedCount: postData.length,
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
                  summary: {
                    totalDays: dailyEngagement.length,
                    totalPosts: dailyEngagement.reduce((sum, d) => sum + Number(d.postCount), 0),
                    totalMetricDataPoints: metricsData.length,
                  },
                };
              }

              case "top_content": {
                // Get top performing content
                const topContentConditions = [inArray(posts.accountId, targetAccountIds)];
                if (timeRangeDate) {
                  topContentConditions.push(gte(posts.postedAt, timeRangeDate));
                }

                // Get total count first
                const [{ total: topContentTotalCount }] = await db
                  .select({ total: sql<number>`count(*)` })
                  .from(posts)
                  .where(and(...topContentConditions));

                // Default sort by engagement score (likes + comments*2 + shares*3)
                const topContentLimit = limit || 10;
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
                  .where(and(...topContentConditions))
                  .orderBy(
                    desc(
                      sql`(${posts.likes} + ${posts.comments} * 2 + ${posts.shares} * 3)`
                    )
                  )
                  .limit(topContentLimit);

                return {
                  type: "top_content",
                  posts: topPosts.map(p => ({ ...p, thumbnailUrl: `/api/thumbnail?postId=${p.id}` })),
                  totalCount: Number(topContentTotalCount),
                  returnedCount: topPosts.length,
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
                    totalCount: 0,
                  };
                }

                const postIdList = postIds.map((p) => p.id);

                // Get total count of all comments
                const [{ total }] = await db
                  .select({ total: sql<number>`count(*)` })
                  .from(comments)
                  .where(inArray(comments.postId, postIdList));

                // Use a higher default limit for comments to give the assistant more context
                const commentLimit = limit || 200;

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
                  .where(inArray(comments.postId, postIdList))
                  .orderBy(desc(comments.likes))
                  .limit(commentLimit);

                return {
                  type: "comments",
                  comments: commentsData,
                  totalCount: Number(total),
                };
              }

              case "post_stats": {
                // Aggregated post statistics
                const psConditions = [inArray(posts.accountId, targetAccountIds)];
                if (timeRangeDate) {
                  psConditions.push(gte(posts.postedAt, timeRangeDate));
                }

                const [postStatsResult] = await db
                  .select({
                    totalPosts: sql<number>`count(*)`,
                    totalLikes: sql<number>`coalesce(sum(${posts.likes}), 0)`,
                    totalComments: sql<number>`coalesce(sum(${posts.comments}), 0)`,
                    totalShares: sql<number>`coalesce(sum(${posts.shares}), 0)`,
                    totalPlays: sql<number>`coalesce(sum(${posts.plays}), 0)`,
                    totalSaves: sql<number>`coalesce(sum(${posts.saves}), 0)`,
                    avgLikes: sql<number>`coalesce(avg(${posts.likes}), 0)`,
                    avgComments: sql<number>`coalesce(avg(${posts.comments}), 0)`,
                    avgShares: sql<number>`coalesce(avg(${posts.shares}), 0)`,
                    avgPlays: sql<number>`coalesce(avg(${posts.plays}), 0)`,
                    avgSaves: sql<number>`coalesce(avg(${posts.saves}), 0)`,
                    maxLikes: sql<number>`coalesce(max(${posts.likes}), 0)`,
                    maxPlays: sql<number>`coalesce(max(${posts.plays}), 0)`,
                    earliestPost: sql<string>`min(${posts.postedAt})`,
                    latestPost: sql<string>`max(${posts.postedAt})`,
                  })
                  .from(posts)
                  .where(and(...psConditions));

                return {
                  type: "post_stats",
                  stats: {
                    totalPosts: Number(postStatsResult.totalPosts),
                    totalLikes: Number(postStatsResult.totalLikes),
                    totalComments: Number(postStatsResult.totalComments),
                    totalShares: Number(postStatsResult.totalShares),
                    totalPlays: Number(postStatsResult.totalPlays),
                    totalSaves: Number(postStatsResult.totalSaves),
                    avgLikes: Math.round(Number(postStatsResult.avgLikes)),
                    avgComments: Math.round(Number(postStatsResult.avgComments)),
                    avgShares: Math.round(Number(postStatsResult.avgShares)),
                    avgPlays: Math.round(Number(postStatsResult.avgPlays)),
                    avgSaves: Math.round(Number(postStatsResult.avgSaves)),
                    maxLikes: Number(postStatsResult.maxLikes),
                    maxPlays: Number(postStatsResult.maxPlays),
                    earliestPost: postStatsResult.earliestPost,
                    latestPost: postStatsResult.latestPost,
                  },
                  timeRange: timeRange || "all",
                };
              }

              case "top_commenters": {
                // Top commenters ranked by comment count and likes
                const tcPostConditions = [inArray(posts.accountId, targetAccountIds)];
                if (timeRangeDate) {
                  tcPostConditions.push(gte(posts.postedAt, timeRangeDate));
                }

                // Get post IDs for filtering
                const tcPostIds = await db
                  .select({ id: posts.id })
                  .from(posts)
                  .where(and(...tcPostConditions));

                if (tcPostIds.length === 0) {
                  return {
                    type: "top_commenters",
                    commenters: [],
                    totalUniqueCommenters: 0,
                  };
                }

                const tcPostIdList = tcPostIds.map((p) => p.id);

                // Get total unique commenters
                const [{ totalUnique }] = await db
                  .select({
                    totalUnique: sql<number>`count(distinct ${comments.authorUsername})`,
                  })
                  .from(comments)
                  .where(
                    and(
                      inArray(comments.postId, tcPostIdList),
                      sql`${comments.authorUsername} IS NOT NULL AND ${comments.authorUsername} != ''`
                    )
                  );

                // Get top commenters grouped by username
                const topCommentersData = await db
                  .select({
                    authorUsername: comments.authorUsername,
                    authorAvatarUrl: sql<string>`(array_agg(${comments.authorAvatarUrl} ORDER BY ${comments.createdAt} DESC))[1]`,
                    commentCount: sql<number>`COUNT(*)`,
                    totalLikes: sql<number>`COALESCE(SUM(${comments.likes}), 0)`,
                  })
                  .from(comments)
                  .where(
                    and(
                      inArray(comments.postId, tcPostIdList),
                      sql`${comments.authorUsername} IS NOT NULL AND ${comments.authorUsername} != ''`
                    )
                  )
                  .groupBy(comments.authorUsername)
                  .orderBy(
                    desc(sql`COUNT(*)`),
                    desc(sql`COALESCE(SUM(${comments.likes}), 0)`)
                  )
                  .limit(limit || 50);

                return {
                  type: "top_commenters",
                  commenters: topCommentersData.map((c, i) => ({
                    rank: i + 1,
                    username: c.authorUsername,
                    avatarUrl: c.authorUsername ? `/api/avatar?username=${encodeURIComponent(c.authorUsername)}` : null,
                    comments: Number(c.commentCount),
                    likes: Number(c.totalLikes),
                  })),
                  totalUniqueCommenters: Number(totalUnique),
                  returnedCount: topCommentersData.length,
                };
              }

              case "engagement_breakdown": {
                // Engagement breakdown by type (likes/comments/shares/saves)
                const ebConditions = [inArray(posts.accountId, targetAccountIds)];
                if (timeRangeDate) {
                  ebConditions.push(gte(posts.postedAt, timeRangeDate));
                }

                const [engagementTotals] = await db
                  .select({
                    totalLikes: sql<number>`coalesce(sum(${posts.likes}), 0)`,
                    totalComments: sql<number>`coalesce(sum(${posts.comments}), 0)`,
                    totalShares: sql<number>`coalesce(sum(${posts.shares}), 0)`,
                    totalSaves: sql<number>`coalesce(sum(${posts.saves}), 0)`,
                  })
                  .from(posts)
                  .where(and(...ebConditions));

                const ebLikes = Number(engagementTotals.totalLikes);
                const ebComments = Number(engagementTotals.totalComments);
                const ebShares = Number(engagementTotals.totalShares);
                const ebSaves = Number(engagementTotals.totalSaves);
                const totalEngagement = ebLikes + ebComments + ebShares + ebSaves;

                const pct = (v: number) =>
                  totalEngagement === 0
                    ? 0
                    : Math.round((v / totalEngagement) * 10000) / 100;

                return {
                  type: "engagement_breakdown",
                  breakdown: [
                    { type: "likes", value: ebLikes, percentage: pct(ebLikes) },
                    { type: "comments", value: ebComments, percentage: pct(ebComments) },
                    { type: "shares", value: ebShares, percentage: pct(ebShares) },
                    { type: "saves", value: ebSaves, percentage: pct(ebSaves) },
                  ],
                  totalEngagement,
                  timeRange: timeRange || "all",
                };
              }

              case "posting_times": {
                // Posting times analysis by day of week and hour
                const ptConditions = [inArray(posts.accountId, targetAccountIds)];
                if (timeRangeDate) {
                  ptConditions.push(gte(posts.postedAt, timeRangeDate));
                }

                const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

                const postingData = await db
                  .select({
                    dayOfWeek: sql<number>`EXTRACT(DOW FROM ${posts.postedAt})`,
                    hour: sql<number>`EXTRACT(HOUR FROM ${posts.postedAt})`,
                    postCount: sql<number>`COUNT(*)`,
                    totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
                    totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
                    totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
                    totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
                    totalSaves: sql<number>`COALESCE(SUM(${posts.saves}), 0)`,
                  })
                  .from(posts)
                  .where(and(...ptConditions))
                  .groupBy(
                    sql`EXTRACT(DOW FROM ${posts.postedAt})`,
                    sql`EXTRACT(HOUR FROM ${posts.postedAt})`
                  )
                  .orderBy(
                    sql`EXTRACT(DOW FROM ${posts.postedAt}) ASC`,
                    sql`EXTRACT(HOUR FROM ${posts.postedAt}) ASC`
                  );

                // Transform with engagement rates
                const timeSlots = postingData.map((row) => {
                  const pc = Number(row.postCount);
                  const tp = Number(row.totalPlays);
                  const tl = Number(row.totalLikes);
                  const tc = Number(row.totalComments);
                  const tsh = Number(row.totalShares);
                  const tsv = Number(row.totalSaves);
                  return {
                    dayOfWeek: Number(row.dayOfWeek),
                    dayName: DAY_NAMES[Number(row.dayOfWeek)],
                    hour: Number(row.hour),
                    postCount: pc,
                    avgPlays: pc > 0 ? Math.round(tp / pc) : 0,
                    engagementRate: calculateEngagementRate(tl, tc, tsh, tsv, tp),
                  };
                });

                // Summarize by day of week
                const byDay = DAY_NAMES.map((name, i) => {
                  const daySlots = timeSlots.filter((s) => s.dayOfWeek === i);
                  const totalPosts = daySlots.reduce((s, d) => s + d.postCount, 0);
                  const avgEng = daySlots.length > 0
                    ? Number((daySlots.reduce((s, d) => s + d.engagementRate * d.postCount, 0) / Math.max(totalPosts, 1)).toFixed(2))
                    : 0;
                  return { dayOfWeek: i, dayName: name, postCount: totalPosts, avgEngagementRate: avgEng };
                });

                // Summarize by hour — only include hours with posts to keep response compact
                const byHour = Array.from({ length: 24 }, (_, h) => {
                  const hourSlots = timeSlots.filter((s) => s.hour === h);
                  const totalPosts = hourSlots.reduce((s, d) => s + d.postCount, 0);
                  const avgEng = hourSlots.length > 0
                    ? Number((hourSlots.reduce((s, d) => s + d.engagementRate * d.postCount, 0) / Math.max(totalPosts, 1)).toFixed(2))
                    : 0;
                  return { hour: h, postCount: totalPosts, avgEngagementRate: avgEng };
                }).filter((h) => h.postCount > 0);

                // Return only summaries — omit raw timeSlots to keep the response
                // compact enough for the AI to embed in generateUI chart props
                return {
                  type: "posting_times",
                  summary: { byDayOfWeek: byDay, byHour },
                  timeRange: timeRange || "all",
                };
              }

              case "comment_activity": {
                // Comment activity over time (daily counts)
                const caPostConditions = [inArray(posts.accountId, targetAccountIds)];
                if (timeRangeDate) {
                  caPostConditions.push(gte(posts.postedAt, timeRangeDate));
                }

                const caPostIds = await db
                  .select({ id: posts.id })
                  .from(posts)
                  .where(and(...caPostConditions));

                if (caPostIds.length === 0) {
                  return { type: "comment_activity", activity: [], total: 0, timeRange: timeRange || "30d" };
                }

                const caPostIdList = caPostIds.map((p) => p.id);

                // Determine the date range for filling
                const caStartDate = timeRangeDate || new Date(new Date().setDate(new Date().getDate() - 30));
                const caDays = timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : 30;

                const activityData = await db
                  .select({
                    date: sql<string>`DATE(COALESCE(${comments.postedAt}, ${comments.createdAt}))`,
                    commentCount: sql<number>`COUNT(*)`,
                  })
                  .from(comments)
                  .where(
                    and(
                      inArray(comments.postId, caPostIdList),
                      gte(sql`COALESCE(${comments.postedAt}, ${comments.createdAt})`, caStartDate)
                    )
                  )
                  .groupBy(sql`DATE(COALESCE(${comments.postedAt}, ${comments.createdAt}))`)
                  .orderBy(sql`DATE(COALESCE(${comments.postedAt}, ${comments.createdAt})) ASC`);

                // Fill missing dates with zeros
                const dataMap = new Map(activityData.map((d) => [d.date, Number(d.commentCount)]));
                const filledActivity: { date: string; comments: number }[] = [];
                for (let i = 0; i < caDays; i++) {
                  const date = new Date(caStartDate);
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split("T")[0];
                  filledActivity.push({ date: dateStr, comments: dataMap.get(dateStr) || 0 });
                }

                const caTotal = filledActivity.reduce((sum, d) => sum + d.comments, 0);

                return {
                  type: "comment_activity",
                  activity: filledActivity,
                  total: caTotal,
                  timeRange: timeRange || "30d",
                };
              }

              case "growth": {
                // Growth trends: metrics history + post engagement over time
                const grConditions = [inArray(accountMetricsHistory.accountId, targetAccountIds)];
                if (timeRangeDate) {
                  grConditions.push(gte(accountMetricsHistory.recordedAt, timeRangeDate));
                }

                const metricsHistory = await db
                  .select({
                    date: sql<string>`DATE(${accountMetricsHistory.recordedAt})`,
                    followerCount: sql<number>`MAX(${accountMetricsHistory.followerCount})`,
                    followingCount: sql<number>`MAX(${accountMetricsHistory.followingCount})`,
                    likesCount: sql<number>`MAX(${accountMetricsHistory.likesCount})`,
                    videoCount: sql<number>`MAX(${accountMetricsHistory.videoCount})`,
                  })
                  .from(accountMetricsHistory)
                  .where(and(...grConditions))
                  .groupBy(sql`DATE(${accountMetricsHistory.recordedAt})`)
                  .orderBy(sql`DATE(${accountMetricsHistory.recordedAt}) ASC`);

                // Post engagement grouped by date
                const grPostConditions = [inArray(posts.accountId, targetAccountIds)];
                if (timeRangeDate) {
                  grPostConditions.push(gte(posts.postedAt, timeRangeDate));
                }

                const engagementByDate = await db
                  .select({
                    date: sql<string>`DATE(${posts.postedAt})`,
                    totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
                    totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
                    totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
                    totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
                    totalSaves: sql<number>`COALESCE(SUM(${posts.saves}), 0)`,
                    postCount: sql<number>`COUNT(*)`,
                  })
                  .from(posts)
                  .where(and(...grPostConditions))
                  .groupBy(sql`DATE(${posts.postedAt})`)
                  .orderBy(sql`DATE(${posts.postedAt}) ASC`);

                const followerGrowth = metricsHistory.map((row) => ({
                  date: row.date,
                  followers: Number(row.followerCount ?? 0),
                  following: Number(row.followingCount ?? 0),
                  totalLikes: Number(row.likesCount ?? 0),
                  videoCount: Number(row.videoCount ?? 0),
                }));

                const engagementGrowth = engagementByDate.map((row) => {
                  const tl = Number(row.totalLikes);
                  const tc = Number(row.totalComments);
                  const tsh = Number(row.totalShares);
                  const tsv = Number(row.totalSaves);
                  const tp = Number(row.totalPlays);
                  return {
                    date: row.date,
                    plays: tp,
                    likes: tl,
                    comments: tc,
                    shares: tsh,
                    saves: tsv,
                    postCount: Number(row.postCount),
                    engagementRate: calculateEngagementRate(tl, tc, tsh, tsv, tp),
                  };
                });

                // Compute summary with % change
                const grSummary: Record<string, unknown> = {
                  dataPoints: followerGrowth.length,
                  period: timeRange || "all",
                };
                if (followerGrowth.length >= 2) {
                  const first = followerGrowth[0].followers;
                  const last = followerGrowth[followerGrowth.length - 1].followers;
                  grSummary.followerChange = last - first;
                  grSummary.followerChangePercent = first > 0 ? Number(((last - first) / first * 100).toFixed(2)) : 0;
                  grSummary.startFollowers = first;
                  grSummary.endFollowers = last;
                }

                return {
                  type: "growth",
                  followerGrowth,
                  engagementGrowth,
                  summary: grSummary,
                };
              }

              case "duration_performance": {
                // Duration performance using SQL buckets
                const dpConditions = [
                  inArray(posts.accountId, targetAccountIds),
                  isNotNull(posts.duration),
                ];
                if (timeRangeDate) {
                  dpConditions.push(gte(posts.postedAt, timeRangeDate));
                }

                const durationBuckets = await db
                  .select({
                    bucket: sql<string>`CASE
                      WHEN ${posts.duration} <= 15 THEN '0-15s'
                      WHEN ${posts.duration} <= 30 THEN '16-30s'
                      WHEN ${posts.duration} <= 60 THEN '31-60s'
                      WHEN ${posts.duration} <= 180 THEN '1-3min'
                      ELSE '3min+'
                    END`,
                    bucketOrder: sql<number>`CASE
                      WHEN ${posts.duration} <= 15 THEN 1
                      WHEN ${posts.duration} <= 30 THEN 2
                      WHEN ${posts.duration} <= 60 THEN 3
                      WHEN ${posts.duration} <= 180 THEN 4
                      ELSE 5
                    END`,
                    postCount: sql<number>`COUNT(*)`,
                    avgPlays: sql<number>`COALESCE(AVG(${posts.plays}), 0)`,
                    avgLikes: sql<number>`COALESCE(AVG(${posts.likes}), 0)`,
                    avgComments: sql<number>`COALESCE(AVG(${posts.comments}), 0)`,
                    avgShares: sql<number>`COALESCE(AVG(${posts.shares}), 0)`,
                    avgSaves: sql<number>`COALESCE(AVG(${posts.saves}), 0)`,
                    totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
                    totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
                    totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
                    totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
                    totalSaves: sql<number>`COALESCE(SUM(${posts.saves}), 0)`,
                  })
                  .from(posts)
                  .where(and(...dpConditions))
                  .groupBy(
                    sql`CASE
                      WHEN ${posts.duration} <= 15 THEN '0-15s'
                      WHEN ${posts.duration} <= 30 THEN '16-30s'
                      WHEN ${posts.duration} <= 60 THEN '31-60s'
                      WHEN ${posts.duration} <= 180 THEN '1-3min'
                      ELSE '3min+'
                    END`,
                    sql`CASE
                      WHEN ${posts.duration} <= 15 THEN 1
                      WHEN ${posts.duration} <= 30 THEN 2
                      WHEN ${posts.duration} <= 60 THEN 3
                      WHEN ${posts.duration} <= 180 THEN 4
                      ELSE 5
                    END`
                  )
                  .orderBy(sql`CASE
                    WHEN ${posts.duration} <= 15 THEN 1
                    WHEN ${posts.duration} <= 30 THEN 2
                    WHEN ${posts.duration} <= 60 THEN 3
                    WHEN ${posts.duration} <= 180 THEN 4
                    ELSE 5
                  END ASC`);

                const buckets = durationBuckets.map((b) => ({
                  bucket: b.bucket,
                  postCount: Number(b.postCount),
                  avgPlays: Math.round(Number(b.avgPlays)),
                  avgLikes: Math.round(Number(b.avgLikes)),
                  avgComments: Math.round(Number(b.avgComments)),
                  avgShares: Math.round(Number(b.avgShares)),
                  avgSaves: Math.round(Number(b.avgSaves)),
                  engagementRate: calculateEngagementRate(
                    Number(b.totalLikes),
                    Number(b.totalComments),
                    Number(b.totalShares),
                    Number(b.totalSaves),
                    Number(b.totalPlays)
                  ),
                }));

                return {
                  type: "duration_performance",
                  buckets,
                  timeRange: timeRange || "all",
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

        createDiagram: createDiagramTool,

        generateVideo: tool({
          description:
            "Generate an animated video report from analytics data. Creates a timeline spec that renders as an inline video player. Use this when the user asks for a video, animation, or video report of their analytics.",
          inputSchema: z.object({
            composition: z.object({
              id: z.string().default("video"),
              fps: z.number().default(30),
              width: z.number().default(1920),
              height: z.number().default(1080),
              durationInFrames: z.number(),
            }),
            tracks: z.array(z.object({
              id: z.string(),
              name: z.string(),
              type: z.enum(["video", "audio"]),
              enabled: z.boolean().default(true),
            })),
            clips: z.array(z.object({
              id: z.string(),
              trackId: z.string(),
              component: z.string(),
              props: z.record(z.string(), z.any()),
              from: z.number(),
              durationInFrames: z.number(),
              transitionIn: z.object({
                type: z.enum(["fade", "slideLeft", "slideRight", "slideUp", "slideDown", "zoom", "wipe", "none"]),
                durationInFrames: z.number(),
              }).optional(),
              transitionOut: z.object({
                type: z.enum(["fade", "slideLeft", "slideRight", "slideUp", "slideDown", "zoom", "wipe", "none"]),
                durationInFrames: z.number(),
              }).optional(),
              motion: z.object({
                enter: z.object({
                  opacity: z.number().optional(),
                  scale: z.number().optional(),
                  x: z.number().optional(),
                  y: z.number().optional(),
                  rotate: z.number().optional(),
                  duration: z.number().optional(),
                }).optional(),
                exit: z.object({
                  opacity: z.number().optional(),
                  scale: z.number().optional(),
                  x: z.number().optional(),
                  y: z.number().optional(),
                  rotate: z.number().optional(),
                  duration: z.number().optional(),
                }).optional(),
                spring: z.object({
                  damping: z.number().optional(),
                  stiffness: z.number().optional(),
                  mass: z.number().optional(),
                }).optional(),
                loop: z.object({
                  property: z.enum(["scale", "rotate", "x", "y", "opacity"]),
                  from: z.number(),
                  to: z.number(),
                  duration: z.number(),
                  easing: z.enum(["linear", "ease", "spring"]).optional(),
                }).optional(),
              }).optional(),
            })),
            audio: z.object({
              tracks: z.array(z.any()).default([]),
            }).default({ tracks: [] }),
          }),
          execute: async ({ composition, tracks, clips, audio }) => {
            return { composition, tracks, clips, audio };
          },
        }),

        generateUI: tool({
          description:
            "Generate a UI component tree to display analytics data. Use this after fetching data to create visualizations.",
          // Cache breakpoint on the last tool caches all tool definitions
          providerOptions: ANTHROPIC_CACHE_CONTROL,
          inputSchema: z.object({
            component: z
              .string()
              .describe(
                "The root component type from the catalog (e.g., MetricGroup, LineChart, DataTable, Card, Grid)"
              ),
            props: z
              .record(z.string(), z.any())
              .describe("The props for the component according to its schema"),
            children: z
              .array(z.record(z.string(), z.any()))
              .optional()
              .describe(
                "Optional array of nested component objects, each with {component, props, children?}"
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
