import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import {
  withAccountAuth,
  isAuthError,
  PERIOD_DAYS,
} from "@/lib/dashboard-utils";

/**
 * GET /api/dashboard/engagement
 * Returns time-series engagement data for charts
 *
 * Query params:
 * - accountId (required): TikTok account ID
 * - period (optional): "7d" | "30d" | "90d" - defaults to "30d"
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAccountAuth(request);
    if (isAuthError(authResult)) return authResult;
    const { accountId, period } = authResult;

    // Calculate the start date for the period
    const days = PERIOD_DAYS[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Query posts grouped by date with aggregated metrics
    const engagementData = await db
      .select({
        date: sql<string>`DATE(${posts.postedAt})`.as("date"),
        plays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`.as("plays"),
        likes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`.as("likes"),
        comments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`.as("comments"),
        shares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`.as("shares"),
        saves: sql<number>`COALESCE(SUM(${posts.saves}), 0)`.as("saves"),
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

    // Transform the data to ensure proper types and format
    const data = engagementData.map((row) => ({
      date: row.date,
      plays: Number(row.plays),
      likes: Number(row.likes),
      comments: Number(row.comments),
      shares: Number(row.shares),
      saves: Number(row.saves),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching engagement data:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagement data" },
      { status: 500 }
    );
  }
}
