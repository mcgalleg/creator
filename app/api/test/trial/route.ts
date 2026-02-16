import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { STARTER_EXPIRY_DAYS } from "@/lib/services/trial-service";

/**
 * Test-only endpoint to manipulate starter state for E2E testing.
 *
 * POST /api/test/trial
 *   { action: "start", userId }      — Set user to active starter (Creator + starterExpiresAt in 30 days)
 *   { action: "expire", userId }      — Expire starter (set starterExpiresAt to past, keep tier for cron to pick up)
 *   { action: "reset", userId }       — Reset to pre-starter free state
 *
 * GET /api/test/trial?userId=...      — Get current starter state
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
      const starterExpiresAt = new Date(now.getTime() + STARTER_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      await db.update(users).set({
        subscriptionTier: "basic",
        starterExpiresAt,
        subscriptionStartedAt: null,
        creditsResetAt: null,
        subscriptionExpiresAt: null,
        updatedAt: now,
      }).where(eq(users.id, userId));
      return NextResponse.json({ success: true, action, userId, starterExpiresAt });
    }

    case "expire": {
      const pastDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      await db.update(users).set({
        starterExpiresAt: pastDate,
        updatedAt: now,
      }).where(eq(users.id, userId));
      return NextResponse.json({ success: true, action, userId, starterExpiresAt: pastDate });
    }

    case "expire-and-downgrade": {
      const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
      await db.update(users).set({
        subscriptionTier: "free",
        starterExpiresAt: pastDate,
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
        starterExpiresAt: null,
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
      starterExpiresAt: users.starterExpiresAt,
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
  const isOnStarter = user.starterExpiresAt && !user.subscriptionStartedAt && new Date() < user.starterExpiresAt;
  const daysRemaining = isOnStarter && user.starterExpiresAt
    ? Math.ceil((user.starterExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : 0;

  return NextResponse.json({
    ...user,
    isOnStarter,
    daysRemaining,
  });
}
