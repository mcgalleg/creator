import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, tiktokAccounts } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

/**
 * GET /api/dashboard/recent-posts
 * Get recent posts for a TikTok account with pagination support
 *
 * Query Parameters:
 * - accountId (required): TikTok account ID
 * - limit (optional): number of posts (default: 10)
 * - offset (optional): pagination offset (default: 0)
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
    const offsetParam = searchParams.get("offset");

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
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit. Must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Parse and validate offset
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: "Invalid offset. Must be a non-negative integer" },
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

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.accountId, accountId));

    const total = totalResult?.count ?? 0;

    // Get posts with pagination
    const recentPosts = await db
      .select({
        id: posts.id,
        tiktokId: posts.tiktokId,
        description: posts.description,
        thumbnailUrl: posts.thumbnailUrl,
        likes: posts.likes,
        comments: posts.comments,
        shares: posts.shares,
        plays: posts.plays,
        saves: posts.saves,
        postedAt: posts.postedAt,
      })
      .from(posts)
      .where(eq(posts.accountId, accountId))
      .orderBy(desc(posts.postedAt))
      .limit(limit)
      .offset(offset);

    // Calculate engagement rate for each post
    // Engagement rate = (likes + comments + shares + saves) / plays * 100
    const postsWithEngagement = recentPosts.map((post) => {
      const totalEngagements =
        (post.likes ?? 0) +
        (post.comments ?? 0) +
        (post.shares ?? 0) +
        (post.saves ?? 0);
      const plays = post.plays ?? 0;
      const engagementRate = plays > 0 ? (totalEngagements / plays) * 100 : 0;

      return {
        id: post.id,
        tiktokId: post.tiktokId,
        description: post.description,
        thumbnailUrl: post.thumbnailUrl,
        likes: post.likes ?? 0,
        comments: post.comments ?? 0,
        shares: post.shares ?? 0,
        plays: post.plays ?? 0,
        saves: post.saves ?? 0,
        postedAt: post.postedAt?.toISOString() ?? null,
        engagementRate: Math.round(engagementRate * 100) / 100, // Round to 2 decimal places
      };
    });

    return NextResponse.json({
      posts: postsWithEngagement,
      total,
    });
  } catch (error) {
    console.error("Error fetching recent posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent posts" },
      { status: 500 }
    );
  }
}
