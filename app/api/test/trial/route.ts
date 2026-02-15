import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Test-only endpoint to manipulate trial state for E2E testing.
 *
 * POST /api/test/trial
 *   { action: "start", userId }      — Set user to active trial (Creator + trialEndsAt in 7 days)
 *   { action: "expire", userId }      — Expire trial (set trialEndsAt to past, keep tier as Pro for cron to pick up)
 *   { action: "reset", userId }       — Reset to pre-trial free state (free tier, clear all trial fields)
 *
 * GET /api/test/trial?userId=...      — Get current trial state
 */

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { action, userId } = await request.json();

  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action required" }, { status: 400 });
  }

  const now = new Date();

  switch (action) {
    case "start": {
      const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await db.update(users).set({
        subscriptionTier: "basic",
        trialEndsAt,
        trialConverted: false,
        subscriptionStartedAt: now,
        creditsResetAt: now,
        subscriptionExpiresAt: null,
        updatedAt: now,
      }).where(eq(users.id, userId));
      return NextResponse.json({ success: true, action, userId, trialEndsAt });
    }

    case "expire": {
      const pastDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      await db.update(users).set({
        trialEndsAt: pastDate,
        updatedAt: now,
        // Keep subscriptionTier as "basic" — the cron/expireTrial will downgrade it
      }).where(eq(users.id, userId));
      return NextResponse.json({ success: true, action, userId, trialEndsAt: pastDate });
    }

    case "expire-and-downgrade": {
      // Immediately expire AND downgrade (simulates what the cron does)
      const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
      await db.update(users).set({
        subscriptionTier: "free",
        trialEndsAt: pastDate,
        trialConverted: false,
        subscriptionStartedAt: null,
        subscriptionExpiresAt: null,
        creditsResetAt: null,
        updatedAt: now,
      }).where(eq(users.id, userId));
      return NextResponse.json({ success: true, action, userId });
    }

    case "reset": {
      await db.update(users).set({
        subscriptionTier: "free",
        trialEndsAt: null,
        trialConverted: false,
        subscriptionStartedAt: null,
        subscriptionExpiresAt: null,
        creditsResetAt: null,
        updatedAt: now,
      }).where(eq(users.id, userId));
      return NextResponse.json({ success: true, action, userId });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId query param required" }, { status: 400 });
  }

  const result = await db
    .select({
      subscriptionTier: users.subscriptionTier,
      trialEndsAt: users.trialEndsAt,
      trialConverted: users.trialConverted,
      subscriptionStartedAt: users.subscriptionStartedAt,
      subscriptionExpiresAt: users.subscriptionExpiresAt,
      creditBalance: users.creditBalance,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = result[0];
  const isOnTrial = user.trialEndsAt && !user.trialConverted && new Date() < user.trialEndsAt;
  const daysRemaining = isOnTrial && user.trialEndsAt
    ? Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : 0;

  return NextResponse.json({
    ...user,
    isOnTrial,
    daysRemaining,
  });
}
