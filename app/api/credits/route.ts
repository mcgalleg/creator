import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getUserCredits, getCreditPricing, syncCreditBalance } from "@/lib/services/credit-service";
import { ensureUserExists } from "@/lib/services/user-service";
import { getPolarMeterBalances } from "@/lib/polar";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserExists(userId);

    const pricing = getCreditPricing();

    // Primary: read from Polar (source of truth)
    try {
      const meterBalances = await getPolarMeterBalances(userId);

      // Fire-and-forget: update local DB cache
      syncCreditBalance(userId).catch((err) =>
        console.error("Background cache sync failed:", err)
      );

      return NextResponse.json({
        balance: meterBalances.syncCredits,
        aiTokens: meterBalances.aiTokens,
        pricing,
      });
    } catch (polarError) {
      // Fallback: read from local DB cache if Polar is unreachable
      console.warn("Polar unreachable, falling back to local DB cache:", polarError);

      const balance = await getUserCredits(userId);

      return NextResponse.json({
        balance,
        aiTokens: null,
        pricing,
      });
    }
  } catch (error) {
    console.error("Error fetching credits:", error);

    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }
}
