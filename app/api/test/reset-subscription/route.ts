import { NextRequest, NextResponse } from "next/server";
import { endSubscription } from "@/lib/services/subscription-service";

export async function POST(request: NextRequest) {
  // Guard: only available in non-production
  if (process.env.NODE_ENV === "production" || process.env.BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await endSubscription(userId);
  return NextResponse.json({ success: true, userId });
}
