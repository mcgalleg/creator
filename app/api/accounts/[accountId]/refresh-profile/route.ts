import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts, accountMetricsHistory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateUsername } from "@/lib/services/sync-service";

/**
 * POST /api/accounts/[accountId]/refresh-profile
 * Refresh profile data for a TikTok account (FREE - no credits charged)
 *
 * This endpoint fetches the latest profile data from TikTok and updates
 * the stored profile information (followers, likes, video count, etc.)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { userId } = await auth();
    const { accountId: accountIdStr } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = parseInt(accountIdStr, 10);
    if (isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    // Get the account (active only)
    const [account] = await db
      .select()
      .from(tiktokAccounts)
      .where(
        and(
          eq(tiktokAccounts.id, accountId),
          eq(tiktokAccounts.userId, userId),
          eq(tiktokAccounts.status, "active")
        )
      );

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Fetch fresh profile data from TikTok
    const validation = await validateUsername(account.username);

    if (!validation.valid || !validation.profile) {
      return NextResponse.json(
        { error: validation.error || "Failed to fetch profile data" },
        { status: 500 }
      );
    }

    const profile = validation.profile;

    // Update the account with fresh profile data
    await db
      .update(tiktokAccounts)
      .set({
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
        likesCount: profile.likesCount,
        videoCount: profile.videoCount,
        bio: profile.bio,
        isVerified: profile.isVerified,
        bioUrl: profile.bioUrl ?? null,
        profileCategory: profile.profileCategory ?? null,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tiktokAccounts.id, accountId));

    // Record metrics snapshot for historical tracking
    await db.insert(accountMetricsHistory).values({
      accountId,
      followerCount: profile.followerCount,
      followingCount: profile.followingCount,
      likesCount: profile.likesCount,
      videoCount: profile.videoCount,
      recordedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      profile: {
        username: profile.username,
        displayName: profile.displayName,
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
        likesCount: profile.likesCount,
        videoCount: profile.videoCount,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        isVerified: profile.isVerified,
        bioUrl: profile.bioUrl,
        profileCategory: profile.profileCategory,
      },
    });
  } catch (error) {
    console.error("Error refreshing profile:", error);
    return NextResponse.json(
      { error: "Failed to refresh profile" },
      { status: 500 }
    );
  }
}
