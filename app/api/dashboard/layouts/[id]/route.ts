import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dashboardLayouts, BreakpointLayouts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/dashboard/layouts/[id]
 * Get a specific dashboard layout by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const layoutId = parseInt(id, 10);

    if (isNaN(layoutId)) {
      return NextResponse.json({ error: "Invalid layout ID" }, { status: 400 });
    }

    // Fetch layout and verify ownership
    const [layout] = await db
      .select()
      .from(dashboardLayouts)
      .where(and(eq(dashboardLayouts.id, layoutId), eq(dashboardLayouts.userId, userId)))
      .limit(1);

    if (!layout) {
      return NextResponse.json({ error: "Layout not found" }, { status: 404 });
    }

    return NextResponse.json({ layout });
  } catch (error) {
    console.error("Error fetching dashboard layout:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard layout" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/layouts/[id]
 * Update a dashboard layout (name, layouts, widgetConfigs, isDefault)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const layoutId = parseInt(id, 10);

    if (isNaN(layoutId)) {
      return NextResponse.json({ error: "Invalid layout ID" }, { status: 400 });
    }

    // Verify ownership
    const [existing] = await db
      .select({ id: dashboardLayouts.id })
      .from(dashboardLayouts)
      .where(and(eq(dashboardLayouts.id, layoutId), eq(dashboardLayouts.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Layout not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, layouts, widgetConfigs, isDefault } = body;

    // Build update object with only provided fields
    const updates: Partial<{
      name: string;
      layouts: BreakpointLayouts | null;
      widgetConfigs: Record<string, unknown> | null;
      isDefault: boolean;
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

    // Validate and set layouts
    if (layouts !== undefined) {
      if (layouts !== null && typeof layouts !== "object") {
        return NextResponse.json(
          { error: "layouts must be an object or null" },
          { status: 400 }
        );
      }
      updates.layouts = layouts;
    }

    // Validate and set widgetConfigs
    if (widgetConfigs !== undefined) {
      if (widgetConfigs !== null && typeof widgetConfigs !== "object") {
        return NextResponse.json(
          { error: "widgetConfigs must be an object or null" },
          { status: 400 }
        );
      }
      updates.widgetConfigs = widgetConfigs;
    }

    // Handle isDefault - if setting to true, unset other defaults first
    if (isDefault !== undefined) {
      if (typeof isDefault !== "boolean") {
        return NextResponse.json(
          { error: "isDefault must be a boolean" },
          { status: 400 }
        );
      }

      if (isDefault === true) {
        // Unset other defaults for this user
        await db
          .update(dashboardLayouts)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(dashboardLayouts.userId, userId));
      }

      updates.isDefault = isDefault;
    }

    // Update the layout
    const [updated] = await db
      .update(dashboardLayouts)
      .set(updates)
      .where(eq(dashboardLayouts.id, layoutId))
      .returning();

    return NextResponse.json({ layout: updated });
  } catch (error) {
    console.error("Error updating dashboard layout:", error);
    return NextResponse.json(
      { error: "Failed to update dashboard layout" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/layouts/[id]
 * Delete a dashboard layout by ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const layoutId = parseInt(id, 10);

    if (isNaN(layoutId)) {
      return NextResponse.json({ error: "Invalid layout ID" }, { status: 400 });
    }

    // Verify ownership
    const [existing] = await db
      .select({ id: dashboardLayouts.id })
      .from(dashboardLayouts)
      .where(and(eq(dashboardLayouts.id, layoutId), eq(dashboardLayouts.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Layout not found" }, { status: 404 });
    }

    // Delete the layout
    await db.delete(dashboardLayouts).where(eq(dashboardLayouts.id, layoutId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dashboard layout:", error);
    return NextResponse.json(
      { error: "Failed to delete dashboard layout" },
      { status: 500 }
    );
  }
}
