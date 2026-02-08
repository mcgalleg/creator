import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, posts } from "@/lib/db/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import {
  withAccountAuth,
  isAuthError,
  PERIOD_DAYS,
} from "@/lib/dashboard-utils";

/**
 * GET /api/dashboard/comments/top-commenters
 * Returns top commenters ranked by engagement (comment count and likes)
 *
 * Query Parameters:
 * - accountId (required): TikTok account ID
 * - limit (optional): number of commenters to return (default: 10, max: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAccountAuth(request);
    if (isAuthError(authResult)) return authResult;
    const { accountId, period } = authResult;

    const days = PERIOD_DAYS[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");

    // Parse and validate limit
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Invalid limit. Must be between 1 and 50" },
        { status: 400 }
      );
    }

    // Get top commenters with aggregated stats
    // We group by authorUsername and calculate comment count and total likes
    const topCommenters = await db
      .select({
        authorUsername: comments.authorUsername,
        authorAvatarUrl: sql<string>`MAX(${comments.authorAvatarUrl})`.as("authorAvatarUrl"),
        commentCount: sql<number>`COUNT(*)`.as("commentCount"),
        totalLikes: sql<number>`COALESCE(SUM(${comments.likes}), 0)`.as("totalLikes"),
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(
        and(
          eq(posts.accountId, accountId),
          gte(comments.postedAt, startDate),
          sql`${comments.authorUsername} IS NOT NULL AND ${comments.authorUsername} != ''`
        )
      )
      .groupBy(comments.authorUsername)
      .orderBy(
        desc(sql`COUNT(*)`),
        desc(sql`COALESCE(SUM(${comments.likes}), 0)`)
      )
      .limit(limit);

    // Transform the data
    const formattedCommenters = topCommenters.map((commenter) => ({
      authorUsername: commenter.authorUsername!,
      authorAvatarUrl: commenter.authorAvatarUrl || null,
      commentCount: Number(commenter.commentCount),
      totalLikes: Number(commenter.totalLikes),
    }));

    return NextResponse.json({
      commenters: formattedCommenters,
      total: formattedCommenters.length,
    });
  } catch (error) {
    console.error("Error fetching top commenters:", error);
    return NextResponse.json(
      { error: "Failed to fetch top commenters" },
      { status: 500 }
    );
  }
}
