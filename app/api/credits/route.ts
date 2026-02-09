import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getUserCredits, getCreditPricing } from "@/lib/services/credit-service";
import { ensureUserExists } from "@/lib/services/user-service";
import { getPolarMeterBalances } from "@/lib/polar";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserExists(userId);

    const [balance, pricing, meterBalances] = await Promise.all([
      getUserCredits(userId),
      Promise.resolve(getCreditPricing()),
      getPolarMeterBalances(userId).catch(() => null),
    ]);

    return NextResponse.json({
      balance,
      aiTokens: meterBalances?.aiTokens ?? null,
      pricing,
    });
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
