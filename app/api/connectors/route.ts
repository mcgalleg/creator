import { listConnectors } from "@/lib/services/connector-service";
import { NextResponse } from "next/server";

/**
 * GET /api/connectors — public connector catalog.
 * Returns all globally enabled connectors.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") ?? undefined;
    const featured = url.searchParams.get("featured");

    const rows = await listConnectors({
      category,
      featured: featured === "true" ? true : featured === "false" ? false : undefined,
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[connectors] Error:", error);
    return NextResponse.json({ error: "Failed to list connectors" }, { status: 500 });
  }
}
