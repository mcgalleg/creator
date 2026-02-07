import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts, accountMetricsHistory, posts } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import {
  withAccountAuth,
  isAuthError,
  calculateEngagementRate,
  PERIOD_DAYS,
} from "@/lib/dashboard-utils";

/**
 * GET /api/dashboard/growth
 * Returns follower and engagement growth over time for charts
 *
 * Query Parameters:
 * - accountId (required): TikTok account ID
 * - period (optional): "7d" | "30d" | "90d" - defaults to "30d"
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAccountAuth(request);
    if (isAuthError(authResult)) return authResult;
    const { accountId, period } = authResult;

    // Get account data (need followerCount, likesCount for summary)
    const [account] = await db
      .select({
        id: tiktokAccounts.id,
        followerCount: tiktokAccounts.followerCount,
        likesCount: tiktokAccounts.likesCount,
      })
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.id, accountId))
      .limit(1);

    // Calculate the start date for the period
    const days = PERIOD_DAYS[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get historical metrics data grouped by date
    const metricsHistory = await db
      .select({
        date: sql<string>`DATE(${accountMetricsHistory.recordedAt})`.as("date"),
        followerCount: sql<number>`MAX(${accountMetricsHistory.followerCount})`.as("follower_count"),
        followingCount: sql<number>`MAX(${accountMetricsHistory.followingCount})`.as("following_count"),
        likesCount: sql<number>`MAX(${accountMetricsHistory.likesCount})`.as("likes_count"),
        videoCount: sql<number>`MAX(${accountMetricsHistory.videoCount})`.as("video_count"),
      })
      .from(accountMetricsHistory)
      .where(
        and(
          eq(accountMetricsHistory.accountId, accountId),
          gte(accountMetricsHistory.recordedAt, startDate)
        )
      )
      .groupBy(sql`DATE(${accountMetricsHistory.recordedAt})`)
      .orderBy(sql`DATE(${accountMetricsHistory.recordedAt}) ASC`);

    // Get engagement data from posts grouped by date
    const engagementHistory = await db
      .select({
        date: sql<string>`DATE(${posts.postedAt})`.as("date"),
        totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`.as("total_plays"),
        totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`.as("total_likes"),
        totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`.as("total_comments"),
        totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`.as("total_shares"),
        totalSaves: sql<number>`COALESCE(SUM(${posts.saves}), 0)`.as("total_saves"),
        postCount: sql<number>`COUNT(*)`.as("post_count"),
      })
      .from(posts)
      .where(
        and(
          eq(posts.accountId, accountId),
          gte(posts.postedAt, startDate)
        )
      )
      .groupBy(sql`DATE(${posts.postedAt})`)
      .orderBy(sql`DATE(${posts.postedAt}) ASC`);

    // Transform metrics history data
    const followerGrowth = metricsHistory.map((row) => ({
      date: row.date,
      followers: Number(row.followerCount ?? 0),
      following: Number(row.followingCount ?? 0),
      totalLikes: Number(row.likesCount ?? 0),
      videoCount: Number(row.videoCount ?? 0),
    }));

    // Transform engagement history data with calculated engagement rate
    const engagementGrowth = engagementHistory.map((row) => {
      const totalPlays = Number(row.totalPlays);
      const totalLikes = Number(row.totalLikes);
      const totalComments = Number(row.totalComments);
      const totalShares = Number(row.totalShares);
      const totalSaves = Number(row.totalSaves);
      const postCount = Number(row.postCount);

      const engagementRate = calculateEngagementRate(
        totalLikes,
        totalComments,
        totalShares,
        totalSaves,
        totalPlays
      );

      return {
        date: row.date,
        plays: totalPlays,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        saves: totalSaves,
        postCount,
        engagementRate,
      };
    });

    // Calculate growth summary
    const calculateGrowth = (data: { followers: number }[]) => {
      if (data.length < 2) {
        return { absolute: 0, percentage: 0 };
      }
      const first = data[0].followers;
      const last = data[data.length - 1].followers;
      const absolute = last - first;
      const percentage = first > 0 ? Number(((absolute / first) * 100).toFixed(2)) : 0;
      return { absolute, percentage };
    };

    const summary = {
      currentFollowers: account.followerCount ?? 0,
      currentLikes: account.likesCount ?? 0,
      followerGrowth: calculateGrowth(followerGrowth),
      period,
      dataPoints: followerGrowth.length,
    };

    return NextResponse.json({
      followerGrowth,
      engagementGrowth,
      summary,
    });
  } catch (error) {
    console.error("Error fetching growth data:", error);
    return NextResponse.json(
      { error: "Failed to fetch growth data" },
      { status: 500 }
    );
  }
}
