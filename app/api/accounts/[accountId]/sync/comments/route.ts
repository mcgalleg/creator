import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts, syncJobs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  startSync,
  calculateEstimate,
} from "@/lib/services/sync-service";
import type { SyncConfigSchema } from "@/lib/db/schema/sync-jobs";
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

    // Build the unified sync config
    const syncConfig: SyncConfigSchema = {
      commentMode: mode,
      maxCommentsPerPost: maxPerPost ?? 100,
    };

    switch (mode) {
      case "selection":
        syncConfig.selectedPostIds = selectedPostIds;
        break;
      case "top_performers":
        syncConfig.topCount = topCount ?? 10;
        break;
      case "date_range":
        syncConfig.dateRange = {
          start: dateRange.start,
          end: dateRange.end,
        };
        break;
      case "budget":
        syncConfig.creditBudget = creditBudget;
        break;
    }

    // Estimate credits using the shared estimation logic (queries actual comment counts from DB)
    const costEstimate = await calculateEstimate("comments", syncConfig, accountIdNum);

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

    // Start the comment sync via unified pipeline
    const syncResult = await startSync({
      accountId: accountIdNum,
      userId,
      type: "comments",
      config: syncConfig,
    });

    return NextResponse.json({
      jobId: syncResult.jobId,
      creditsHeld: syncResult.creditsHeld,
      estimatedCredits: creditsToCheck,
      breakdown: costEstimate.breakdown,
      description: costEstimate.description,
      config: {
        mode,
        maxPerPost: syncConfig.maxCommentsPerPost,
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
