import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, posts, tiktokAccounts } from "@/lib/db/schema";
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

/**
 * GET /api/dashboard/comments/activity
 * Returns comment activity timeline data for charts
 *
 * Query params:
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

    // Query comments grouped by date
    // We use postedAt if available, otherwise createdAt
    const activityData = await db
      .select({
        date: sql<string>`DATE(COALESCE(${comments.postedAt}, ${comments.createdAt}))`.as("date"),
        comments: sql<number>`COUNT(*)`.as("comments"),
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(
        and(
          eq(posts.accountId, accountId),
          gte(sql`COALESCE(${comments.postedAt}, ${comments.createdAt})`, startDate)
        )
      )
      .groupBy(sql`DATE(COALESCE(${comments.postedAt}, ${comments.createdAt}))`)
      .orderBy(sql`DATE(COALESCE(${comments.postedAt}, ${comments.createdAt})) ASC`);

    // Fill in missing dates with zero comments
    const filledData: { date: string; comments: number }[] = [];
    const dataMap = new Map(activityData.map((d) => [d.date, Number(d.comments)]));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      filledData.push({
        date: dateStr,
        comments: dataMap.get(dateStr) || 0,
      });
    }

    // Calculate total
    const total = filledData.reduce((sum, d) => sum + d.comments, 0);

    return NextResponse.json({
      activity: filledData,
      total,
      period: periodParam,
    });
  } catch (error) {
    console.error("Error fetching comment activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch comment activity" },
      { status: 500 }
    );
  }
}
