import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { drawings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/drawings/[id]
 * Get a specific drawing by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const drawingId = parseInt(id, 10);

    if (isNaN(drawingId)) {
      return NextResponse.json({ error: "Invalid drawing ID" }, { status: 400 });
    }

    const [drawing] = await db
      .select()
      .from(drawings)
      .where(and(eq(drawings.id, drawingId), eq(drawings.userId, userId)))
      .limit(1);

    if (!drawing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    return NextResponse.json({ drawing });
  } catch (error) {
    console.error("Error fetching drawing:", error);
    return NextResponse.json(
      { error: "Failed to fetch drawing" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/drawings/[id]
 * Update a drawing (name, elements, appState)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const drawingId = parseInt(id, 10);

    if (isNaN(drawingId)) {
      return NextResponse.json({ error: "Invalid drawing ID" }, { status: 400 });
    }

    // Verify ownership
    const [existing] = await db
      .select({ id: drawings.id })
      .from(drawings)
      .where(and(eq(drawings.id, drawingId), eq(drawings.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, elements, appState } = body;

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (typeof name !== "string") {
        return NextResponse.json(
          { error: "name must be a string" },
          { status: 400 }
        );
      }
      if (name.trim().length === 0) {
        return NextResponse.json(
          { error: "name cannot be empty" },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (elements !== undefined) {
      if (!Array.isArray(elements)) {
        return NextResponse.json(
          { error: "elements must be an array" },
          { status: 400 }
        );
      }
      updates.elements = elements;
    }

    if (appState !== undefined) {
      if (typeof appState !== "object" || appState === null) {
        return NextResponse.json(
          { error: "appState must be an object" },
          { status: 400 }
        );
      }
      updates.appState = appState;
    }

    const [updated] = await db
      .update(drawings)
      .set(updates)
      .where(eq(drawings.id, drawingId))
      .returning();

    return NextResponse.json({ drawing: updated });
  } catch (error) {
    console.error("Error updating drawing:", error);
    return NextResponse.json(
      { error: "Failed to update drawing" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drawings/[id]
 * Delete a drawing by ID
 * Prevents deleting if it's the user's only drawing
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const drawingId = parseInt(id, 10);

    if (isNaN(drawingId)) {
      return NextResponse.json({ error: "Invalid drawing ID" }, { status: 400 });
    }

    // Verify ownership
    const [existing] = await db
      .select({ id: drawings.id })
      .from(drawings)
      .where(and(eq(drawings.id, drawingId), eq(drawings.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    // Count user's drawings to prevent deleting the last one
    const userDrawings = await db
      .select({ id: drawings.id })
      .from(drawings)
      .where(eq(drawings.userId, userId));

    if (userDrawings.length <= 1) {
      return NextResponse.json(
        { error: "Cannot delete your only drawing" },
        { status: 400 }
      );
    }

    await db.delete(drawings).where(eq(drawings.id, drawingId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting drawing:", error);
    return NextResponse.json(
      { error: "Failed to delete drawing" },
      { status: 500 }
    );
  }
}
