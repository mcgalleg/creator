import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { verifyClerkToken } from "@clerk/mcp-tools/next";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { registerAllTools } from "@/lib/mcp-app/tools";
import { registerViewResource } from "@/lib/mcp-app/resource";

// ── Auth helper ──
async function extractAuthInfo(req: Request): Promise<AuthInfo | undefined> {
  if (process.env.BYPASS_AUTH === "true") {
    return undefined;
  }

  const authHeader = req.headers.get("Authorization");
  const [type, token] = authHeader?.split(" ") ?? [];
  const bearerToken = type?.toLowerCase() === "bearer" ? token : undefined;
  if (!bearerToken) return undefined;

  try {
    const clerkAuthResult = await clerkAuth({ acceptsToken: "oauth_token" });
    return verifyClerkToken(clerkAuthResult, bearerToken);
  } catch {
    return undefined;
  }
}

// ── Stateless MCP request handler ──
async function handleMcpRequest(req: Request): Promise<Response> {
  const authInfo = await extractAuthInfo(req);

  if (!authInfo && process.env.BYPASS_AUTH !== "true") {
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32000, message: "Unauthorized" }, id: null },
      { status: 401 }
    );
  }

  const server = new McpServer({
    name: "creator-mcp-app",
    version: "1.0.0",
  });
  registerAllTools(server);
  registerViewResource(server);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(req, { authInfo });
  } catch (error) {
    console.error("MCP App request error:", error);
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null },
      { status: 500 }
    );
  }
}

// Stateless mode: only POST is supported
export async function POST(req: Request) {
  return handleMcpRequest(req);
}

export async function GET() {
  return new Response(null, { status: 405 });
}

export async function DELETE() {
  return new Response(null, { status: 405 });
}
