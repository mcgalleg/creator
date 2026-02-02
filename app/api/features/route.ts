import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getUserFeatures, getUserTier } from "@/lib/services/feature-service";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [tier, features] = await Promise.all([
      getUserTier(userId),
      getUserFeatures(userId),
    ]);

    return NextResponse.json({
      tier,
      features,
    });
  } catch (error) {
    console.error("Error fetching features:", error);

    return NextResponse.json(
      { error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}
