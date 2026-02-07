import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts, posts, accountMetricsHistory } from "@/lib/db/schema";
import { eq, and, gte, lt, sql, desc } from "drizzle-orm";
import {
  withAccountAuth,
  isAuthError,
  calculateEngagementRate,
  PERIOD_DAYS,
} from "@/lib/dashboard-utils";

interface OverviewMetrics {
  followers: number;
  followerChange: number;
  totalPlays: number;
  playsChange: number;
  engagementRate: number;
  engagementRateChange: number;
  contentVelocity: number;
}

interface OverviewResponse {
  metrics: OverviewMetrics;
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

/**
 * GET /api/dashboard/overview
 * Returns KPI metrics for a TikTok account dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAccountAuth(request);
    if (isAuthError(authResult)) return authResult;
    const { accountId, period } = authResult;

    // Get account data (need followerCount)
    const [account] = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.id, accountId))
      .limit(1);

    // Calculate date ranges
    const now = new Date();
    const periodDays = PERIOD_DAYS[period];
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - periodDays);

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

    // 1. Get current metrics from tiktokAccounts
    const currentFollowers = account.followerCount ?? 0;

    // 2. Get historical metrics for previous period comparison
    // Find the closest metric record to the start of the previous period
    const [previousMetrics] = await db
      .select()
      .from(accountMetricsHistory)
      .where(
        and(
          eq(accountMetricsHistory.accountId, accountId),
          lt(accountMetricsHistory.recordedAt, currentPeriodStart)
        )
      )
      .orderBy(desc(accountMetricsHistory.recordedAt))
      .limit(1);

    const previousFollowers = previousMetrics?.followerCount ?? currentFollowers;

    // 3. Aggregate post engagement for current period
    const [currentPeriodEngagement] = await db
      .select({
        totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
        totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
        totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
        totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
        postCount: sql<number>`COUNT(*)`,
      })
      .from(posts)
      .where(
        and(
          eq(posts.accountId, accountId),
          gte(posts.postedAt, currentPeriodStart)
        )
      );

    // 4. Aggregate post engagement for previous period
    const [previousPeriodEngagement] = await db
      .select({
        totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
        totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
        totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
        totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
      })
      .from(posts)
      .where(
        and(
          eq(posts.accountId, accountId),
          gte(posts.postedAt, previousPeriodStart),
          lt(posts.postedAt, currentPeriodStart)
        )
      );

    // 5. Calculate metrics
    const currentLikes = Number(currentPeriodEngagement?.totalLikes ?? 0);
    const currentComments = Number(currentPeriodEngagement?.totalComments ?? 0);
    const currentShares = Number(currentPeriodEngagement?.totalShares ?? 0);
    const currentPlays = Number(currentPeriodEngagement?.totalPlays ?? 0);
    const contentVelocity = Number(currentPeriodEngagement?.postCount ?? 0);

    const previousLikes = Number(previousPeriodEngagement?.totalLikes ?? 0);
    const previousComments = Number(previousPeriodEngagement?.totalComments ?? 0);
    const previousShares = Number(previousPeriodEngagement?.totalShares ?? 0);
    const previousPlays = Number(previousPeriodEngagement?.totalPlays ?? 0);

    // Calculate engagement rates (overview intentionally excludes saves, pass 0)
    const currentEngagementRate = calculateEngagementRate(
      currentLikes,
      currentComments,
      currentShares,
      0,
      currentPlays
    );

    const previousEngagementRate = calculateEngagementRate(
      previousLikes,
      previousComments,
      previousShares,
      0,
      previousPlays
    );

    // Build response
    const metrics: OverviewMetrics = {
      followers: currentFollowers,
      followerChange: calculatePercentChange(currentFollowers, previousFollowers),
      totalPlays: currentPlays,
      playsChange: calculatePercentChange(currentPlays, previousPlays),
      engagementRate: currentEngagementRate,
      engagementRateChange: calculatePercentChange(
        currentEngagementRate,
        previousEngagementRate
      ),
      contentVelocity,
    };

    const response: OverviewResponse = { metrics };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard overview" },
      { status: 500 }
    );
  }
}
