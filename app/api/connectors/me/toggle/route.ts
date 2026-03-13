import { auth } from "@/lib/auth";
import { toggleUserConnector, getConnectorById } from "@/lib/services/connector-service";
import { NextResponse } from "next/server";

/**
 * POST /api/connectors/me/toggle — enable or disable a connector for the user.
 * Body: { connectorId: string, enabled: boolean }
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { connectorId, enabled } = await req.json();

    if (!connectorId || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "connectorId and enabled (boolean) are required" },
        { status: 400 },
      );
    }

    // Verify the connector exists and is globally enabled
    const connector = await getConnectorById(connectorId);
    if (!connector || !connector.enabled) {
      return NextResponse.json(
        { error: "Connector not found or disabled" },
        { status: 404 },
      );
    }

    // If connector requires auth and user is trying to enable, they need to go through OAuth first
    if (enabled && connector.requiresAuth) {
      return NextResponse.json(
        { error: "This connector requires authentication. Use the OAuth flow to connect." },
        { status: 400 },
      );
    }

    await toggleUserConnector(userId, connectorId, enabled);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[connectors/me/toggle] Error:", error);
    return NextResponse.json(
      { error: "Failed to toggle connector" },
      { status: 500 },
    );
  }
}
