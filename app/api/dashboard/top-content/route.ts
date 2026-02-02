import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, tiktokAccounts } from "@/lib/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

type Period = "7d" | "30d" | "90d";

const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const DEFAULT_PERIOD: Period = "30d";
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 50;

/**
 * GET /api/dashboard/top-content
 * Get top performing videos for a TikTok account
 *
 * Query Parameters:
 * - accountId (required): TikTok account ID
 * - period (optional): "7d", "30d", "90d" - defaults to "30d"
 * - limit (optional): number of videos to return - defaults to 6
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse and validate accountId
    const accountIdParam = searchParams.get("accountId");
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

    // Parse and validate period
    const periodParam = searchParams.get("period") as Period | null;
    const period: Period =
      periodParam && Object.keys(PERIOD_DAYS).includes(periodParam)
        ? periodParam
        : DEFAULT_PERIOD;

    // Parse and validate limit
    const limitParam = searchParams.get("limit");
    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, MAX_LIMIT);
      }
    }

    // Verify the account belongs to the authenticated user
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
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Calculate the date threshold based on period
    const days = PERIOD_DAYS[period];
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Query top performing videos
    const topVideos = await db
      .select({
        id: posts.id,
        tiktokId: posts.tiktokId,
        description: posts.description,
        thumbnailUrl: posts.thumbnailUrl,
        videoUrl: posts.videoUrl,
        likes: posts.likes,
        comments: posts.comments,
        shares: posts.shares,
        plays: posts.plays,
        saves: posts.saves,
        postedAt: posts.postedAt,
      })
      .from(posts)
      .where(
        and(
          eq(posts.accountId, accountId),
          gte(posts.postedAt, dateThreshold)
        )
      )
      .orderBy(desc(posts.plays))
      .limit(limit);

    // Calculate engagement rate for each video
    const videos = topVideos.map((video) => {
      const likes = video.likes ?? 0;
      const comments = video.comments ?? 0;
      const shares = video.shares ?? 0;
      const plays = video.plays ?? 0;

      // Engagement rate: (likes + comments + shares) / plays * 100
      // Handle division by zero
      const engagementRate =
        plays > 0 ? ((likes + comments + shares) / plays) * 100 : 0;

      return {
        id: video.id,
        tiktokId: video.tiktokId,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        videoUrl: video.videoUrl,
        likes,
        comments,
        shares,
        plays,
        saves: video.saves ?? 0,
        postedAt: video.postedAt?.toISOString() ?? null,
        engagementRate: Math.round(engagementRate * 100) / 100, // Round to 2 decimal places
      };
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching top content:", error);
    return NextResponse.json(
      { error: "Failed to fetch top content" },
      { status: 500 }
    );
  }
}
