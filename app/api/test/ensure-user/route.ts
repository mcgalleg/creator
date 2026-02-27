import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { userId, email, name } = await request.json();

  if (!userId || !email) {
    return NextResponse.json({ error: "userId and email required" }, { status: 400 });
  }

  await db
    .insert(users)
    .values({
      id: userId,
      email,
      name: name ?? "Test User",
      onboardingCompletedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { name: name ?? "Test User", updatedAt: new Date() },
    });

  return NextResponse.json({ success: true, userId });
}
