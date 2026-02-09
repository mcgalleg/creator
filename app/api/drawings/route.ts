import { auth, hasFeature } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { drawings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/drawings
 * List all drawings for the authenticated user
 * Auto-creates a default drawing if user has none
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check feature access via Clerk has() (DB fallback in bypass mode)
    const canDraw = await hasFeature("canvas");
    if (!canDraw) {
      return NextResponse.json(
        { error: "Feature not available on your plan" },
        { status: 403 }
      );
    }

    let userDrawings = await db
      .select()
      .from(drawings)
      .where(eq(drawings.userId, userId))
      .orderBy(desc(drawings.createdAt));

    // If user has no drawings, auto-create a default one
    if (userDrawings.length === 0) {
      const [defaultDrawing] = await db
        .insert(drawings)
        .values({
          userId,
          name: "My Drawing",
          isDefault: true,
          elements: [],
          appState: { viewBackgroundColor: "#ffffff", zoom: 1, scrollX: 0, scrollY: 0 },
        })
        .returning();

      userDrawings = [defaultDrawing];
    }

    return NextResponse.json({ drawings: userDrawings });
  } catch (error) {
    console.error("Error fetching drawings:", error);
    return NextResponse.json(
      { error: "Failed to fetch drawings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drawings
 * Create a new drawing
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check feature access via Clerk has() (DB fallback in bypass mode)
    const canDraw = await hasFeature("canvas");
    if (!canDraw) {
      return NextResponse.json(
        { error: "Feature not available on your plan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "name is required and must be a string" },
        { status: 400 }
      );
    }

    if (name.trim().length === 0) {
      return NextResponse.json(
        { error: "name cannot be empty" },
        { status: 400 }
      );
    }

    const [drawing] = await db
      .insert(drawings)
      .values({
        userId,
        name: name.trim(),
        isDefault: false,
        elements: [],
        appState: { viewBackgroundColor: "#ffffff", zoom: 1, scrollX: 0, scrollY: 0 },
      })
      .returning();

    return NextResponse.json({ drawing });
  } catch (error) {
    console.error("Error creating drawing:", error);
    return NextResponse.json(
      { error: "Failed to create drawing" },
      { status: 500 }
    );
  }
}
