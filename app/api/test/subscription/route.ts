import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cancelSubscription } from "@/lib/services/subscription-service";
import { TIER_SYNC_CREDITS } from "@/lib/subscriptions";
import type { SubscriptionTier } from "@/lib/subscriptions";

function guard() {
  if (process.env.NODE_ENV === "production" || process.env.BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId query param required" }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      subscriptionTier: true,
      subscriptionStartedAt: true,
      subscriptionExpiresAt: true,
      dataPurgeAt: true,
      creditBalance: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function POST(request: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const body = await request.json();
  const { userId, action, tier } = body as {
    userId?: string;
    action?: string;
    tier?: SubscriptionTier;
  };

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  if (!action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const now = new Date();

  switch (action) {
    case "set-tier": {
      if (!tier || !["free", "basic", "pro", "agency", "mcp"].includes(tier)) {
        return NextResponse.json({ error: "Valid tier required" }, { status: 400 });
      }
      const creditBalance = TIER_SYNC_CREDITS[tier];
      await db.update(users)
        .set({
          subscriptionTier: tier,
          subscriptionStartedAt: now,
          subscriptionExpiresAt: null,
          dataPurgeAt: null,
          creditBalance,
          updatedAt: now,
        })
        .where(eq(users.id, userId));

      return NextResponse.json({ success: true, userId, tier, creditBalance });
    }

    case "cancel": {
      await cancelSubscription(userId, now);
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { subscriptionExpiresAt: true, dataPurgeAt: true },
      });
      return NextResponse.json({ success: true, userId, ...user });
    }

    case "schedule-purge": {
      const purgeAt = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      await db.update(users)
        .set({ dataPurgeAt: purgeAt, updatedAt: now })
        .where(eq(users.id, userId));
      return NextResponse.json({ success: true, userId, dataPurgeAt: purgeAt });
    }

    case "reset": {
      await db.update(users)
        .set({
          subscriptionTier: "free",
          subscriptionStartedAt: null,
          subscriptionExpiresAt: null,
          creditsResetAt: null,
          dataPurgeAt: null,
          creditBalance: TIER_SYNC_CREDITS.free,
          updatedAt: now,
        })
        .where(eq(users.id, userId));
      return NextResponse.json({ success: true, userId, tier: "free", creditBalance: TIER_SYNC_CREDITS.free });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
