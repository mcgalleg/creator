import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCurrentUserId } from "./auth";
import { getAnalyticsSchema, executeReadQuery } from "./data";
import { searchComments } from "./data/search";

const RESOURCE_URI = "ui://creator/analytics.html";

export function registerAllTools(server: McpServer) {
  registerAppTool(server, "describe_tables", {
    description:
      "Returns the full database schema with detailed column types and relationships. " +
      "Call this before using query_data to understand what tables and columns are available.",
    inputSchema: {},
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  }, async (_args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    const schema = await getAnalyticsSchema(userId);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(schema, null, 2) }],
    };
  });

  registerAppTool(server, "query_data", {
    description:
      "Execute a read-only PostgreSQL SELECT query against the analytics database. " +
      "Data is automatically scoped to the current user's TikTok accounts — no account filters needed. " +
      "Only SELECT queries are allowed. WITH (CTE) queries are supported. Max 500 rows returned. " +
      "Use describe_tables first to see available tables, then query iteratively — " +
      "examine results from each query to decide what to explore next for deeper insights.",
    inputSchema: {
      sql: z.string().describe("A PostgreSQL SELECT query"),
    },
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  }, async (args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    try {
      const result = await executeReadQuery(userId, args.sql);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result),
        }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: `Query error: ${message}` }],
        isError: true,
      };
    }
  });

  server.tool(
    "search_comments",
    "Semantic search across comments to find examples matching a topic or theme. " +
      "Uses AI embeddings to find semantically similar comments, not just keyword matches. " +
      "Results are scoped to the current user's connected accounts.",
    {
      query: z.string().describe("Natural language description of comments to find"),
      sentiment: z.enum(["supportive", "neutral", "unsupportive"]).optional()
        .describe("Filter by sentiment category"),
      limit: z.number().optional().describe("Max results (default 30, max 50)"),
    },
    async (args, { authInfo }) => {
      const userId = await getCurrentUserId(authInfo);
      try {
        const result = await searchComments(userId, args.query, {
          limit: Math.min(args.limit ?? 30, 50),
          sentiment: args.sentiment,
        });
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Search error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
