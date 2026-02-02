import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, tiktokAccounts } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

type Period = "7d" | "30d" | "90d";

const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function isValidPeriod(value: string): value is Period {
  return value in PERIOD_DAYS;
}

// Day names for mapping
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * GET /api/dashboard/posting-times
 * Returns posting frequency analysis grouped by day of week and hour
 *
 * Query Parameters:
 * - accountId (required): TikTok account ID
 * - period (optional): "7d" | "30d" | "90d" - defaults to "30d"
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountIdParam = searchParams.get("accountId");
    const periodParam = searchParams.get("period") || "30d";

    // Validate accountId
    if (!accountIdParam) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    const accountId = parseInt(accountIdParam, 10);
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "Invalid accountId" },
        { status: 400 }
      );
    }

    // Validate period
    if (!isValidPeriod(periodParam)) {
      return NextResponse.json(
        { error: "Invalid period. Must be one of: 7d, 30d, 90d" },
        { status: 400 }
      );
    }

    // Verify account ownership
    const [account] = await db
      .select({ id: tiktokAccounts.id })
      .from(tiktokAccounts)
      .where(
        and(
          eq(tiktokAccounts.id, accountId),
          eq(tiktokAccounts.userId, userId)
        )
      )
      .limit(1);

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Calculate the start date for the period
    const days = PERIOD_DAYS[periodParam];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Query posts grouped by day of week and hour
    // EXTRACT(DOW) returns 0-6 (Sunday-Saturday)
    // EXTRACT(HOUR) returns 0-23
    const postingData = await db
      .select({
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${posts.postedAt})`.as("day_of_week"),
        hour: sql<number>`EXTRACT(HOUR FROM ${posts.postedAt})`.as("hour"),
        postCount: sql<number>`COUNT(*)`.as("post_count"),
        totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`.as("total_plays"),
        totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`.as("total_likes"),
        totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`.as("total_comments"),
        totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`.as("total_shares"),
        totalSaves: sql<number>`COALESCE(SUM(${posts.saves}), 0)`.as("total_saves"),
      })
      .from(posts)
      .where(
        and(
          eq(posts.accountId, accountId),
          gte(posts.postedAt, startDate)
        )
      )
      .groupBy(
        sql`EXTRACT(DOW FROM ${posts.postedAt})`,
        sql`EXTRACT(HOUR FROM ${posts.postedAt})`
      )
      .orderBy(
        sql`EXTRACT(DOW FROM ${posts.postedAt}) ASC`,
        sql`EXTRACT(HOUR FROM ${posts.postedAt}) ASC`
      );

    // Transform the data with calculated engagement metrics
    const timeSlots = postingData.map((row) => {
      const postCount = Number(row.postCount);
      const totalPlays = Number(row.totalPlays);
      const totalLikes = Number(row.totalLikes);
      const totalComments = Number(row.totalComments);
      const totalShares = Number(row.totalShares);
      const totalSaves = Number(row.totalSaves);

      const totalEngagements = totalLikes + totalComments + totalShares + totalSaves;
      const engagementRate = totalPlays > 0
        ? Number(((totalEngagements / totalPlays) * 100).toFixed(2))
        : 0;
      const avgPlays = postCount > 0 ? Math.round(totalPlays / postCount) : 0;

      return {
        dayOfWeek: Number(row.dayOfWeek),
        dayName: DAY_NAMES[Number(row.dayOfWeek)],
        hour: Number(row.hour),
        postCount,
        metrics: {
          totalPlays,
          avgPlays,
          totalLikes,
          totalComments,
          totalShares,
          totalSaves,
          engagementRate,
        },
      };
    });

    // Create a summary by day of week
    const byDayOfWeek: Record<number, {
      dayName: string;
      postCount: number;
      totalPlays: number;
      avgEngagementRate: number;
    }> = {};

    // Initialize all days
    for (let i = 0; i < 7; i++) {
      byDayOfWeek[i] = {
        dayName: DAY_NAMES[i],
        postCount: 0,
        totalPlays: 0,
        avgEngagementRate: 0,
      };
    }

    // Aggregate by day
    const totalEngagementRates = Array(7).fill(0);
    const engagementCounts = Array(7).fill(0);

    timeSlots.forEach((slot) => {
      const day = slot.dayOfWeek;
      byDayOfWeek[day].postCount += slot.postCount;
      byDayOfWeek[day].totalPlays += slot.metrics.totalPlays;
      if (slot.metrics.engagementRate > 0) {
        totalEngagementRates[day] += slot.metrics.engagementRate * slot.postCount;
        engagementCounts[day] += slot.postCount;
      }
    });

    // Calculate average engagement rate per day
    for (let i = 0; i < 7; i++) {
      if (engagementCounts[i] > 0) {
        byDayOfWeek[i].avgEngagementRate = Number(
          (totalEngagementRates[i] / engagementCounts[i]).toFixed(2)
        );
      }
    }

    // Create a summary by hour
    const byHour: Record<number, {
      postCount: number;
      totalPlays: number;
      avgEngagementRate: number;
    }> = {};

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      byHour[i] = {
        postCount: 0,
        totalPlays: 0,
        avgEngagementRate: 0,
      };
    }

    // Aggregate by hour
    const hourTotalEngagementRates = Array(24).fill(0);
    const hourEngagementCounts = Array(24).fill(0);

    timeSlots.forEach((slot) => {
      const hour = slot.hour;
      byHour[hour].postCount += slot.postCount;
      byHour[hour].totalPlays += slot.metrics.totalPlays;
      if (slot.metrics.engagementRate > 0) {
        hourTotalEngagementRates[hour] += slot.metrics.engagementRate * slot.postCount;
        hourEngagementCounts[hour] += slot.postCount;
      }
    });

    // Calculate average engagement rate per hour
    for (let i = 0; i < 24; i++) {
      if (hourEngagementCounts[i] > 0) {
        byHour[i].avgEngagementRate = Number(
          (hourTotalEngagementRates[i] / hourEngagementCounts[i]).toFixed(2)
        );
      }
    }

    return NextResponse.json({
      timeSlots,
      summary: {
        byDayOfWeek: Object.values(byDayOfWeek),
        byHour: Object.entries(byHour).map(([hour, data]) => ({
          hour: Number(hour),
          ...data,
        })),
      },
      period: periodParam,
    });
  } catch (error) {
    console.error("Error fetching posting times:", error);
    return NextResponse.json(
      { error: "Failed to fetch posting times" },
      { status: 500 }
    );
  }
}
