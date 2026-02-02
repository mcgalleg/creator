import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, posts, tiktokAccounts } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountIdParam = searchParams.get("accountId");
    const limitParam = searchParams.get("limit");

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

    // Parse and validate limit
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Invalid limit. Must be between 1 and 50" },
        { status: 400 }
      );
    }

    // Verify the account belongs to the current user
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
          sql`${comments.authorUsername} IS NOT NULL`
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
