import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts, syncJobs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  startProfileSync,
  estimateSyncCost,
  pollSyncStatus,
  getSyncJobStatus,
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
    const { postsLimit = 50, includeComments = false, commentsLimit = 0 } = body;

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

    // Estimate credits
    const costEstimate = estimateSyncCost({
      postsLimit,
      includeComments,
      commentsLimit,
    });

    // Check sufficient credits
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

    // Start the sync
    const syncResult = await startProfileSync({
      accountId: accountIdNum,
      username: account.username,
      postsLimit,
      includeComments,
      commentsLimit,
      userId,
    });

    return NextResponse.json({
      jobId: syncResult.jobId,
      runId: syncResult.runId,
      estimatedCredits: costEstimate.credits,
      breakdown: costEstimate.breakdown,
      description: costEstimate.description,
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
 * Get sync status (poll endpoint)
 * Query params: jobId
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
      // If no jobId, return the most recent job for this account
      const [recentJob] = await db
        .select()
        .from(syncJobs)
        .where(
          and(
            eq(syncJobs.accountId, accountIdNum),
            eq(syncJobs.userId, userId)
          )
        )
        .orderBy(syncJobs.createdAt)
        .limit(1);

      if (!recentJob) {
        return NextResponse.json({ job: null });
      }

      // If the job is still running, poll Apify for status
      if (recentJob.status === "running" && recentJob.apifyRunId) {
        try {
          const apifyStatus = await pollSyncStatus(recentJob.apifyRunId);
          return NextResponse.json({
            job: {
              id: recentJob.id,
              status: recentJob.status,
              type: recentJob.type,
              creditsEstimated: recentJob.creditsEstimated,
              creditsUsed: recentJob.creditsUsed,
              postsCount: recentJob.postsCount,
              commentsCount: recentJob.commentsCount,
              startedAt: recentJob.startedAt,
              completedAt: recentJob.completedAt,
              createdAt: recentJob.createdAt,
            },
            apifyStatus: {
              status: apifyStatus.status,
              startedAt: apifyStatus.startedAt,
              finishedAt: apifyStatus.finishedAt,
            },
          });
        } catch {
          // If we can't poll Apify, just return the job status
        }
      }

      return NextResponse.json({
        job: {
          id: recentJob.id,
          status: recentJob.status,
          type: recentJob.type,
          creditsEstimated: recentJob.creditsEstimated,
          creditsUsed: recentJob.creditsUsed,
          postsCount: recentJob.postsCount,
          commentsCount: recentJob.commentsCount,
          error: recentJob.error,
          startedAt: recentJob.startedAt,
          completedAt: recentJob.completedAt,
          createdAt: recentJob.createdAt,
        },
      });
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
