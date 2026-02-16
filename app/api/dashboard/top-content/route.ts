import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import {
  withAccountAuth,
  isAuthError,
  calculateEngagementRate,
  PERIOD_DAYS,
} from "@/lib/dashboard-utils";
import { proxyImageUrl } from "@/lib/image-proxy";

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
    const authResult = await withAccountAuth(request);
    if (isAuthError(authResult)) return authResult;
    const { accountId, period } = authResult;

    // Parse and validate limit
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, MAX_LIMIT);
      }
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
      const saves = video.saves ?? 0;
      const plays = video.plays ?? 0;

      const engagementRate = calculateEngagementRate(likes, comments, shares, saves, plays);

      return {
        id: video.id,
        tiktokId: video.tiktokId,
        description: video.description,
        thumbnailUrl: proxyImageUrl(video.thumbnailUrl),
        videoUrl: video.videoUrl,
        likes,
        comments,
        shares,
        plays,
        saves,
        postedAt: video.postedAt?.toISOString() ?? null,
        engagementRate,
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
