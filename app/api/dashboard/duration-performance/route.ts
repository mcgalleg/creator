import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, and, gte, isNotNull, sql } from "drizzle-orm";
import { withAccountAuth, isAuthError, calculateEngagementRate, PERIOD_DAYS } from "@/lib/dashboard-utils";

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAccountAuth(request);
    if (isAuthError(authResult)) return authResult;
    const { accountId, period } = authResult;

    const days = PERIOD_DAYS[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const videoData = await db
      .select({
        id: posts.id,
        duration: posts.duration,
        plays: posts.plays,
        likes: posts.likes,
        comments: posts.comments,
        shares: posts.shares,
        saves: posts.saves,
        description: posts.description,
      })
      .from(posts)
      .where(
        and(
          eq(posts.accountId, accountId),
          gte(posts.postedAt, startDate),
          isNotNull(posts.duration)
        )
      )
      .orderBy(sql`${posts.plays} DESC`)
      .limit(50);

    const videos = videoData.map((v) => ({
      id: v.id,
      duration: Number(v.duration),
      plays: Number(v.plays ?? 0),
      engagementRate: calculateEngagementRate(
        Number(v.likes ?? 0),
        Number(v.comments ?? 0),
        Number(v.shares ?? 0),
        Number(v.saves ?? 0),
        Number(v.plays ?? 0)
      ),
      description: v.description,
    }));

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching duration performance:", error);
    return NextResponse.json({ error: "Failed to fetch duration performance data" }, { status: 500 });
  }
}
