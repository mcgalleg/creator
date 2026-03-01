import { NextRequest, NextResponse } from "next/server";
import { endSubscription } from "@/lib/services/subscription-service";
import { testRouteGuard } from "@/lib/test-guard";

export async function POST(request: NextRequest) {
  const blocked = testRouteGuard();
  if (blocked) return blocked;

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await endSubscription(userId);
  return NextResponse.json({ success: true, userId });
}
