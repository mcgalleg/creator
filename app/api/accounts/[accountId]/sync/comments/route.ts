import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts, syncJobs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  startCommentSync,
  estimateCommentSyncCost,
  CommentSyncConfig,
} from "@/lib/services/sync-service";
import { checkCredits } from "@/lib/services/credit-service";

interface RouteParams {
  params: Promise<{ accountId: string }>;
}

/**
 * POST /api/accounts/[accountId]/sync/comments
 * Trigger a comment-only sync for an account with configurable modes
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

    // Parse body for sync config
    const body = await request.json().catch(() => ({}));
    const { mode, selectedPostIds, topCount, dateRange, maxPerPost, creditBudget } = body;

    // Validate mode
    const validModes = ["selection", "top_performers", "date_range", "budget"];
    if (!mode || !validModes.includes(mode)) {
      return NextResponse.json(
        { error: "Invalid sync mode. Must be one of: selection, top_performers, date_range, budget" },
        { status: 400 }
      );
    }

    // Validate mode-specific requirements
    if (mode === "selection" && (!selectedPostIds || selectedPostIds.length === 0)) {
      return NextResponse.json(
        { error: "selectedPostIds required for selection mode" },
        { status: 400 }
      );
    }

    if (mode === "date_range" && (!dateRange?.start || !dateRange?.end)) {
      return NextResponse.json(
        { error: "dateRange with start and end required for date_range mode" },
        { status: 400 }
      );
    }

    if (mode === "budget" && (!creditBudget || creditBudget <= 0)) {
      return NextResponse.json(
        { error: "creditBudget required for budget mode" },
        { status: 400 }
      );
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

    // Build the config
    const config: CommentSyncConfig = {
      mode,
      maxPerPost: maxPerPost ?? 100,
    };

    switch (mode) {
      case "selection":
        config.selectedPostIds = selectedPostIds;
        break;
      case "top_performers":
        config.topCount = topCount ?? 10;
        break;
      case "date_range":
        config.dateRange = {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end),
        };
        break;
      case "budget":
        config.creditBudget = creditBudget;
        break;
    }

    // Estimate credits based on config
    let estimatedPostCount: number;
    switch (mode) {
      case "selection":
        estimatedPostCount = selectedPostIds.length;
        break;
      case "top_performers":
        estimatedPostCount = topCount ?? 10;
        break;
      case "date_range":
        estimatedPostCount = 20; // Default estimate for date range
        break;
      case "budget":
        const costPerPost = Math.ceil((config.maxPerPost ?? 100) / 100) * 15 + 6;
        estimatedPostCount = Math.floor(creditBudget / costPerPost);
        break;
      default:
        estimatedPostCount = 10;
    }

    const costEstimate = estimateCommentSyncCost({
      postCount: estimatedPostCount,
      commentsPerPost: config.maxPerPost ?? 100,
    });

    // For budget mode, cap at the specified budget
    const creditsToCheck = mode === "budget"
      ? Math.min(costEstimate.credits, creditBudget)
      : costEstimate.credits;

    // Check sufficient credits
    const creditCheck = await checkCredits(userId, creditsToCheck);

    if (!creditCheck.sufficient) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: creditsToCheck,
          balance: creditCheck.balance,
        },
        { status: 402 }
      );
    }

    // Start the comment sync
    const syncResult = await startCommentSync({
      accountId: accountIdNum,
      userId,
      config,
    });

    return NextResponse.json({
      jobId: syncResult.jobId,
      runId: syncResult.runId,
      estimatedCredits: creditsToCheck,
      breakdown: costEstimate.breakdown,
      description: costEstimate.description,
      config: {
        mode,
        postCount: estimatedPostCount,
        maxPerPost: config.maxPerPost,
      },
    });
  } catch (error) {
    console.error("Error starting comment sync:", error);
    const message = error instanceof Error ? error.message : "Failed to start comment sync";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
