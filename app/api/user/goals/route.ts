import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GOALS } from "@/lib/prompt-catalog";

const validCategoryNames = new Set(GOALS.map((g) => g.categoryName));

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db
      .select({ goals: users.goals })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({ goals: result[0]?.goals ?? [] });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { goals } = body;

    if (!Array.isArray(goals)) {
      return NextResponse.json(
        { error: "goals must be an array" },
        { status: 400 }
      );
    }

    // Validate each goal is a known category name
    const validated = goals.filter(
      (g): g is string => typeof g === "string" && validCategoryNames.has(g)
    );

    await db
      .update(users)
      .set({ goals: validated })
      .where(eq(users.id, userId));

    return NextResponse.json({ goals: validated });
  } catch (error) {
    console.error("Error saving goals:", error);
    return NextResponse.json(
      { error: "Failed to save goals" },
      { status: 500 }
    );
  }
}
