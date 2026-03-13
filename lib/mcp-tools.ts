import { tool, jsonSchema, type Tool } from "ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { getToolUiResourceUri } from "@modelcontextprotocol/ext-apps/app-bridge";
import { hasFeature, type FeatureKey } from "@/lib/auth";
import {
  getEnabledConnectorsForUser,
  getConnectorById,
  type ConnectorRow,
} from "@/lib/services/connector-service";

const MCP_CONNECT_TIMEOUT = 15_000; // 15s to connect
const MCP_TOOL_TIMEOUT = 60_000;    // 60s per tool call

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export interface McpToolsResult {
  tools: Record<string, Tool>;
  clients: Client[];
  systemHints: string[];
}

/**
 * Build MCP tools for a user's enabled connectors.
 *
 * Handles: DB lookup, feature checks, auth tokens, Client creation,
 * listTools, and tool wrapping with _mcpAppUi/_mcpToolResult metadata.
 */
export async function buildMcpToolsForConnectors(
  userId: string,
  connectorIds: string[],
): Promise<McpToolsResult> {
  const clients: Client[] = [];
  const tools: Record<string, Tool> = {};
  const systemHints: string[] = [];

  if (!connectorIds.length) return { tools, clients, systemHints };

  console.log(`[mcp-tools] Building tools for connectors: ${connectorIds.join(", ")}`);

  // Fetch enabled connectors from DB
  const enabledConnectors = await getEnabledConnectorsForUser(userId);
  const enabledMap = new Map(enabledConnectors.map((c) => [c.id, c]));

  const results = await Promise.allSettled(
    connectorIds.map(async (connectorId) => {
      // Check if user has this connector enabled in DB
      let connector = enabledMap.get(connectorId);

      // Fall back to direct lookup if not in user's enabled set
      // (handles case where connector was requested but not yet in user_connectors)
      if (!connector) {
        const row = await getConnectorById(connectorId);
        if (!row || !row.enabled) {
          console.warn(`[mcp-tools] Connector "${connectorId}" not found or disabled`);
          return null;
        }
        // Use the row directly (no user tokens)
        connector = { ...row, accessToken: null, refreshToken: null, tokenExpiresAt: null };
      }

      // Validate feature access server-side
      if (connector.requiredFeature) {
        const hasAccess = await hasFeature(connector.requiredFeature as FeatureKey);
        if (!hasAccess) {
          console.warn(`[mcp-tools] User lacks feature "${connector.requiredFeature}" for "${connectorId}"`);
          return null;
        }
      }

      // Skip auth-required connectors without tokens
      if (connector.requiresAuth && !connector.accessToken) {
        console.warn(`[mcp-tools] Connector "${connectorId}" requires auth but no token available`);
        return null;
      }

      // Build transport headers for auth connectors
      const headers: Record<string, string> = {};
      if (connector.accessToken) {
        headers["Authorization"] = `Bearer ${connector.accessToken}`;
      }

      const transport = new StreamableHTTPClientTransport(
        new URL(connector.mcpServerUrl),
        { requestInit: Object.keys(headers).length > 0 ? { headers } : undefined },
      );
      const mcpClient = new Client({
        name: "creator",
        version: "1.0.0",
      });
      await withTimeout(mcpClient.connect(transport), MCP_CONNECT_TIMEOUT, `MCP connect to ${connectorId}`);

      const { tools: remoteTools } = await withTimeout(mcpClient.listTools(), MCP_CONNECT_TIMEOUT, `MCP listTools for ${connectorId}`);
      return { connectorId, connector, mcpClient, remoteTools };
    }),
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[mcp-tools] Failed to connect to MCP server:", result.reason);
      continue;
    }
    const value = result.value;
    if (!value) continue;

    const { connectorId, connector, mcpClient, remoteTools } = value;
    clients.push(mcpClient);

    if (connector.systemPromptHint) {
      systemHints.push(connector.systemPromptHint);
    }

    const toolNames: string[] = [];
    for (const remoteTool of remoteTools) {
      const resourceUri = getToolUiResourceUri(remoteTool);

      toolNames.push(remoteTool.name);
      tools[remoteTool.name] = tool({
        description: remoteTool.description ?? remoteTool.name,
        inputSchema: jsonSchema(remoteTool.inputSchema),
        execute: async (input) => {
          const callResult = await withTimeout(
            mcpClient.callTool({
              name: remoteTool.name,
              arguments: input as Record<string, unknown>,
            }),
            MCP_TOOL_TIMEOUT,
            `MCP tool "${remoteTool.name}"`,
          );

          const contentArray = Array.isArray(callResult.content)
            ? (callResult.content as Array<{ type: string; text?: string }>)
            : [];
          const textContent = contentArray
            .filter((c) => c.type === "text")
            .map((c) => c.text)
            .join("\n");

          let result: Record<string, unknown> = {};
          try {
            result = textContent ? JSON.parse(textContent) : {};
          } catch {
            result = { text: textContent };
          }

          if (resourceUri && !callResult.isError) {
            result._mcpAppUi = {
              serverUrl: connector.mcpServerUrl,
              resourceUri,
            };
            result._mcpToolResult = callResult;
          }

          return result;
        },
      });
    }

    console.log(`[mcp-tools] Loaded ${toolNames.length} tools from "${connectorId}": ${toolNames.join(", ")}`);
  }

  return { tools, clients, systemHints };
}
