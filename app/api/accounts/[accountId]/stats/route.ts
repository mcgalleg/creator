import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts, posts, comments } from "@/lib/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { withRouteAuth, isAuthError } from "@/lib/dashboard-utils";

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
    const authResult = await withRouteAuth(params);
    if (isAuthError(authResult)) return authResult;
    const { accountId } = authResult;

    // Get account metadata for totalPosts and lastSyncedAt
    const [account] = await db
      .select({
        videoCount: tiktokAccounts.videoCount,
        lastSyncedAt: tiktokAccounts.lastSyncedAt,
      })
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.id, accountId))
      .limit(1);

    // Get count of synced posts
    const [postStats] = await db
      .select({
        syncedPosts: count(posts.id),
        // Sum of comment counts from TikTok (not our synced comments)
        estimatedComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)::int`,
      })
      .from(posts)
      .where(eq(posts.accountId, accountId));

    // Get count of synced comments
    const [commentStats] = await db
      .select({
        syncedComments: count(comments.id),
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(eq(posts.accountId, accountId));

    const stats: AccountStats = {
      syncedPosts: postStats?.syncedPosts ?? 0,
      totalPosts: account?.videoCount ?? 0,
      syncedComments: commentStats?.syncedComments ?? 0,
      estimatedComments: postStats?.estimatedComments ?? 0,
      lastSyncedAt: account?.lastSyncedAt?.toISOString() ?? null,
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
