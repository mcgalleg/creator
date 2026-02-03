import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateUsername, estimateSyncCost, startSync } from "@/lib/services/sync-service";
import { checkCredits } from "@/lib/services/credit-service";

// Type for import options
type ImportOption = "profile_only" | "profile_posts" | "profile_posts_comments";

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
 *
 * Supports three import options:
 * - profile_only: FREE - Just stores the account reference (uses cached profile from preview)
 * - profile_posts: Creates account and triggers post sync (25 credits)
 * - profile_posts_comments: Creates account and triggers full sync with comments (40+ credits)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      username,
      importOption = "profile_only" as ImportOption,
      // Legacy parameters for backwards compatibility
      triggerSync = false,
      postsLimit = 50,
      includeComments = false,
      // Note: cachedProfile could be used in the future to skip re-validation
    // for profile_only imports, but for now we always validate for security
    } = body;

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

    // Determine sync behavior based on importOption or legacy triggerSync
    const shouldSync = importOption === "profile_posts" || importOption === "profile_posts_comments" || triggerSync;
    const shouldIncludeComments = importOption === "profile_posts_comments" || includeComments;

    // Validate the username exists on TikTok
    // Note: This will always call Apify to validate the profile, but the preview
    // endpoint likely already did this. The cost is minimal since we request only 1 result.
    const validation = await validateUsername(cleanUsername);

    if (!validation.valid || !validation.profile) {
      return NextResponse.json(
        { error: validation.error || "Username not found on TikTok" },
        { status: 404 }
      );
    }

    // If triggering sync, check credits first
    if (shouldSync) {
      const costEstimate = estimateSyncCost({
        postsLimit,
        includeComments: shouldIncludeComments,
      });
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
    let syncError: string | null = null;
    if (shouldSync) {
      try {
        syncJob = await startSync({
          accountId: account.id,
          userId,
          type: shouldIncludeComments ? "full" : "posts",
          config: {
            postsLimit,
          },
        });
      } catch (err) {
        console.error("Failed to start initial sync:", err);
        // Don't fail the account creation, but include the error in the response
        syncError = err instanceof Error ? err.message : "Failed to start sync";
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
      syncError, // Include any sync error so frontend can display it
      profile: validation.profile,
      importOption,
    });
  } catch (error) {
    console.error("Error connecting account:", error);

    // Get detailed error info - PostgreSQL errors from Drizzle/Neon may have different shapes
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorObj = error as Record<string, unknown>;
    const errorCode = errorObj?.code ?? errorObj?.constraint ?? "";
    const errorString = JSON.stringify(error);

    // Check for unique constraint violation (duplicate account)
    // PostgreSQL error code 23505 = unique_violation
    if (
      errorMessage.includes("unique") ||
      errorMessage.includes("duplicate") ||
      errorMessage.includes("tiktok_accounts_user_username_idx") ||
      errorString.includes("23505") ||
      errorString.includes("unique") ||
      errorCode === "23505"
    ) {
      return NextResponse.json(
        { error: "This account is already connected" },
        { status: 409 }
      );
    }

    // Return more specific error message for debugging
    return NextResponse.json(
      { error: errorMessage || "Failed to connect account" },
      { status: 500 }
    );
  }
}
