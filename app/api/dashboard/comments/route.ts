import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, posts } from "@/lib/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import {
  withAccountAuth,
  isAuthError,
  PERIOD_DAYS,
} from "@/lib/dashboard-utils";

/**
 * GET /api/dashboard/comments
 * Returns recent comments across all posts for a TikTok account
 *
 * Query Parameters:
 * - accountId (required): TikTok account ID
 * - limit (optional): number of comments to return (default: 20, max: 100)
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
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit. Must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Get recent comments with post context
    // Join comments with posts to get only comments from posts belonging to this account
    const recentComments = await db
      .select({
        id: comments.id,
        tiktokId: comments.tiktokId,
        text: comments.text,
        authorUsername: comments.authorUsername,
        authorAvatarUrl: comments.authorAvatarUrl,
        likes: comments.likes,
        postedAt: comments.postedAt,
        createdAt: comments.createdAt,
        post: {
          id: posts.id,
          tiktokId: posts.tiktokId,
          description: posts.description,
          thumbnailUrl: posts.thumbnailUrl,
        },
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(and(eq(posts.accountId, accountId), gte(comments.postedAt, startDate)))
      .orderBy(desc(comments.postedAt), desc(comments.createdAt))
      .limit(limit);

    // Transform the data for response
    const formattedComments = recentComments.map((comment) => ({
      id: comment.id,
      tiktokId: comment.tiktokId,
      text: comment.text,
      authorUsername: comment.authorUsername,
      authorAvatarUrl: comment.authorAvatarUrl,
      likes: comment.likes ?? 0,
      postedAt: comment.postedAt?.toISOString() ?? null,
      createdAt: comment.createdAt.toISOString(),
      post: {
        id: comment.post.id,
        tiktokId: comment.post.tiktokId,
        description: comment.post.description,
        thumbnailUrl: comment.post.thumbnailUrl,
      },
    }));

    return NextResponse.json({
      comments: formattedComments,
      total: formattedComments.length,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
