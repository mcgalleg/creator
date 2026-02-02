import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await db
      .select({
        id: tiktokAccounts.id,
        username: tiktokAccounts.username,
        displayName: tiktokAccounts.displayName,
        avatarUrl: tiktokAccounts.avatarUrl,
        followerCount: tiktokAccounts.followerCount,
        followingCount: tiktokAccounts.followingCount,
        likesCount: tiktokAccounts.likesCount,
        videoCount: tiktokAccounts.videoCount,
        isVerified: tiktokAccounts.isVerified,
        lastSyncedAt: tiktokAccounts.lastSyncedAt,
        createdAt: tiktokAccounts.createdAt,
      })
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.userId, userId))
      .orderBy(tiktokAccounts.createdAt);

    return NextResponse.json({
      accounts,
      count: accounts.length,
    });
  } catch (error) {
    console.error("Error fetching TikTok accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
