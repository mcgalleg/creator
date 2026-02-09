import { auth, hasFeature, FEATURES } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getUserTier } from "@/lib/services/feature-service";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [tier, canvas, analyticsAssistant] = await Promise.all([
      getUserTier(userId),
      hasFeature(FEATURES.CANVAS),
      hasFeature(FEATURES.ANALYTICS_ASSISTANT),
    ]);

    return NextResponse.json({
      tier,
      features: {
        canvas,
        analytics_assistant: analyticsAssistant,
      },
    });
  } catch (error) {
    console.error("Error fetching features:", error);

    return NextResponse.json(
      { error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}
