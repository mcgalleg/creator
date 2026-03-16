import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { testRouteGuard } from "@/lib/test-guard";

export async function POST(request: NextRequest) {
  const blocked = testRouteGuard();
  if (blocked) return blocked;

  const { userId, email, name, skipOnboarding } = await request.json();

  if (!userId || !email) {
    return NextResponse.json({ error: "userId and email required" }, { status: 400 });
  }

  const onboardingCompletedAt = skipOnboarding ? null : new Date();

  await db
    .insert(users)
    .values({
      id: userId,
      email,
      name: name ?? "Test User",
      onboardingCompletedAt,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { name: name ?? "Test User", onboardingCompletedAt, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true, userId });
}
