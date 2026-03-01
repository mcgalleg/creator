import { auth } from "@/lib/auth";
import { isRegisteredServerUrl } from "@/lib/connectors";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * GET /api/connectors/render?serverUrl=...&resourceUri=...
 *
 * Serves the MCP App HTML directly as text/html so the iframe
 * gets its own document context with NO inherited CSP from the
 * parent page. This is critical because MCP Apps like Excalidraw
 * load scripts from CDNs (esm.sh) that the parent CSP blocks.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const serverUrl = url.searchParams.get("serverUrl");
    const resourceUri = url.searchParams.get("resourceUri");

    if (!serverUrl || !resourceUri) {
      return new Response("serverUrl and resourceUri are required", {
        status: 400,
      });
    }

    if (!isRegisteredServerUrl(serverUrl)) {
      return new Response("Unregistered MCP server URL", { status: 403 });
    }

    const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
    const mcpClient = new Client({ name: "creator", version: "1.0.0" });

    try {
      await mcpClient.connect(transport);
      const response = await mcpClient.readResource({ uri: resourceUri });

      const htmlContent = response.contents
        ?.filter(
          (c) => c.mimeType?.startsWith("text/html") || !c.mimeType
        )
        .map((c) => {
          if ("text" in c) return c.text;
          return "";
        })
        .join("");

      return new Response(htmlContent || "", {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, max-age=300",
        },
      });
    } finally {
      try {
        await mcpClient.close();
      } catch {
        // Ignore close errors
      }
    }
  } catch (error) {
    console.error("[connectors/render] Error:", error);
    return new Response("Failed to fetch MCP resource", { status: 500 });
  }
}
