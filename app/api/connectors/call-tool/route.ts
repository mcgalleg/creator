import { auth } from "@/lib/auth";
import { isRegisteredServerUrl } from "@/lib/connectors";
import { withClient } from "@/lib/mcp-client-pool";
import { NextResponse } from "next/server";

/**
 * POST /api/connectors/call-tool
 *
 * Proxies tool calls from the MCP App (running inside the iframe)
 * back to the MCP server. The Excalidraw App needs this to restore
 * checkpoints, read widget context, and perform other server-side
 * operations that the AppBridge's oncalltool handler routes here.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverUrl, toolName, arguments: toolArgs } = await req.json();

    if (!serverUrl || !toolName) {
      return NextResponse.json(
        { error: "serverUrl and toolName are required" },
        { status: 400 }
      );
    }

    if (!isRegisteredServerUrl(serverUrl)) {
      return NextResponse.json(
        { error: "Unregistered MCP server URL" },
        { status: 403 }
      );
    }

    console.log(`[connectors/call-tool] Calling tool "${toolName}" on ${serverUrl}`, JSON.stringify(toolArgs).substring(0, 200));

    const result = await withClient(serverUrl, async (mcpClient) => {
      return mcpClient.callTool(
        { name: toolName, arguments: toolArgs ?? {} },
        undefined,
        { timeout: 120_000 },
      );
    });

    console.log(`[connectors/call-tool] Tool "${toolName}" returned, isError=${result.isError}`);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[connectors/call-tool] Error:", message, error);
    return NextResponse.json(
      { error: `Failed to call MCP tool: ${message}` },
      { status: 500 }
    );
  }
}
