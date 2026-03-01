import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts, posts, syncJobs } from "@/lib/db/schema";
import { eq, and, inArray, count } from "drizzle-orm";
import { cancelSyncJob } from "@/lib/services/sync-service";
import { proxyImageUrl } from "@/lib/image-proxy";
import { withRouteAuth, isAuthError } from "@/lib/dashboard-utils";

interface RouteParams {
  params: Promise<{ accountId: string }>;
}

/**
 * GET /api/accounts/[accountId]
 * Get single account details with recent posts count
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withRouteAuth(params);
    if (isAuthError(authResult)) return authResult;
    const { accountId } = authResult;

    // Get the account
    const [account] = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.id, accountId))
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get posts count
    const [postsCountResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.accountId, accountId));

    return NextResponse.json({
      account: {
        id: account.id,
        username: account.username,
        displayName: account.displayName,
        avatarUrl: proxyImageUrl(account.avatarUrl),
        followerCount: account.followerCount,
        followingCount: account.followingCount,
        likesCount: account.likesCount,
        videoCount: account.videoCount,
        bio: account.bio,
        isVerified: account.isVerified,
        lastSyncedAt: account.lastSyncedAt,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
      postsCount: postsCountResult?.count ?? 0,
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/accounts/[accountId]
 * Disconnect account (soft-delete — preserves posts/comments for reactivation)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withRouteAuth(params);
    if (isAuthError(authResult)) return authResult;
    const { accountId } = authResult;

    // Cancel active sync jobs before deletion
    const activeJobs = await db
      .select({ id: syncJobs.id })
      .from(syncJobs)
      .where(
        and(
          eq(syncJobs.accountId, accountId),
          inArray(syncJobs.status, ["pending", "running"])
        )
      );

    for (const activeJob of activeJobs) {
      try {
        await cancelSyncJob(activeJob.id);
      } catch (cancelError) {
        console.error(`Failed to cancel sync job ${activeJob.id} during account deletion:`, cancelError);
      }
    }

    // Soft-delete: mark as disconnected (preserves posts and comments)
    await db
      .update(tiktokAccounts)
      .set({ status: "disconnected", updatedAt: new Date() })
      .where(eq(tiktokAccounts.id, accountId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
