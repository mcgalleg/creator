import { auth } from "@/lib/auth";
import { getUserConnectorIds } from "@/lib/services/connector-service";
import { NextResponse } from "next/server";

/**
 * GET /api/connectors/me — user's enabled connector IDs.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connectorIds = await getUserConnectorIds(userId);
    return NextResponse.json(connectorIds);
  } catch (error) {
    console.error("[connectors/me] Error:", error);
    return NextResponse.json({ error: "Failed to get user connectors" }, { status: 500 });
  }
}
