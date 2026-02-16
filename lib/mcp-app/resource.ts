import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";

const RESOURCE_URI = "ui://creator/analytics.html";

export function registerViewResource(server: McpServer) {
  registerAppResource(
    server,
    "Creator Analytics",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE, description: "TikTok Analytics Dashboard" },
    async (): Promise<ReadResourceResult> => {
      // Resolve path relative to this file's location
      // In production: lib/mcp-app/resource.ts -> mcp-app/dist/index.html
      // The build output is at project_root/mcp-app/dist/index.html
      const distPath = path.resolve(
        process.cwd(),
        "mcp-app",
        "dist",
        "index.html"
      );
      const html = await fs.readFile(distPath, "utf-8");
      return {
        contents: [{
          uri: RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: html,
          _meta: {
            ui: {
              csp: {
                // Allow TikTok CDN images (thumbnails, avatars)
                resourceDomains: [
                  "https://*.tiktokcdn-us.com",
                  "https://*.tiktokcdn.com",
                ],
              },
            },
          },
        }],
      };
    }
  );
}
