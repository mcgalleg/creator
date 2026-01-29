import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pinnedComponents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/pinned
 * List all pinned components for the current user
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const components = await db
      .select({
        id: pinnedComponents.id,
        componentType: pinnedComponents.componentType,
        title: pinnedComponents.title,
        configuration: pinnedComponents.configuration,
        gridPosition: pinnedComponents.gridPosition,
        createdAt: pinnedComponents.createdAt,
      })
      .from(pinnedComponents)
      .where(eq(pinnedComponents.userId, userId))
      .orderBy(desc(pinnedComponents.createdAt));

    return NextResponse.json({ components });
  } catch (error) {
    console.error("Error fetching pinned components:", error);
    return NextResponse.json(
      { error: "Failed to fetch pinned components" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pinned
 * Create a new pinned component
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { componentType, title, configuration, gridPosition } = body;

    // Validate required fields
    if (!componentType || typeof componentType !== "string") {
      return NextResponse.json(
        { error: "componentType is required" },
        { status: 400 }
      );
    }

    if (!configuration || typeof configuration !== "object") {
      return NextResponse.json(
        { error: "configuration is required and must be an object" },
        { status: 400 }
      );
    }

    // Validate gridPosition if provided
    if (gridPosition) {
      if (
        typeof gridPosition !== "object" ||
        typeof gridPosition.x !== "number" ||
        typeof gridPosition.y !== "number" ||
        typeof gridPosition.w !== "number" ||
        typeof gridPosition.h !== "number"
      ) {
        return NextResponse.json(
          { error: "gridPosition must have x, y, w, h as numbers" },
          { status: 400 }
        );
      }
    }

    // Create the pinned component
    const [component] = await db
      .insert(pinnedComponents)
      .values({
        userId,
        componentType,
        title: title || null,
        configuration,
        gridPosition: gridPosition || null,
      })
      .returning();

    return NextResponse.json({
      component: {
        id: component.id,
        componentType: component.componentType,
        title: component.title,
        configuration: component.configuration,
        gridPosition: component.gridPosition,
        createdAt: component.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating pinned component:", error);
    return NextResponse.json(
      { error: "Failed to create pinned component" },
      { status: 500 }
    );
  }
}
