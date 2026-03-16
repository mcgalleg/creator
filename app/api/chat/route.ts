import {
  streamText,
  tool,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
  gateway,
  wrapLanguageModel,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type ModelMessage,
  type Tool,
} from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { pipeJsonRender } from "@json-render/core";
import { createSpecRepairTransform } from "@/lib/spec-repair";
import { NextResponse } from "next/server";
import { auth, hasFeature } from "@/lib/auth";
import { checkAiTokens } from "@/lib/services/credit-service";
import { ingestAiTokenEvent } from "@/lib/polar";
import { z } from "zod";
import { db } from "@/lib/db";
import { creditTransactions } from "@/lib/db/schema/credits";
import { tiktokAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAnalyticsSchema, executeReadQuery, searchComments } from "@/lib/mcp-app/data";
import { addCacheControlToMessages, ANTHROPIC_CACHE_CONTROL } from "@/lib/ai-tools/prompt-cache";
import { getAnalyticsChatPrompt } from "@/lib/catalog";
import { chatLimiter } from "@/lib/rate-limit";
import { buildMcpToolsForConnectors } from "@/lib/mcp-tools";

// =============================================================================
// Message sanitization — fix malformed tool_use inputs in conversation history
// =============================================================================

/**
 * The Anthropic API requires tool_use.input to be a JSON dictionary.
 * If the model previously generated a non-dict input (e.g. an array or null),
 * the AI SDK stores it in conversation history. When the conversation is
 * replayed, the API rejects the entire request with a 400.
 *
 * This function walks the model messages and fixes any non-dict tool-call
 * inputs so the conversation can proceed.
 */
function sanitizeModelMessages(msgs: ModelMessage[]): ModelMessage[] {
  return msgs.map((msg) => {
    // Only assistant messages contain tool-call parts
    if (msg.role !== "assistant" || !Array.isArray(msg.content)) return msg;

    let needsFix = false;
    const fixedContent = msg.content.map((part) => {
      if (part.type !== "tool-call") return part;

      const input = part.input;
      if (typeof input === "object" && input !== null && !Array.isArray(input)) {
        return part; // Already a valid dict
      }

      needsFix = true;
      console.warn(
        `[chat] Sanitizing malformed tool-call input for "${part.toolName}":`,
        typeof input
      );

      // Best-effort recovery: unwrap array, parse string, or wrap in a dict
      if (Array.isArray(input) && input.length > 0 && typeof input[0] === "object") {
        return { ...part, input: input[0] };
      }
      if (typeof input === "string") {
        try {
          let raw = input;
          const lastBrace = Math.max(raw.lastIndexOf("}"), raw.lastIndexOf("]"));
          if (lastBrace > 0) raw = raw.substring(0, lastBrace + 1);
          const parsed = JSON.parse(raw);
          if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            return { ...part, input: parsed };
          }
        } catch {
          // Fall through to _raw wrapper
        }
      }
      return { ...part, input: { _raw: input ?? {} } };
    });

    return needsFix
      ? ({ ...msg, content: fixedContent } as typeof msg)
      : msg;
  });
}

// Create model for AI chat via Vercel AI Gateway
const baseModel = gateway(process.env.AI_MODEL || "anthropic/claude-haiku-4-5");
const model =
  process.env.NODE_ENV === "development"
    ? wrapLanguageModel({ model: baseModel, middleware: devToolsMiddleware() })
    : baseModel;

// =============================================================================
// System Prompt
// =============================================================================

const CATALOG_PROMPT = getAnalyticsChatPrompt();

const SYSTEM_PROMPT = `You are a TikTok analytics assistant.

## Response Rules
- Do NOT output text before or between tool calls. Call tools silently with no narration.
- Only speak AFTER all data is gathered — then present your full analysis in one response.
- If a tool returns empty results, an error, or no data — say so honestly. NEVER fabricate or hallucinate data.
- You have a LIMITED budget of tool call steps. Combine data needs into as few SQL queries as possible.
- Aim for 2-4 tool calls (including describe_tables), then present your analysis.

## Database

You have access to a TikTok analytics database with these tables:
tiktok_accounts, posts, comments, account_metrics_history, post_collaborators

### Query Strategy
- ALWAYS call describe_tables as your FIRST tool call before writing any SQL query via query_data.
- describe_tables returns the full schema, column types, query formulas, and best practices.
- Do NOT guess column names — always verify against the schema returned by describe_tables.
- When a query fails, call describe_tables again to re-verify the schema before retrying.

${CATALOG_PROMPT}`;

export async function POST(req: Request) {
  try {
    const { messages, selectedAccountIds, enabledConnectors, modelContext }: {
      messages: UIMessage[];
      selectedAccountIds?: number[];
      enabledConnectors?: string[];
      modelContext?: { content?: Array<{ type: string; text?: string }>; structuredContent?: Record<string, unknown> };
    } = await req.json();

    console.log(`[chat] Request body: enabledConnectors=${JSON.stringify(enabledConnectors)}, selectedAccountIds=${JSON.stringify(selectedAccountIds)}`);

    // Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const { limited } = chatLimiter.check(userId);
    if (limited) return Response.json({ error: "Rate limit exceeded" }, { status: 429 });

    // Check feature access and AI token balance in parallel
    const MIN_TOKENS_TO_START_CHAT = 1_000;
    const [canChat, tokenCheck] = await Promise.all([
      hasFeature("analytics_assistant"),
      process.env.BYPASS_AUTH !== "true"
        ? checkAiTokens(userId, MIN_TOKENS_TO_START_CHAT)
        : Promise.resolve({ sufficient: true, balance: Infinity }),
    ]);

    if (!canChat) {
      return Response.json(
        { error: "Feature not available on your plan" },
        { status: 403 }
      );
    }

    if (!tokenCheck.sufficient) {
      return Response.json(
        { error: "Insufficient AI tokens", balance: tokenCheck.balance, required: MIN_TOKENS_TO_START_CHAT },
        { status: 402 }
      );
    }

    // Get the user's connected TikTok accounts for context
    const userAccounts = await db
      .select({
        id: tiktokAccounts.id,
        username: tiktokAccounts.username,
        displayName: tiktokAccounts.displayName,
      })
      .from(tiktokAccounts)
      .where(and(eq(tiktokAccounts.userId, userId), eq(tiktokAccounts.status, "active")));

    // Validate ownership of selectedAccountIds
    if (selectedAccountIds && selectedAccountIds.length > 0) {
      const ownedIds = new Set(userAccounts.map((a) => a.id));
      const invalid = selectedAccountIds.filter((id) => !ownedIds.has(id));
      if (invalid.length > 0) {
        return Response.json(
          { error: "One or more selected accounts do not belong to you" },
          { status: 403 }
        );
      }
    }

    const activeAccounts = selectedAccountIds?.length
      ? userAccounts.filter((a) => selectedAccountIds.includes(a.id))
      : [];

    let accountContext: string;
    if (userAccounts.length === 0) {
      accountContext = "\n\nThe user has no connected TikTok accounts yet. Suggest they connect an account to see their analytics.";
    } else if (activeAccounts.length === 1) {
      const acct = activeAccounts[0];
      accountContext = `\n\nThe user is viewing their TikTok account @${acct.username} (${acct.displayName || acct.username}). All analytics queries are automatically scoped to this account. Do not reference or discuss other accounts.`;
    } else if (activeAccounts.length > 1) {
      const names = activeAccounts.map((a) => `@${a.username}`).join(" and ");
      accountContext = `\n\nThe user is viewing ${activeAccounts.length} TikTok accounts: ${names}. All analytics queries are automatically scoped to these accounts.`;
    } else {
      accountContext = `\n\nThe user has ${userAccounts.length} connected TikTok account(s). No specific account is selected.`;
    }

    const modelMessages = sanitizeModelMessages(
      await convertToModelMessages(messages)
    );

    // -------------------------------------------------------------------------
    // MCP connector setup — create clients for enabled connectors
    // -------------------------------------------------------------------------
    const { tools: mcpTools, clients: mcpClients, systemHints } =
      await buildMcpToolsForConnectors(userId, enabledConnectors ?? []);

    // Build messages with optional drawing-mode override
    const mcpToolNames = Object.keys(mcpTools);
    const hasDrawingTools = mcpToolNames.some(
      (name) => name === "create_view" || name === "read_me"
    );
    console.log(`[chat] MCP tools loaded: [${mcpToolNames.join(", ")}], hasDrawingTools=${hasDrawingTools}`);

    // Detect drawing intent from the last user message
    let drawingOverride = "";
    if (hasDrawingTools) {
      const lastUserMsg = [...modelMessages]
        .reverse()
        .find((m) => m.role === "user");
      const lastUserText =
        lastUserMsg && Array.isArray(lastUserMsg.content)
          ? lastUserMsg.content
              .filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join(" ")
          : typeof lastUserMsg?.content === "string"
            ? lastUserMsg.content
            : "";

      console.log(`[chat] Last user text: "${lastUserText.substring(0, 100)}"`);
      const drawingPattern =
        /\b(draw|drawing|diagram|sketch|flowchart|wireframe|mind\s*map|whiteboard|canvas|excalidraw|visualiz(e|ation))\b/i;
      const matched = drawingPattern.test(lastUserText);
      console.log(`[chat] Drawing pattern matched: ${matched}`);
      if (matched) {
        drawingOverride = [
          "CRITICAL ROUTING OVERRIDE: The user is requesting a drawing/diagram.",
          "You MUST use the Excalidraw tools to fulfill this request:",
          "1. Call read_me first to learn the Excalidraw element format",
          "2. Query any data you need with query_data (1-2 calls max)",
          "3. Call create_view with Excalidraw elements to render the drawing",
          "Do NOT use ```spec JSONL format for this request. Do NOT render cards, tables, or charts.",
          "The user explicitly wants an interactive Excalidraw canvas drawing.",
        ].join("\n");
      }
    }

    // Build optional model context from MCP App
    let modelContextMessage: ModelMessage | null = null;
    if (modelContext?.content || modelContext?.structuredContent) {
      const contextText = modelContext.structuredContent
        ? JSON.stringify(modelContext.structuredContent)
        : modelContext.content
            ?.filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join('\n') ?? '';
      if (contextText) {
        modelContextMessage = {
          role: 'system',
          content: `[App Context]\n${contextText}`,
        };
      }
    }

    const allMessages: ModelMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
        providerOptions: ANTHROPIC_CACHE_CONTROL,
      },
      {
        role: "system",
        content: accountContext,
      },
      ...systemHints.map((hint) => ({ role: "system" as const, content: hint })),
      ...(drawingOverride
        ? [{ role: "system" as const, content: drawingOverride }]
        : []),
      ...(modelContextMessage ? [modelContextMessage] : []),
      ...modelMessages,
    ];

    // -------------------------------------------------------------------------
    // Build tools — local analytics + MCP connector tools
    // -------------------------------------------------------------------------
    const allTools: Record<string, Tool> = {
      describe_tables: tool({
        description:
          "Returns the full database schema with column types, relationships, query formulas, and best practices. " +
          "MUST be called as your first step before any query_data call. " +
          "The result includes exact column names, types, join patterns, and recommended query strategies.",
        inputSchema: z.object({}),
        execute: async () => {
          return getAnalyticsSchema(userId, selectedAccountIds);
        },
      }),

      query_data: tool({
        description:
          "You must call describe_tables first to know the exact column names and types. " +
          "Execute a read-only PostgreSQL SELECT query against the analytics database. Data is automatically scoped to the current user's TikTok accounts — no account filters needed. Only SELECT queries are allowed. WITH (CTE) queries are supported. Max 500 rows returned.",
        inputSchema: z.object({
          sql: z.string().describe("A PostgreSQL SELECT query"),
        }),
        execute: async ({ sql }: { sql: string }) => {
          try {
            return await executeReadQuery(userId, sql, selectedAccountIds);
          } catch (err) {
            return {
              error:
                err instanceof Error ? err.message : "Query execution failed",
              columns: [],
              rows: [],
              rowCount: 0,
              truncated: false,
            };
          }
        },
      }),

      search_comments: tool({
        description:
          "Semantic search across comments to find examples matching a topic or theme. " +
          "Use for finding specific comments (e.g., 'negative feedback about form'). " +
          "Returns top 30 relevant comments with metadata. " +
          "Use the sentiment filter to narrow results to a specific sentiment (supportive/neutral/unsupportive). " +
          "For aggregate stats, use query_data with GROUP BY sentiment instead.",
        inputSchema: z.object({
          query: z.string().describe("Natural language description of comments to find"),
          sentiment: z.enum(["supportive", "neutral", "unsupportive"]).optional()
            .describe("Filter results to this sentiment classification"),
          limit: z.number().optional().describe("Max results (default 30, max 50)"),
        }),
        execute: async ({ query, sentiment, limit }) => {
          try {
            return await searchComments(userId, query, {
              limit: Math.min(limit ?? 30, 50),
              sentiment,
              selectedAccountIds,
            });
          } catch (err) {
            return {
              error: err instanceof Error ? err.message : "Comment search failed",
              results: [],
              count: 0,
              query: query ?? "",
            };
          }
        },
      }),

      // Merge in remote MCP tools
      ...mcpTools,
    };

    const result = streamText({
      model,
      maxOutputTokens: 16384,
      messages: allMessages,
      stopWhen: stepCountIs(10),
      prepareStep: ({ messages, model }) => ({
        messages: addCacheControlToMessages({ messages, model }),
      }),
      experimental_repairToolCall: async ({ toolCall, error }) => {
        console.warn(
          `[chat] Repairing tool call "${toolCall.toolName}":`,
          error.message
        );

        const tryParse = (s: string): Record<string, unknown> | null => {
          try {
            const parsed = JSON.parse(s);
            const obj = Array.isArray(parsed) ? parsed[0] : parsed;
            if (typeof obj === "object" && obj !== null) return obj;
          } catch {
            /* not valid JSON */
          }
          return null;
        };

        let raw =
          typeof toolCall.input === "string"
            ? toolCall.input
            : JSON.stringify(toolCall.input);

        // Strip trailing non-JSON characters (model sometimes appends period, etc.)
        const lastBrace = Math.max(
          raw.lastIndexOf("}"),
          raw.lastIndexOf("]")
        );
        if (lastBrace > 0) raw = raw.substring(0, lastBrace + 1);

        // Attempt 1: direct parse
        let fixed = tryParse(raw);

        // Attempt 2: the model often emits one extra closing brace/bracket in
        // deeply nested structures. Progressively remove trailing closers.
        if (!fixed) {
          let candidate = raw;
          for (let i = 0; i < 3 && !fixed; i++) {
            const last = candidate.length - 1;
            const ch = candidate[last];
            if (ch === "}" || ch === "]") {
              candidate = candidate.substring(0, last);
              fixed = tryParse(candidate);
            } else {
              break;
            }
          }
        }

        if (fixed) {
          return { ...toolCall, input: JSON.stringify(fixed) };
        }

        return null;
      },
      onFinish: async ({ totalUsage }) => {
        // Fire-and-forget: MCP client cleanup + usage tracking.
        // These must NOT be awaited — onFinish runs inside the stream's
        // flush() handler, so blocking here keeps the HTTP response open
        // and freezes the client UI until the calls complete/timeout.
        Promise.allSettled(
          mcpClients.map((client) =>
            Promise.race([
              client.close(),
              new Promise((resolve) => setTimeout(resolve, 3_000)),
            ])
          )
        ).catch(() => {});

        const totalTokens = totalUsage.totalTokens ?? 0;
        if (totalTokens > 0) {
          Promise.all([
            ingestAiTokenEvent(userId, totalTokens, {
              inputTokens: totalUsage.inputTokens ?? 0,
              outputTokens: totalUsage.outputTokens ?? 0,
            }).catch((err) =>
              console.error("Polar AI token ingestion failed:", err)
            ),
            db.insert(creditTransactions).values({
              userId,
              amount: -totalTokens,
              type: "ai_chat",
              description: `Chat: ${totalUsage.inputTokens ?? 0} in + ${totalUsage.outputTokens ?? 0} out = ${totalTokens} tokens`,
            }).catch((err) =>
              console.error("Credit transaction insert failed:", err)
            ),
          ]).catch(() => {});
        }
      },
      tools: allTools,
    });

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.merge(
          pipeJsonRender(
            result
              .toUIMessageStream({
                messageMetadata: ({ part }) => {
                  if (part.type === "finish") {
                    return { totalUsage: part.totalUsage };
                  }
                },
              })
              .pipeThrough(createSpecRepairTransform())
          )
        );
      },
    });
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("Chat API error:", error);

    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
