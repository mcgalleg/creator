import { createMcpHandler } from "mcp-handler";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  tiktokAccounts,
  posts,
  comments,
} from "@/lib/db/schema";
import { eq, and, inArray, desc, asc, sql, gte, lte, count } from "drizzle-orm";

// Helper to get and validate user's accounts
async function getUserAccounts(userId: string, accountIds?: string[]) {
  const accounts = await db
    .select()
    .from(tiktokAccounts)
    .where(eq(tiktokAccounts.userId, userId));

  if (accountIds && accountIds.length > 0) {
    const requestedIds = accountIds.map((id) => parseInt(id, 10));
    const filtered = accounts.filter((a) => requestedIds.includes(a.id));
    // Verify user owns all requested accounts
    if (filtered.length !== requestedIds.length) {
      throw new Error("One or more accounts not found or not owned by user");
    }
    return filtered;
  }

  return accounts;
}

// Helper to get current user ID from Clerk
async function getCurrentUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }
  return userId;
}

const handler = createMcpHandler(
  (server) => {
    // Tool: get_accounts - List all connected TikTok accounts
    server.tool(
      "get_accounts",
      "List all connected TikTok accounts for the current user",
      {},
      async () => {
        const userId = await getCurrentUserId();

        const accounts = await db
          .select({
            id: tiktokAccounts.id,
            username: tiktokAccounts.username,
            displayName: tiktokAccounts.displayName,
            followerCount: tiktokAccounts.followerCount,
            lastSyncedAt: tiktokAccounts.lastSyncedAt,
          })
          .from(tiktokAccounts)
          .where(eq(tiktokAccounts.userId, userId));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                accounts.map((a) => ({
                  id: a.id.toString(),
                  username: a.username,
                  displayName: a.displayName,
                  followerCount: a.followerCount,
                  lastSyncedAt: a.lastSyncedAt?.toISOString() ?? null,
                })),
                null,
                2
              ),
            },
          ],
        };
      }
    );

    // Tool: get_account_overview - Get overview metrics
    server.tool(
      "get_account_overview",
      "Get overview metrics for account(s). If accountIds is omitted, aggregates all accounts.",
      {
        accountIds: z
          .array(z.string())
          .optional()
          .describe("Optional array of account IDs"),
      },
      async ({ accountIds }) => {
        const userId = await getCurrentUserId();
        const accounts = await getUserAccounts(userId, accountIds);

        if (accounts.length === 0) {
          return {
            content: [
              { type: "text", text: JSON.stringify({ error: "No accounts found" }) },
            ],
          };
        }

        const accountIdList = accounts.map((a) => a.id);

        // Aggregate metrics from accounts
        const followers = accounts.reduce(
          (sum, a) => sum + (a.followerCount ?? 0),
          0
        );
        const following = accounts.reduce(
          (sum, a) => sum + (a.followingCount ?? 0),
          0
        );
        const likes = accounts.reduce((sum, a) => sum + (a.likesCount ?? 0), 0);
        const videos = accounts.reduce((sum, a) => sum + (a.videoCount ?? 0), 0);

        // Calculate average engagement from posts
        const postData = await db
          .select({
            totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
            totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
            totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
            totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
            postCount: count(),
          })
          .from(posts)
          .where(inArray(posts.accountId, accountIdList));

        const stats = postData[0];
        const totalEngagement =
          (stats?.totalLikes ?? 0) +
          (stats?.totalComments ?? 0) +
          (stats?.totalShares ?? 0);
        const avgEngagement =
          stats?.postCount && stats.postCount > 0
            ? totalEngagement / stats.postCount
            : 0;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  followers,
                  following,
                  likes,
                  videos,
                  avgEngagement: Math.round(avgEngagement * 100) / 100,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );

    // Tool: get_posts - Get posts with filtering and pagination
    server.tool(
      "get_posts",
      "Get posts with filtering and pagination",
      {
        accountIds: z.array(z.string()).optional(),
        sortBy: z
          .enum(["likes", "comments", "shares", "plays", "postedAt"])
          .optional()
          .default("postedAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        limit: z.number().optional().default(10),
        offset: z.number().optional().default(0),
      },
      async ({ accountIds, sortBy, sortOrder, limit, offset }) => {
        const userId = await getCurrentUserId();
        const accounts = await getUserAccounts(userId, accountIds);

        if (accounts.length === 0) {
          return {
            content: [{ type: "text", text: JSON.stringify([]) }],
          };
        }

        const accountIdList = accounts.map((a) => a.id);

        const sortColumn = {
          likes: posts.likes,
          comments: posts.comments,
          shares: posts.shares,
          plays: posts.plays,
          postedAt: posts.postedAt,
        }[sortBy ?? "postedAt"];

        const orderFn = sortOrder === "asc" ? asc : desc;

        const results = await db
          .select({
            id: posts.id,
            accountId: posts.accountId,
            tiktokId: posts.tiktokId,
            description: posts.description,
            likes: posts.likes,
            comments: posts.comments,
            shares: posts.shares,
            plays: posts.plays,
            saves: posts.saves,
            duration: posts.duration,
            thumbnailUrl: posts.thumbnailUrl,
            postedAt: posts.postedAt,
          })
          .from(posts)
          .where(inArray(posts.accountId, accountIdList))
          .orderBy(orderFn(sortColumn))
          .limit(limit ?? 10)
          .offset(offset ?? 0);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                results.map((p) => ({
                  ...p,
                  id: p.id.toString(),
                  accountId: p.accountId.toString(),
                  postedAt: p.postedAt?.toISOString() ?? null,
                })),
                null,
                2
              ),
            },
          ],
        };
      }
    );

    // Tool: get_top_content - Get top performing posts
    server.tool(
      "get_top_content",
      "Get top performing posts by a specific metric",
      {
        accountIds: z.array(z.string()).optional(),
        metric: z.enum(["likes", "comments", "shares", "plays"]),
        limit: z.number().optional().default(5),
      },
      async ({ accountIds, metric, limit }) => {
        const userId = await getCurrentUserId();
        const accounts = await getUserAccounts(userId, accountIds);

        if (accounts.length === 0) {
          return {
            content: [{ type: "text", text: JSON.stringify([]) }],
          };
        }

        const accountIdList = accounts.map((a) => a.id);

        const metricColumn = {
          likes: posts.likes,
          comments: posts.comments,
          shares: posts.shares,
          plays: posts.plays,
        }[metric];

        const results = await db
          .select({
            id: posts.id,
            accountId: posts.accountId,
            tiktokId: posts.tiktokId,
            description: posts.description,
            likes: posts.likes,
            comments: posts.comments,
            shares: posts.shares,
            plays: posts.plays,
            saves: posts.saves,
            thumbnailUrl: posts.thumbnailUrl,
            postedAt: posts.postedAt,
          })
          .from(posts)
          .where(inArray(posts.accountId, accountIdList))
          .orderBy(desc(metricColumn))
          .limit(limit ?? 5);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                results.map((p) => ({
                  ...p,
                  id: p.id.toString(),
                  accountId: p.accountId.toString(),
                  postedAt: p.postedAt?.toISOString() ?? null,
                })),
                null,
                2
              ),
            },
          ],
        };
      }
    );

    // Tool: compare_periods - Compare metrics between two time periods
    server.tool(
      "compare_periods",
      "Compare metrics between two time periods",
      {
        accountIds: z.array(z.string()).optional(),
        period1Start: z.string().describe("ISO date string"),
        period1End: z.string().describe("ISO date string"),
        period2Start: z.string().describe("ISO date string"),
        period2End: z.string().describe("ISO date string"),
      },
      async ({
        accountIds,
        period1Start,
        period1End,
        period2Start,
        period2End,
      }) => {
        const userId = await getCurrentUserId();
        const accounts = await getUserAccounts(userId, accountIds);

        if (accounts.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: "No accounts found" }),
              },
            ],
          };
        }

        const accountIdList = accounts.map((a) => a.id);

        const getMetricsForPeriod = async (startDate: string, endDate: string) => {
          const results = await db
            .select({
              totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
              totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
              totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
              totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
              postCount: count(),
            })
            .from(posts)
            .where(
              and(
                inArray(posts.accountId, accountIdList),
                gte(posts.postedAt, new Date(startDate)),
                lte(posts.postedAt, new Date(endDate))
              )
            );

          const data = results[0];
          return {
            likes: data?.totalLikes ?? 0,
            comments: data?.totalComments ?? 0,
            shares: data?.totalShares ?? 0,
            plays: data?.totalPlays ?? 0,
            posts: data?.postCount ?? 0,
          };
        };

        const period1 = await getMetricsForPeriod(period1Start, period1End);
        const period2 = await getMetricsForPeriod(period2Start, period2End);

        const calculateChange = (
          oldValue: number,
          newValue: number
        ): number | null => {
          if (oldValue === 0) return newValue > 0 ? 100 : 0;
          return Math.round(((newValue - oldValue) / oldValue) * 10000) / 100;
        };

        const changes = {
          likes: calculateChange(period1.likes, period2.likes),
          comments: calculateChange(period1.comments, period2.comments),
          shares: calculateChange(period1.shares, period2.shares),
          plays: calculateChange(period1.plays, period2.plays),
          posts: calculateChange(period1.posts, period2.posts),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ period1, period2, changes }, null, 2),
            },
          ],
        };
      }
    );

    // Tool: compare_accounts - Compare metrics across multiple accounts
    server.tool(
      "compare_accounts",
      "Compare metrics across multiple accounts",
      {
        accountIds: z
          .array(z.string())
          .min(2)
          .describe("At least 2 account IDs required"),
      },
      async ({ accountIds }) => {
        const userId = await getCurrentUserId();
        const accounts = await getUserAccounts(userId, accountIds);

        if (accounts.length < 2) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: "At least 2 accounts required" }),
              },
            ],
          };
        }

        const results = await Promise.all(
          accounts.map(async (account) => {
            const postStats = await db
              .select({
                totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
                totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
                totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
                totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
                postCount: count(),
              })
              .from(posts)
              .where(eq(posts.accountId, account.id));

            const stats = postStats[0];
            const totalEngagement =
              (stats?.totalLikes ?? 0) +
              (stats?.totalComments ?? 0) +
              (stats?.totalShares ?? 0);
            const avgEngagement =
              stats?.postCount && stats.postCount > 0
                ? totalEngagement / stats.postCount
                : 0;

            return {
              accountId: account.id.toString(),
              username: account.username,
              metrics: {
                followers: account.followerCount ?? 0,
                following: account.followingCount ?? 0,
                totalLikes: account.likesCount ?? 0,
                videos: account.videoCount ?? 0,
                avgEngagement: Math.round(avgEngagement * 100) / 100,
                postLikes: stats?.totalLikes ?? 0,
                postComments: stats?.totalComments ?? 0,
                postShares: stats?.totalShares ?? 0,
                postPlays: stats?.totalPlays ?? 0,
              },
            };
          })
        );

        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }
    );

    // Tool: get_engagement_trends - Get daily/weekly engagement trends
    server.tool(
      "get_engagement_trends",
      "Get daily/weekly engagement trends",
      {
        accountIds: z.array(z.string()).optional(),
        period: z.enum(["day", "week", "month"]),
        count: z.number().optional().default(7).describe("Number of periods"),
      },
      async ({ accountIds, period, count: periodCount }) => {
        const userId = await getCurrentUserId();
        const accounts = await getUserAccounts(userId, accountIds);

        if (accounts.length === 0) {
          return {
            content: [{ type: "text", text: JSON.stringify([]) }],
          };
        }

        const accountIdList = accounts.map((a) => a.id);
        const numPeriods = periodCount ?? 7;

        // Calculate date ranges for each period
        const now = new Date();
        const trends: Array<{
          date: string;
          likes: number;
          comments: number;
          shares: number;
          plays: number;
        }> = [];

        for (let i = numPeriods - 1; i >= 0; i--) {
          let startDate: Date;
          let endDate: Date;

          if (period === "day") {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - i);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
          } else if (period === "week") {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - i * 7);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
          } else {
            // month
            startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            endDate.setHours(23, 59, 59, 999);
          }

          const results = await db
            .select({
              totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
              totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
              totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
              totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
            })
            .from(posts)
            .where(
              and(
                inArray(posts.accountId, accountIdList),
                gte(posts.postedAt, startDate),
                lte(posts.postedAt, endDate)
              )
            );

          const data = results[0];
          trends.push({
            date: startDate.toISOString().split("T")[0],
            likes: data?.totalLikes ?? 0,
            comments: data?.totalComments ?? 0,
            shares: data?.totalShares ?? 0,
            plays: data?.totalPlays ?? 0,
          });
        }

        return {
          content: [{ type: "text", text: JSON.stringify(trends, null, 2) }],
        };
      }
    );

    // Tool: get_comment_insights - Get comment analysis
    server.tool(
      "get_comment_insights",
      "Get comment analysis including total comments, top commenters, and recent comments",
      {
        accountIds: z.array(z.string()).optional(),
        limit: z.number().optional().default(10),
      },
      async ({ accountIds, limit }) => {
        const userId = await getCurrentUserId();
        const accounts = await getUserAccounts(userId, accountIds);

        if (accounts.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  totalComments: 0,
                  topCommenters: [],
                  recentComments: [],
                }),
              },
            ],
          };
        }

        const accountIdList = accounts.map((a) => a.id);

        // Get total comment count
        const totalCountResult = await db
          .select({ count: count() })
          .from(comments)
          .innerJoin(posts, eq(comments.postId, posts.id))
          .where(inArray(posts.accountId, accountIdList));

        const totalComments = totalCountResult[0]?.count ?? 0;

        // Get top commenters
        const topCommentersResult = await db
          .select({
            username: comments.authorUsername,
            commentCount: count(),
            totalLikes: sql<number>`COALESCE(SUM(${comments.likes}), 0)`,
          })
          .from(comments)
          .innerJoin(posts, eq(comments.postId, posts.id))
          .where(inArray(posts.accountId, accountIdList))
          .groupBy(comments.authorUsername)
          .orderBy(desc(count()))
          .limit(limit ?? 10);

        // Get recent comments
        const recentCommentsResult = await db
          .select({
            id: comments.id,
            text: comments.text,
            authorUsername: comments.authorUsername,
            likes: comments.likes,
            postedAt: comments.postedAt,
            postId: comments.postId,
          })
          .from(comments)
          .innerJoin(posts, eq(comments.postId, posts.id))
          .where(inArray(posts.accountId, accountIdList))
          .orderBy(desc(comments.postedAt))
          .limit(limit ?? 10);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalComments,
                  topCommenters: topCommentersResult.map((c) => ({
                    username: c.username,
                    commentCount: c.commentCount,
                    totalLikes: c.totalLikes,
                  })),
                  recentComments: recentCommentsResult.map((c) => ({
                    id: c.id.toString(),
                    text: c.text,
                    authorUsername: c.authorUsername,
                    likes: c.likes,
                    postedAt: c.postedAt?.toISOString() ?? null,
                    postId: c.postId.toString(),
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );

    // Tool: get_posting_patterns - Analyze posting patterns
    server.tool(
      "get_posting_patterns",
      "Analyze posting patterns to find best days and hours for posting",
      {
        accountIds: z.array(z.string()).optional(),
      },
      async ({ accountIds }) => {
        const userId = await getCurrentUserId();
        const accounts = await getUserAccounts(userId, accountIds);

        if (accounts.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  bestDays: [],
                  bestHours: [],
                  postsPerDay: {},
                }),
              },
            ],
          };
        }

        const accountIdList = accounts.map((a) => a.id);

        // Get all posts with their posted dates
        const allPosts = await db
          .select({
            postedAt: posts.postedAt,
            likes: posts.likes,
            comments: posts.comments,
            shares: posts.shares,
            plays: posts.plays,
          })
          .from(posts)
          .where(inArray(posts.accountId, accountIdList));

        // Analyze by day of week and hour
        const dayStats: Record<
          number,
          { posts: number; engagement: number }
        > = {};
        const hourStats: Record<
          number,
          { posts: number; engagement: number }
        > = {};
        const postsPerDay: Record<string, number> = {};

        for (let i = 0; i < 7; i++) dayStats[i] = { posts: 0, engagement: 0 };
        for (let i = 0; i < 24; i++) hourStats[i] = { posts: 0, engagement: 0 };

        allPosts.forEach((post) => {
          if (!post.postedAt) return;

          const date = new Date(post.postedAt);
          const dayOfWeek = date.getDay();
          const hour = date.getHours();
          const dateStr = date.toISOString().split("T")[0];

          const engagement =
            (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0);

          dayStats[dayOfWeek].posts++;
          dayStats[dayOfWeek].engagement += engagement;

          hourStats[hour].posts++;
          hourStats[hour].engagement += engagement;

          postsPerDay[dateStr] = (postsPerDay[dateStr] ?? 0) + 1;
        });

        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];

        // Calculate average engagement per post for each day
        const bestDays = Object.entries(dayStats)
          .filter(([, stats]) => stats.posts > 0)
          .map(([day, stats]) => ({
            day: dayNames[parseInt(day)],
            posts: stats.posts,
            avgEngagement:
              Math.round((stats.engagement / stats.posts) * 100) / 100,
          }))
          .sort((a, b) => b.avgEngagement - a.avgEngagement);

        // Calculate average engagement per post for each hour
        const bestHours = Object.entries(hourStats)
          .filter(([, stats]) => stats.posts > 0)
          .map(([hour, stats]) => ({
            hour: parseInt(hour),
            posts: stats.posts,
            avgEngagement:
              Math.round((stats.engagement / stats.posts) * 100) / 100,
          }))
          .sort((a, b) => b.avgEngagement - a.avgEngagement);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  bestDays,
                  bestHours,
                  postsPerDay,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );
  },
  {
    // Server options
    capabilities: {
      tools: {},
    },
  },
  {
    // Config options
    basePath: "/api/mcp",
    verboseLogs: process.env.NODE_ENV === "development",
  }
);

export { handler as GET, handler as POST, handler as DELETE };
