import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canvases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/canvases/[id]
 * Get a specific canvas by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const canvasId = parseInt(id, 10);

    if (isNaN(canvasId)) {
      return NextResponse.json({ error: "Invalid canvas ID" }, { status: 400 });
    }

    // Fetch canvas and verify ownership
    const [canvas] = await db
      .select()
      .from(canvases)
      .where(and(eq(canvases.id, canvasId), eq(canvases.userId, userId)))
      .limit(1);

    if (!canvas) {
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    return NextResponse.json({ canvas });
  } catch (error) {
    console.error("Error fetching canvas:", error);
    return NextResponse.json(
      { error: "Failed to fetch canvas" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/canvases/[id]
 * Update a canvas (name, nodes, edges, viewport)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const canvasId = parseInt(id, 10);

    if (isNaN(canvasId)) {
      return NextResponse.json({ error: "Invalid canvas ID" }, { status: 400 });
    }

    // Verify ownership
    const [existing] = await db
      .select({ id: canvases.id })
      .from(canvases)
      .where(and(eq(canvases.id, canvasId), eq(canvases.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, nodes, edges, viewport } = body;

    // Build update object with only provided fields
    const updates: Partial<{
      name: string;
      nodes: unknown[];
      edges: unknown[];
      viewport: { x: number; y: number; zoom: number };
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    // Validate and set name
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

    // Validate and set nodes
    if (nodes !== undefined) {
      if (!Array.isArray(nodes)) {
        return NextResponse.json(
          { error: "nodes must be an array" },
          { status: 400 }
        );
      }
      updates.nodes = nodes;
    }

    // Validate and set edges
    if (edges !== undefined) {
      if (!Array.isArray(edges)) {
        return NextResponse.json(
          { error: "edges must be an array" },
          { status: 400 }
        );
      }
      updates.edges = edges;
    }

    // Validate and set viewport
    if (viewport !== undefined) {
      if (
        typeof viewport !== "object" ||
        viewport === null ||
        typeof viewport.x !== "number" ||
        typeof viewport.y !== "number" ||
        typeof viewport.zoom !== "number"
      ) {
        return NextResponse.json(
          { error: "viewport must be an object with x, y, and zoom as numbers" },
          { status: 400 }
        );
      }
      updates.viewport = viewport;
    }

    // Update the canvas
    const [updated] = await db
      .update(canvases)
      .set(updates)
      .where(eq(canvases.id, canvasId))
      .returning();

    return NextResponse.json({ canvas: updated });
  } catch (error) {
    console.error("Error updating canvas:", error);
    return NextResponse.json(
      { error: "Failed to update canvas" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/canvases/[id]
 * Delete a canvas by ID
 * Prevents deleting if it's the user's only canvas
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const canvasId = parseInt(id, 10);

    if (isNaN(canvasId)) {
      return NextResponse.json({ error: "Invalid canvas ID" }, { status: 400 });
    }

    // Verify ownership
    const [existing] = await db
      .select({ id: canvases.id })
      .from(canvases)
      .where(and(eq(canvases.id, canvasId), eq(canvases.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    // Count user's canvases to prevent deleting the last one
    const userCanvases = await db
      .select({ id: canvases.id })
      .from(canvases)
      .where(eq(canvases.userId, userId));

    if (userCanvases.length <= 1) {
      return NextResponse.json(
        { error: "Cannot delete your only canvas" },
        { status: 400 }
      );
    }

    // Delete the canvas
    await db.delete(canvases).where(eq(canvases.id, canvasId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting canvas:", error);
    return NextResponse.json(
      { error: "Failed to delete canvas" },
      { status: 500 }
    );
  }
}
