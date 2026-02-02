import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dashboardLayouts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/dashboard/layouts
 * List all dashboard layouts for the authenticated user
 * Auto-creates a default layout if user has none
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all layouts for the user
    let userLayouts = await db
      .select()
      .from(dashboardLayouts)
      .where(eq(dashboardLayouts.userId, userId))
      .orderBy(desc(dashboardLayouts.createdAt));

    // If user has no layouts, auto-create a default one
    if (userLayouts.length === 0) {
      const [defaultLayout] = await db
        .insert(dashboardLayouts)
        .values({
          userId,
          name: "Default Dashboard",
          isDefault: true,
          layouts: null,
          widgetConfigs: null,
        })
        .returning();

      userLayouts = [defaultLayout];
    }

    return NextResponse.json({ layouts: userLayouts });
  } catch (error) {
    console.error("Error fetching dashboard layouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard layouts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/layouts
 * Create a new dashboard layout
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, layouts, widgetConfigs, isDefault } = body;

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

    // If this layout should be default, unset other defaults first
    if (isDefault === true) {
      await db
        .update(dashboardLayouts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(dashboardLayouts.userId, userId));
    }

    // Create the layout
    const [layout] = await db
      .insert(dashboardLayouts)
      .values({
        userId,
        name: name.trim(),
        isDefault: isDefault === true,
        layouts: layouts ?? null,
        widgetConfigs: widgetConfigs ?? null,
      })
      .returning();

    return NextResponse.json({ layout });
  } catch (error) {
    console.error("Error creating dashboard layout:", error);
    return NextResponse.json(
      { error: "Failed to create dashboard layout" },
      { status: 500 }
    );
  }
}
