import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, tiktokAccounts, creditTransactions, syncJobs } from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  // Guard: only available in non-production with BYPASS_AUTH
  if (process.env.NODE_ENV === "production" || process.env.BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId query param required" }, { status: 400 });
  }

  // Fetch user balance
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { creditBalance: true, carryoverAiTokens: true, carryoverSyncCredits: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch accounts
  const accounts = await db.query.tiktokAccounts.findMany({
    where: eq(tiktokAccounts.userId, userId),
  });

  // Fetch recent transactions
  const recentTransactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(50);

  // Fetch active sync jobs across all user's accounts
  const accountIds = accounts.map((a) => a.id);
  const activeSyncJobs = accountIds.length > 0
    ? await db
        .select()
        .from(syncJobs)
        .where(
          and(
            inArray(syncJobs.accountId, accountIds),
            inArray(syncJobs.status, ["pending", "running"])
          )
        )
    : [];

  return NextResponse.json({
    balance: user.creditBalance,
    accounts,
    recentTransactions,
    activeSyncJobs,
  });
}
