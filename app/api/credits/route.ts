import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserCredits, getCreditPricing } from "@/lib/services/credit-service";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [balance, pricing] = await Promise.all([
      getUserCredits(userId),
      Promise.resolve(getCreditPricing()),
    ]);

    return NextResponse.json({
      balance,
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
