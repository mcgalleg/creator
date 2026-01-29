import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateUsername, estimateSyncCost, startProfileSync } from "@/lib/services/sync-service";
import { checkCredits } from "@/lib/services/credit-service";
import { ensureUserExists } from "@/lib/services/user-service";

/**
 * GET /api/accounts
 * List all TikTok accounts for the current user
 */
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
        bio: tiktokAccounts.bio,
        isVerified: tiktokAccounts.isVerified,
        lastSyncedAt: tiktokAccounts.lastSyncedAt,
        createdAt: tiktokAccounts.createdAt,
      })
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.userId, userId))
      .orderBy(tiktokAccounts.createdAt);

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounts
 * Connect a new TikTok account
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username, triggerSync = false, postsLimit = 50, includeComments = false } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Clean the username (remove @ if present)
    const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();

    if (!cleanUsername) {
      return NextResponse.json(
        { error: "Invalid username" },
        { status: 400 }
      );
    }

    // Check if account already exists for this user
    const existingAccount = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.userId, userId))
      .limit(100);

    const alreadyConnected = existingAccount.find(
      (acc) => acc.username.toLowerCase() === cleanUsername
    );

    if (alreadyConnected) {
      return NextResponse.json(
        { error: "This account is already connected" },
        { status: 409 }
      );
    }

    // Validate the username exists on TikTok
    const validation = await validateUsername(cleanUsername);

    if (!validation.valid || !validation.profile) {
      return NextResponse.json(
        { error: validation.error || "Username not found on TikTok" },
        { status: 404 }
      );
    }

    // If triggering sync, check credits first
    if (triggerSync) {
      const costEstimate = estimateSyncCost({ postsLimit, includeComments });
      const creditCheck = await checkCredits(userId, costEstimate.credits);

      if (!creditCheck.sufficient) {
        return NextResponse.json(
          {
            error: "Insufficient credits",
            required: costEstimate.credits,
            balance: creditCheck.balance,
          },
          { status: 402 }
        );
      }
    }

    // Create the account record
    const [account] = await db
      .insert(tiktokAccounts)
      .values({
        userId,
        username: validation.profile.username,
        displayName: validation.profile.displayName,
        avatarUrl: validation.profile.avatarUrl,
        followerCount: validation.profile.followerCount,
        followingCount: validation.profile.followingCount,
        likesCount: validation.profile.likesCount,
        videoCount: validation.profile.videoCount,
        bio: validation.profile.bio,
        isVerified: validation.profile.isVerified,
        lastSyncedAt: new Date(), // Initial sync from validation
      })
      .returning();

    // Optionally trigger initial sync
    let syncJob = null;
    if (triggerSync) {
      try {
        syncJob = await startProfileSync({
          accountId: account.id,
          username: account.username,
          postsLimit,
          includeComments,
          userId,
        });
      } catch (syncError) {
        console.error("Failed to start initial sync:", syncError);
        // Don't fail the account creation, just log the error
      }
    }

    return NextResponse.json({
      account: {
        id: account.id,
        username: account.username,
        displayName: account.displayName,
        avatarUrl: account.avatarUrl,
        followerCount: account.followerCount,
        followingCount: account.followingCount,
        likesCount: account.likesCount,
        videoCount: account.videoCount,
        bio: account.bio,
        isVerified: account.isVerified,
        lastSyncedAt: account.lastSyncedAt,
        createdAt: account.createdAt,
      },
      syncJob,
      profile: validation.profile,
    });
  } catch (error) {
    console.error("Error connecting account:", error);
    return NextResponse.json(
      { error: "Failed to connect account" },
      { status: 500 }
    );
  }
}
