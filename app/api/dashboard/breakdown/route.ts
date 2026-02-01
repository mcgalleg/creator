import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, tiktokAccounts } from "@/lib/db/schema";
import { eq, and, gte, sum } from "drizzle-orm";

type EngagementType = "likes" | "comments" | "shares" | "saves";

interface BreakdownItem {
  type: EngagementType;
  value: number;
  percentage: number;
}

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/**
 * GET /api/dashboard/breakdown
 * Get engagement breakdown for pie chart
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
    const period = searchParams.get("period") || "30d";

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
    if (!PERIOD_DAYS[period]) {
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

    // Calculate the date threshold for the period
    const days = PERIOD_DAYS[period];
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Query engagement totals
    const [engagementTotals] = await db
      .select({
        totalLikes: sum(posts.likes),
        totalComments: sum(posts.comments),
        totalShares: sum(posts.shares),
        totalSaves: sum(posts.saves),
      })
      .from(posts)
      .where(
        and(
          eq(posts.accountId, accountId),
          gte(posts.postedAt, dateThreshold)
        )
      );

    // Parse the sums (they come as strings from the database)
    const likes = Number(engagementTotals?.totalLikes) || 0;
    const comments = Number(engagementTotals?.totalComments) || 0;
    const shares = Number(engagementTotals?.totalShares) || 0;
    const saves = Number(engagementTotals?.totalSaves) || 0;

    const totalEngagement = likes + comments + shares + saves;

    // Calculate percentages
    const calculatePercentage = (value: number): number => {
      if (totalEngagement === 0) return 0;
      return Math.round((value / totalEngagement) * 10000) / 100; // Round to 2 decimal places
    };

    const breakdown: BreakdownItem[] = [
      {
        type: "likes",
        value: likes,
        percentage: calculatePercentage(likes),
      },
      {
        type: "comments",
        value: comments,
        percentage: calculatePercentage(comments),
      },
      {
        type: "shares",
        value: shares,
        percentage: calculatePercentage(shares),
      },
      {
        type: "saves",
        value: saves,
        percentage: calculatePercentage(saves),
      },
    ];

    return NextResponse.json({ breakdown });
  } catch (error) {
    console.error("Error fetching engagement breakdown:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagement breakdown" },
      { status: 500 }
    );
  }
}
