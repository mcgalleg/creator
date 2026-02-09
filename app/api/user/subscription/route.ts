import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db
      .select({
        subscriptionTier: users.subscriptionTier,
        subscriptionStartedAt: users.subscriptionStartedAt,
        subscriptionExpiresAt: users.subscriptionExpiresAt,
        creditsResetAt: users.creditsResetAt,
        trialEndsAt: users.trialEndsAt,
        trialConverted: users.trialConverted,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({
        subscriptionTier: "free",
        subscriptionStartedAt: null,
        subscriptionExpiresAt: null,
        creditsResetAt: null,
        trialEndsAt: null,
        trialConverted: false,
      });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
