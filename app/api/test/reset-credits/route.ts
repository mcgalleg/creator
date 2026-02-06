import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, creditTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  // Guard: only available in non-production with BYPASS_AUTH
  if (process.env.NODE_ENV === "production" || process.env.BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { userId, balance } = await request.json();

  if (!userId || balance === undefined) {
    return NextResponse.json({ error: "userId and balance required" }, { status: 400 });
  }

  // Reset credit balance
  await db.update(users).set({ creditBalance: balance }).where(eq(users.id, userId));

  // Clear all credit transactions for this user
  const deleted = await db
    .delete(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .returning({ id: creditTransactions.id });

  return NextResponse.json({
    userId,
    balance,
    transactionsCleared: deleted.length,
  });
}
