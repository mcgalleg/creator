import { auth } from "@/lib/auth";
import { isRegisteredServerUrl } from "@/lib/connectors";
import { withClient } from "@/lib/mcp-client-pool";
import { NextResponse } from "next/server";

/**
 * POST /api/connectors/mcp-proxy
 *
 * Generic MCP request proxy. Forwards any supported MCP method from
 * the browser-side AppBridge to the actual MCP server. This is the
 * spec-compliant way for web hosts to implement MCP request forwarding
 * when the MCP Client cannot run directly in the browser.
 *
 * Body: { serverUrl: string, method: string, params?: object }
 */

const ALLOWED_METHODS = [
  "tools/call",
  "tools/list",
  "resources/list",
  "resources/read",
  "resources/templates/list",
  "prompts/list",
] as const;

type AllowedMethod = (typeof ALLOWED_METHODS)[number];

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverUrl, method, params } = await req.json();

    if (!serverUrl || !method) {
      return NextResponse.json(
        { error: "serverUrl and method are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_METHODS.includes(method as AllowedMethod)) {
      return NextResponse.json(
        { error: `Method "${method}" is not allowed` },
        { status: 400 }
      );
    }

    if (!isRegisteredServerUrl(serverUrl)) {
      return NextResponse.json(
        { error: "Unregistered MCP server URL" },
        { status: 403 }
      );
    }

    console.log(`[connectors/mcp-proxy] ${method}`, method === 'tools/call' ? params.name : '');

    const result = await withClient(serverUrl, async (mcpClient) => {
      switch (method as AllowedMethod) {
        case "tools/call":
          return mcpClient.callTool(
            { name: params.name, arguments: params.arguments ?? {} },
            undefined,
            { timeout: 120_000 }
          );
        case "tools/list":
          return mcpClient.listTools(params, { timeout: 30_000 });
        case "resources/list":
          return mcpClient.listResources(params, { timeout: 30_000 });
        case "resources/read":
          return mcpClient.readResource(
            { uri: params.uri },
            { timeout: 30_000 }
          );
        case "resources/templates/list":
          return mcpClient.listResourceTemplates(params, {
            timeout: 30_000,
          });
        case "prompts/list":
          return mcpClient.listPrompts(params, { timeout: 30_000 });
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[connectors/mcp-proxy] Error:", message);
    return NextResponse.json(
      { error: `MCP proxy error: ${message}` },
      { status: 500 }
    );
  }
}
