import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts, posts, syncJobs } from "@/lib/db/schema";
import { eq, and, inArray, count } from "drizzle-orm";
import { cancelSyncJob } from "@/lib/services/sync-service";
import { proxyImageUrl } from "@/lib/image-proxy";

interface RouteParams {
  params: Promise<{ accountId: string }>;
}

/**
 * GET /api/accounts/[accountId]
 * Get single account details with recent posts count
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await params;
    const accountIdNum = parseInt(accountId, 10);

    if (isNaN(accountIdNum)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    // Get the account
    const [account] = await db
      .select()
      .from(tiktokAccounts)
      .where(
        and(
          eq(tiktokAccounts.id, accountIdNum),
          eq(tiktokAccounts.userId, userId)
        )
      )
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get posts count
    const [postsCountResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.accountId, accountIdNum));

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
 * Disconnect account (delete from DB, cascade deletes posts/comments)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await params;
    const accountIdNum = parseInt(accountId, 10);

    if (isNaN(accountIdNum)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    // Verify ownership before deleting
    const [account] = await db
      .select({ id: tiktokAccounts.id })
      .from(tiktokAccounts)
      .where(
        and(
          eq(tiktokAccounts.id, accountIdNum),
          eq(tiktokAccounts.userId, userId)
        )
      )
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Cancel active sync jobs before deletion
    const activeJobs = await db
      .select({ id: syncJobs.id })
      .from(syncJobs)
      .where(
        and(
          eq(syncJobs.accountId, accountIdNum),
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

    // Delete the account (cascade will handle posts and comments)
    await db
      .delete(tiktokAccounts)
      .where(eq(tiktokAccounts.id, accountIdNum));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
