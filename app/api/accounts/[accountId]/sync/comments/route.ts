import { NextRequest, NextResponse } from "next/server";
import {
  startSync,
  calculateEstimate,
} from "@/lib/services/sync-service";
import type { SyncConfigSchema } from "@/lib/db/schema/sync-jobs";
import { checkCredits } from "@/lib/services/credit-service";
import { withRouteAuth, isAuthError, assertNoRunningSync } from "@/lib/dashboard-utils";

interface RouteParams {
  params: Promise<{ accountId: string }>;
}

/**
 * POST /api/accounts/[accountId]/sync/comments
 * Trigger a comment-only sync for an account with configurable modes
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withRouteAuth(params);
    if (isAuthError(authResult)) return authResult;
    const { userId, accountId } = authResult;

    // Parse body for sync config
    const body = await request.json().catch(() => ({}));
    const { mode, selectedPostIds, topCount, dateRange, maxPerPost } = body;

    // Validate mode
    const validModes = ["selection", "top_performers", "date_range"];
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

    // Check for existing running sync
    const syncConflict = await assertNoRunningSync(accountId);
    if (syncConflict) return syncConflict;

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
    }

    // Estimate credits using the shared estimation logic (queries actual comment counts from DB)
    const costEstimate = await calculateEstimate("comments", syncConfig, accountId);

    const creditsToCheck = costEstimate.credits;

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
      accountId,
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
