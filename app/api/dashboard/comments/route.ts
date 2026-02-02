import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, posts, tiktokAccounts } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

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
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit. Must be between 1 and 100" },
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
      .where(eq(posts.accountId, accountId))
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
