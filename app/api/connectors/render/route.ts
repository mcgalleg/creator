import { auth } from "@/lib/auth";
import { isRegisteredServerUrl } from "@/lib/services/connector-service";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { McpUiResourceCsp, McpUiResourcePermissions } from "@modelcontextprotocol/ext-apps/app-bridge";

/**
 * GET /api/connectors/render?serverUrl=...&resourceUri=...
 *
 * Returns JSON metadata for the sandbox proxy to render:
 * { html: string, csp?: McpUiResourceCsp, permissions?: McpUiResourcePermissions }
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

    if (!(await isRegisteredServerUrl(serverUrl))) {
      return new Response("Unregistered MCP server URL", { status: 403 });
    }

    const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
    const mcpClient = new Client({ name: "creator", version: "1.0.0" });

    try {
      await mcpClient.connect(transport);
      const response = await mcpClient.readResource({ uri: resourceUri });

      // Extract metadata from the first content item
      const firstContent = response.contents?.[0] as
        | { text?: string; mimeType?: string; _meta?: { ui?: { csp?: McpUiResourceCsp; permissions?: McpUiResourcePermissions } } }
        | undefined;

      const csp = firstContent?._meta?.ui?.csp;
      const permissions = firstContent?._meta?.ui?.permissions;

      let htmlContent = response.contents
        ?.filter(
          (c) => c.mimeType?.startsWith("text/html") || !c.mimeType
        )
        .map((c) => {
          if ("text" in c) return c.text;
          return "";
        })
        .join("");

      // Inject a zoom-to-fit script for Excalidraw apps
      if (htmlContent && serverUrl.includes("excalidraw")) {
        const zoomScript = `<script>(function(){var i=false;['pointerdown','wheel'].forEach(function(e){document.addEventListener(e,function(){i=true},{once:true,capture:true})});function z(){if(i)return;var m=/Mac|iPhone|iPad/.test(navigator.platform);document.dispatchEvent(new KeyboardEvent('keydown',{key:'1',code:'Digit1',ctrlKey:!m,metaKey:m,shiftKey:true,bubbles:true}))}setTimeout(z,4000);setTimeout(z,6000)})()</script>`;
        if (htmlContent.includes("</body>")) {
          htmlContent = htmlContent.replace("</body>", zoomScript + "</body>");
        } else if (htmlContent.includes("</html>")) {
          htmlContent = htmlContent.replace("</html>", zoomScript + "</html>");
        } else {
          htmlContent += zoomScript;
        }
      }

      return Response.json({
        html: htmlContent || "",
        ...(csp ? { csp } : {}),
        ...(permissions ? { permissions } : {}),
      }, {
        headers: {
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
