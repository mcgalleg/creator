import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts, posts, comments } from "@/lib/db/schema";
import { eq, and, sql, count } from "drizzle-orm";

interface AccountStats {
  syncedPosts: number;
  totalPosts: number;
  syncedComments: number;
  estimatedComments: number;
  lastSyncedAt: string | null;
}

/**
 * GET /api/accounts/[accountId]/stats
 * Get sync statistics for the data tree display
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await params;
    const accountIdNum = parseInt(accountId, 10);

    if (isNaN(accountIdNum)) {
      return NextResponse.json(
        { error: "Invalid account ID" },
        { status: 400 }
      );
    }

    // Verify the account belongs to the user (active only)
    const [account] = await db
      .select({
        id: tiktokAccounts.id,
        videoCount: tiktokAccounts.videoCount,
        lastSyncedAt: tiktokAccounts.lastSyncedAt,
      })
      .from(tiktokAccounts)
      .where(
        and(
          eq(tiktokAccounts.id, accountIdNum),
          eq(tiktokAccounts.userId, userId),
          eq(tiktokAccounts.status, "active")
        )
      )
      .limit(1);

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Get count of synced posts
    const [postStats] = await db
      .select({
        syncedPosts: count(posts.id),
        // Sum of comment counts from TikTok (not our synced comments)
        estimatedComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)::int`,
      })
      .from(posts)
      .where(eq(posts.accountId, accountIdNum));

    // Get count of synced comments
    const [commentStats] = await db
      .select({
        syncedComments: count(comments.id),
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(eq(posts.accountId, accountIdNum));

    const stats: AccountStats = {
      syncedPosts: postStats?.syncedPosts ?? 0,
      totalPosts: account.videoCount ?? 0,
      syncedComments: commentStats?.syncedComments ?? 0,
      estimatedComments: postStats?.estimatedComments ?? 0,
      lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching account stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch account stats" },
      { status: 500 }
    );
  }
}
