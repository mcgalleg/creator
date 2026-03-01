import { NextRequest, NextResponse } from "next/server";
import {
  startSync,
  getSyncJobStatus,
  getAccountSyncData,
} from "@/lib/services/sync-service";
import { syncLimiter } from "@/lib/rate-limit";
import { withRouteAuth, isAuthError, assertNoRunningSync } from "@/lib/dashboard-utils";

interface RouteParams {
  params: Promise<{ accountId: string }>;
}

/**
 * POST /api/accounts/[accountId]/sync
 * Trigger sync for an account
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withRouteAuth(params);
    if (isAuthError(authResult)) return authResult;
    const { userId, accountId } = authResult;

    // Rate limit
    const { limited } = syncLimiter.check(userId);
    if (limited) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    // Parse body for sync options
    const body = await request.json().catch(() => ({}));
    const {
      postsLimit: rawPostsLimit = 50,
      includeComments = false,
      maxCommentsPerPost: rawMaxCommentsPerPost,
      oldestPostDate,
      newestPostDate,
    } = body;

    // Ensure postsLimit is a positive integer
    const postsLimit = Math.max(1, Math.min(500, Math.floor(Number(rawPostsLimit) || 50)));

    // Sanitize maxCommentsPerPost (if provided, must be a reasonable positive integer)
    const maxCommentsPerPost = rawMaxCommentsPerPost
      ? Math.max(1, Math.min(500, Math.floor(Number(rawMaxCommentsPerPost))))
      : undefined;

    // Validate date parameters (if provided, must be valid ISO date strings)
    if (oldestPostDate !== undefined) {
      const date = new Date(oldestPostDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Invalid oldestPostDate. Must be a valid ISO date string" },
          { status: 400 }
        );
      }
    }

    if (newestPostDate !== undefined) {
      const date = new Date(newestPostDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Invalid newestPostDate. Must be a valid ISO date string" },
          { status: 400 }
        );
      }
    }

    // Check for existing running sync
    const syncConflict = await assertNoRunningSync(accountId);
    if (syncConflict) return syncConflict;

    // Start the sync (credit estimation + hold happens inside startSync)
    const syncResult = await startSync({
      accountId,
      userId,
      type: includeComments ? "full" : "posts",
      config: {
        postsLimit,
        maxCommentsPerPost,
        oldestPostDate,
        newestPostDate,
      },
    });

    return NextResponse.json({
      jobId: syncResult.jobId,
      creditsHeld: syncResult.creditsHeld,
    });
  } catch (error) {
    console.error("Error starting sync:", error);
    return NextResponse.json(
      { error: "Failed to start sync" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/accounts/[accountId]/sync
 * Get sync data for an account, or status for a specific job.
 * Query params: jobId (optional)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withRouteAuth(params);
    if (isAuthError(authResult)) return authResult;
    const { userId, accountId } = authResult;

    // Get jobId from query params
    const { searchParams } = new URL(request.url);
    const jobIdParam = searchParams.get("jobId");

    if (!jobIdParam) {
      // No jobId — return unified sync data for this account
      const syncData = await getAccountSyncData(accountId, userId);
      return NextResponse.json(syncData);
    }

    // Get specific job by ID
    const jobId = parseInt(jobIdParam, 10);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const jobStatus = await getSyncJobStatus(jobId);

    // Verify the job belongs to this account and user
    if (jobStatus.job.accountId !== accountId || jobStatus.job.userId !== userId) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      job: {
        id: jobStatus.job.id,
        status: jobStatus.job.status,
        type: jobStatus.job.type,
        creditsEstimated: jobStatus.job.creditsEstimated,
        creditsUsed: jobStatus.job.creditsUsed,
        postsCount: jobStatus.job.postsCount,
        commentsCount: jobStatus.job.commentsCount,
        commentsEstimated: jobStatus.job.commentsEstimated,
        newPostsCount: jobStatus.job.newPostsCount,
        updatedPostsCount: jobStatus.job.updatedPostsCount,
        newCommentsCount: jobStatus.job.newCommentsCount,
        updatedCommentsCount: jobStatus.job.updatedCommentsCount,
        error: jobStatus.job.error,
        startedAt: jobStatus.job.startedAt,
        completedAt: jobStatus.job.completedAt,
        createdAt: jobStatus.job.createdAt,
      },
      apifyStatus: jobStatus.apifyStatus
        ? {
            status: jobStatus.apifyStatus.status,
            startedAt: jobStatus.apifyStatus.startedAt,
            finishedAt: jobStatus.apifyStatus.finishedAt,
          }
        : undefined,
    });
  } catch (error) {
    console.error("Error fetching sync status:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to fetch sync status" },
      { status: 500 }
    );
  }
}
