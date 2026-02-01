import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canvases } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/canvases
 * List all canvases for the authenticated user
 * Auto-creates a default canvas if user has none
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all canvases for the user
    let userCanvases = await db
      .select()
      .from(canvases)
      .where(eq(canvases.userId, userId))
      .orderBy(desc(canvases.createdAt));

    // If user has no canvases, auto-create a default one
    if (userCanvases.length === 0) {
      const [defaultCanvas] = await db
        .insert(canvases)
        .values({
          userId,
          name: "My Canvas",
          isDefault: true,
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        })
        .returning();

      userCanvases = [defaultCanvas];
    }

    return NextResponse.json({ canvases: userCanvases });
  } catch (error) {
    console.error("Error fetching canvases:", error);
    return NextResponse.json(
      { error: "Failed to fetch canvases" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/canvases
 * Create a new canvas
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Validate required fields
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

    // Create the canvas
    const [canvas] = await db
      .insert(canvases)
      .values({
        userId,
        name: name.trim(),
        isDefault: false,
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      })
      .returning();

    return NextResponse.json({ canvas });
  } catch (error) {
    console.error("Error creating canvas:", error);
    return NextResponse.json(
      { error: "Failed to create canvas" },
      { status: 500 }
    );
  }
}
