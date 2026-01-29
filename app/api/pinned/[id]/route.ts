import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pinnedComponents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/pinned/[id]
 * Update a pinned component
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const componentId = parseInt(id, 10);

    if (isNaN(componentId)) {
      return NextResponse.json({ error: "Invalid component ID" }, { status: 400 });
    }

    // Verify ownership
    const [existing] = await db
      .select({ id: pinnedComponents.id })
      .from(pinnedComponents)
      .where(
        and(
          eq(pinnedComponents.id, componentId),
          eq(pinnedComponents.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, gridPosition, canvasData, configuration } = body;

    // Build update object with only provided fields
    const updates: Partial<{
      title: string | null;
      gridPosition: { x: number; y: number; w: number; h: number } | null;
      canvasData: {
        x: number;
        y: number;
        width?: number;
        height?: number;
        rotation?: number;
        zIndex?: number;
      } | null;
      configuration: Record<string, unknown>;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updates.title = title;
    }

    if (gridPosition !== undefined) {
      if (
        gridPosition !== null &&
        (typeof gridPosition !== "object" ||
          typeof gridPosition.x !== "number" ||
          typeof gridPosition.y !== "number" ||
          typeof gridPosition.w !== "number" ||
          typeof gridPosition.h !== "number")
      ) {
        return NextResponse.json(
          { error: "gridPosition must have x, y, w, h as numbers or be null" },
          { status: 400 }
        );
      }
      updates.gridPosition = gridPosition;
    }

    if (canvasData !== undefined) {
      if (canvasData !== null) {
        if (
          typeof canvasData !== "object" ||
          typeof canvasData.x !== "number" ||
          typeof canvasData.y !== "number"
        ) {
          return NextResponse.json(
            { error: "canvasData must have x, y as numbers or be null" },
            { status: 400 }
          );
        }
        // Validate optional fields if present
        if (canvasData.width !== undefined && typeof canvasData.width !== "number") {
          return NextResponse.json(
            { error: "canvasData.width must be a number" },
            { status: 400 }
          );
        }
        if (canvasData.height !== undefined && typeof canvasData.height !== "number") {
          return NextResponse.json(
            { error: "canvasData.height must be a number" },
            { status: 400 }
          );
        }
        if (canvasData.rotation !== undefined && typeof canvasData.rotation !== "number") {
          return NextResponse.json(
            { error: "canvasData.rotation must be a number" },
            { status: 400 }
          );
        }
        if (canvasData.zIndex !== undefined && typeof canvasData.zIndex !== "number") {
          return NextResponse.json(
            { error: "canvasData.zIndex must be a number" },
            { status: 400 }
          );
        }
      }
      updates.canvasData = canvasData;
    }

    if (configuration !== undefined) {
      if (typeof configuration !== "object" || configuration === null) {
        return NextResponse.json(
          { error: "configuration must be an object" },
          { status: 400 }
        );
      }
      updates.configuration = configuration;
    }

    // Update the component
    const [updated] = await db
      .update(pinnedComponents)
      .set(updates)
      .where(eq(pinnedComponents.id, componentId))
      .returning();

    return NextResponse.json({
      component: {
        id: updated.id,
        componentType: updated.componentType,
        title: updated.title,
        configuration: updated.configuration,
        gridPosition: updated.gridPosition,
        canvasData: updated.canvasData,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating pinned component:", error);
    return NextResponse.json(
      { error: "Failed to update pinned component" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pinned/[id]
 * Remove a pinned component
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const componentId = parseInt(id, 10);

    if (isNaN(componentId)) {
      return NextResponse.json({ error: "Invalid component ID" }, { status: 400 });
    }

    // Verify ownership before deleting
    const [existing] = await db
      .select({ id: pinnedComponents.id })
      .from(pinnedComponents)
      .where(
        and(
          eq(pinnedComponents.id, componentId),
          eq(pinnedComponents.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    // Delete the component
    await db
      .delete(pinnedComponents)
      .where(eq(pinnedComponents.id, componentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pinned component:", error);
    return NextResponse.json(
      { error: "Failed to delete pinned component" },
      { status: 500 }
    );
  }
}
