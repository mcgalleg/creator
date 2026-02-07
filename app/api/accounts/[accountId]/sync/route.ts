import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts, syncJobs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  startSync,
  getSyncJobStatus,
  getAccountSyncData,
  estimateSyncCost,
} from "@/lib/services/sync-service";
import { checkCredits } from "@/lib/services/credit-service";

interface RouteParams {
  params: Promise<{ accountId: string }>;
}

/**
 * POST /api/accounts/[accountId]/sync
 * Trigger sync for an account
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Verify ownership
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

    // Parse body for sync options
    const body = await request.json().catch(() => ({}));
    const {
      postsLimit: rawPostsLimit = 50,
      includeComments = false,
      sorting,
      oldestPostDate,
      newestPostDate,
    } = body;

    // Ensure postsLimit is a positive integer
    const postsLimit = Math.max(1, Math.min(500, Math.floor(Number(rawPostsLimit) || 50)));

    // Validate sorting parameter
    const validSortingValues = ["latest", "popular", "oldest"] as const;
    if (sorting !== undefined && !validSortingValues.includes(sorting)) {
      return NextResponse.json(
        { error: "Invalid sorting value. Must be one of: latest, popular, oldest" },
        { status: 400 }
      );
    }

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

    // Check if there's already a running sync for this account
    const [runningJob] = await db
      .select()
      .from(syncJobs)
      .where(
        and(
          eq(syncJobs.accountId, accountIdNum),
          eq(syncJobs.status, "running")
        )
      )
      .limit(1);

    if (runningJob) {
      return NextResponse.json(
        {
          error: "A sync is already in progress for this account",
          jobId: runningJob.id,
          runId: runningJob.apifyRunId,
        },
        { status: 409 }
      );
    }

    // Pre-check credit balance before starting sync
    const estimate = estimateSyncCost({
      postsLimit,
      includeComments,
      commentsLimit: includeComments ? postsLimit * 100 : 0,
    });

    const creditCheck = await checkCredits(userId, estimate.credits);
    if (!creditCheck.sufficient) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          balance: creditCheck.balance,
          required: creditCheck.required,
        },
        { status: 402 }
      );
    }

    // Start the sync (credit estimation + hold happens inside startSync)
    const syncResult = await startSync({
      accountId: accountIdNum,
      userId,
      type: includeComments ? "full" : "posts",
      config: {
        postsLimit,
        sorting,
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await params;
    const accountIdNum = parseInt(accountId, 10);

    if (isNaN(accountIdNum)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    // Get jobId from query params
    const { searchParams } = new URL(request.url);
    const jobIdParam = searchParams.get("jobId");

    if (!jobIdParam) {
      // No jobId — return unified sync data for this account
      const syncData = await getAccountSyncData(accountIdNum, userId);
      return NextResponse.json(syncData);
    }

    // Get specific job by ID
    const jobId = parseInt(jobIdParam, 10);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const jobStatus = await getSyncJobStatus(jobId);

    // Verify the job belongs to this account and user
    if (jobStatus.job.accountId !== accountIdNum || jobStatus.job.userId !== userId) {
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
