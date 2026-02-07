import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tiktokAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type Period = "7d" | "30d" | "90d";

export const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function isValidPeriod(value: string): value is Period {
  return value in PERIOD_DAYS;
}

/**
 * Canonical engagement rate formula.
 * Includes saves per business decision.
 */
export function calculateEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  saves: number,
  plays: number
): number {
  if (plays === 0) return 0;
  return Number((((likes + comments + shares + saves) / plays) * 100).toFixed(2));
}

/**
 * Escape special characters for safe LIKE/ILIKE queries.
 */
export function escapeLikePattern(pattern: string): string {
  return pattern.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

interface AccountAuthResult {
  userId: string;
  accountId: number;
  period: Period;
}

interface WithAccountAuthOptions {
  requirePeriod?: boolean;
}

/**
 * Shared auth + account ownership check for dashboard routes.
 * Returns validated data or an error NextResponse.
 */
export async function withAccountAuth(
  request: NextRequest,
  options?: WithAccountAuthOptions
): Promise<AccountAuthResult | NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const accountIdParam = searchParams.get("accountId");

  if (!accountIdParam) {
    return NextResponse.json(
      { error: "accountId is required" },
      { status: 400 }
    );
  }

  const accountId = parseInt(accountIdParam, 10);
  if (isNaN(accountId)) {
    return NextResponse.json(
      { error: "Invalid accountId" },
      { status: 400 }
    );
  }

  // Validate period
  const periodParam = searchParams.get("period") || "30d";
  if (options?.requirePeriod !== false && !isValidPeriod(periodParam)) {
    return NextResponse.json(
      { error: "Invalid period. Must be one of: 7d, 30d, 90d" },
      { status: 400 }
    );
  }
  const period = isValidPeriod(periodParam) ? periodParam : "30d" as Period;

  // Verify account ownership
  const [account] = await db
    .select({ id: tiktokAccounts.id })
    .from(tiktokAccounts)
    .where(
      and(
        eq(tiktokAccounts.id, accountId),
        eq(tiktokAccounts.userId, userId)
      )
    )
    .limit(1);

  if (!account) {
    return NextResponse.json(
      { error: "Account not found" },
      { status: 404 }
    );
  }

  return { userId, accountId, period };
}

/**
 * Type guard to check if the result is an error response.
 */
export function isAuthError(result: AccountAuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
