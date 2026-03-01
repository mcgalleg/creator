import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { verifyClerkToken } from "@clerk/mcp-tools/next";
import { clerkClient } from "@clerk/nextjs/server";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { registerAllTools } from "@/lib/mcp-app/tools";
import { registerViewResource } from "@/lib/mcp-app/resource";

// ── Resource metadata path for OAuth discovery (RFC 9728) ──
const RESOURCE_METADATA_PATH = "/.well-known/oauth-protected-resource/mcp-app";

function unauthorizedResponse(req: Request): Response {
  const url = new URL(req.url);
  const resourceMetadataUrl = `${url.origin}${RESOURCE_METADATA_PATH}`;
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message: "Unauthorized" }, id: null },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadataUrl}"`,
      },
    }
  );
}

// ── Auth helper ──
async function extractAuthInfo(req: Request): Promise<AuthInfo | undefined> {
  if (process.env.BYPASS_AUTH === "true") {
    return undefined;
  }

  const authHeader = req.headers.get("Authorization");
  const [type, token] = authHeader?.split(" ") ?? [];
  const bearerToken = type?.toLowerCase() === "bearer" ? token : undefined;
  if (!bearerToken) {
    console.warn("[MCP Auth] No bearer token in Authorization header");
    return undefined;
  }

  try {
    const client = await clerkClient();
    const requestState = await client.authenticateRequest(req, {
      acceptsToken: "oauth_token",
    });
    const clerkAuthResult = requestState.toAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = clerkAuthResult as any;
    console.log("[MCP Auth] authenticateRequest:", JSON.stringify({
      isAuthenticated: r?.isAuthenticated,
      tokenType: r?.tokenType,
      userId: r?.userId,
      clientId: r?.clientId ?? null,
      hasScopes: !!r?.scopes,
      scopes: r?.scopes ?? null,
    }));
    const authInfo = verifyClerkToken(clerkAuthResult, bearerToken);
    if (!authInfo) {
      console.error("[MCP Auth] verifyClerkToken failed — check isAuthenticated, tokenType, clientId, scopes, userId above");
    }
    return authInfo;
  } catch (error) {
    console.error("[MCP Auth] Exception:", error);
    return undefined;
  }
}

// ── Stateless MCP request handler ──
async function handleMcpRequest(req: Request): Promise<Response> {
  const authInfo = await extractAuthInfo(req);

  if (!authInfo && process.env.BYPASS_AUTH !== "true") {
    return unauthorizedResponse(req);
  }

  const server = new McpServer({
    name: "astriq",
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

export async function GET(req: Request) {
  return handleMcpRequest(req);
}

export async function DELETE() {
  return new Response(null, { status: 405 });
}
