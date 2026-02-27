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
} from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { pipeJsonRender } from "@json-render/core";
import { createSpecRepairTransform } from "@/lib/spec-repair";
import { auth, hasFeature } from "@/lib/auth";
import { checkAiTokens } from "@/lib/services/credit-service";
import { ingestAiTokenEvent } from "@/lib/polar";
import { z } from "zod";
import { db } from "@/lib/db";
import { creditTransactions } from "@/lib/db/schema/credits";
import { tiktokAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAnalyticsSchema, executeReadQuery } from "@/lib/mcp-app/data";
import { createDiagramTool } from "@/lib/ai-tools/excalidraw-tools";
import { addCacheControlToMessages, ANTHROPIC_CACHE_CONTROL } from "@/lib/ai-tools/prompt-cache";
import { getAnalyticsChatPrompt } from "@/lib/catalog";
import { chatLimiter } from "@/lib/rate-limit";

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

## Database

### Tables (quick reference)

tiktok_accounts, posts, comments, account_metrics_history, post_collaborators

### Query Strategy
- For simple queries on posts and comments: use the quick reference and query notes below to write SQL directly.
- For aggregations over account_metrics_history, post_collaborators, or any query involving window functions or complex CTEs: call describe_tables FIRST to check data volume and column constraints before writing the query.
- When a query fails, call describe_tables before retrying to verify the schema.

### Query Notes
- IMPORTANT: Always qualify column references with the table name (e.g., posts.likes, posts.comments, posts.shares) to avoid ambiguity with the data scoping layer
- Engagement rate: (posts.likes + posts.comments + posts.shares)::numeric / NULLIF(posts.plays, 0) * 100 — the ::numeric cast prevents integer division truncation
- posts.hashtags is text[] — use unnest(posts.hashtags) to expand
- Join comments table via comments.post_id = posts.id
- Nullable columns: posts.posted_at, posts.duration, posts.song_title, posts.song_artist

${CATALOG_PROMPT}

## Output Routing
- For analytics, data, KPIs, charts, and tables: ALWAYS use the \`\`\`spec JSONL format above.
- The createDiagram tool is ONLY for hand-drawn spatial diagrams — NOT for data visualization.

## Analytics Context
- Wrap the overall response in a Stack (direction: vertical).
- For KPIs: use a Grid of Cards. Each Card contains a Heading (h3) for the metric name and Text (lead variant) for the value. Add a Badge for trend (default=up, destructive=down, outline=neutral). Use Grid (columns: 3, gap: sm) — NEVER stack KPI cards vertically.
- For tabular data: use Table (columns: string[], rows: string[][]). Format all cell values as pre-formatted strings.
- For time-series trends: use LineChart or AreaChart (AreaChart for volume emphasis, LineChart for cleaner comparison).
- For categorical comparisons: use BarChart. Set horizontal=true when category labels are long.
- For proportions/shares: use PieChart (set donut=true for a cleaner look) or RadialChart.
- For multi-dimensional comparison: use RadarChart.
- Always wrap charts in a Card with a title Heading for context.
- Keep data arrays concise (max ~20 data points for readability; aggregate if needed).
- Format numbers compactly (1.2M).
- NEVER use emoji in your responses. Use plain text only — no emoji characters anywhere in headings, lists, or body text.`;

export async function POST(req: Request) {
  try {
    const { messages, selectedAccountIds }: { messages: UIMessage[]; selectedAccountIds?: number[] } = await req.json();

    // Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Rate limit
    const { limited } = chatLimiter.check(userId);
    if (limited) return Response.json({ error: "Rate limit exceeded" }, { status: 429 });

    // Check feature access via DB tier lookup
    const canChat = await hasFeature("analytics_assistant");
    if (!canChat) {
      return Response.json(
        { error: "Feature not available on your plan" },
        { status: 403 }
      );
    }

    // Check if user has AI tokens before proceeding
    const tokenCheck = await checkAiTokens(userId, 1);
    if (!tokenCheck.sufficient) {
      return Response.json(
        { error: "Insufficient AI tokens", balance: tokenCheck.balance, required: 1 },
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
      ...modelMessages,
    ];

    const result = streamText({
      model,
      maxOutputTokens: 16384,
      messages: allMessages,
      stopWhen: stepCountIs(5),
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
          } catch { /* not valid JSON */ }
          return null;
        };

        let raw =
          typeof toolCall.input === "string"
            ? toolCall.input
            : JSON.stringify(toolCall.input);

        // Strip trailing non-JSON characters (model sometimes appends period, etc.)
        const lastBrace = Math.max(raw.lastIndexOf("}"), raw.lastIndexOf("]"));
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
        const totalTokens = totalUsage.totalTokens ?? 0;
        if (totalTokens > 0) {
          // Await Polar ingestion so the meter is more likely to be updated
          // by the time the client starts polling for the new balance.
          await Promise.all([
            ingestAiTokenEvent(userId, totalTokens, {
              inputTokens: totalUsage.inputTokens ?? 0,
              outputTokens: totalUsage.outputTokens ?? 0,
            }).catch((err) => console.error("Polar AI token ingestion failed:", err)),
            db.insert(creditTransactions).values({
              userId,
              amount: -totalTokens,
              type: "ai_chat",
              description: `Chat: ${totalUsage.inputTokens ?? 0} in + ${totalUsage.outputTokens ?? 0} out = ${totalTokens} tokens`,
            }),
          ]);
        }
      },
      tools: {
        describe_tables: tool({
          description:
            "Returns the full database schema with detailed column types and relationships. Use this to discover exact column names and types before writing queries.",
          inputSchema: z.object({}),
          execute: async () => {
            return getAnalyticsSchema(userId, selectedAccountIds);
          },
        }),

        query_data: tool({
          description:
            "Execute a read-only PostgreSQL SELECT query against the analytics database. Data is automatically scoped to the current user's TikTok accounts — no account filters needed. Only SELECT queries are allowed. WITH (CTE) queries are supported. Max 500 rows returned.",
          inputSchema: z.object({
            sql: z.string().describe("A PostgreSQL SELECT query"),
          }),
          execute: async ({ sql }) => {
            try {
              return await executeReadQuery(userId, sql, selectedAccountIds);
            } catch (err) {
              return {
                error: err instanceof Error ? err.message : "Query execution failed",
                columns: [],
                rows: [],
                rowCount: 0,
                truncated: false,
              };
            }
          },
        }),

        createDiagram: {
          ...createDiagramTool,
          // Cache breakpoint on the last tool caches all tool definitions
          providerOptions: ANTHROPIC_CACHE_CONTROL,
        },
      },
    });

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.merge(
          pipeJsonRender(
            result.toUIMessageStream().pipeThrough(createSpecRepairTransform())
          ),
        );
      },
    });
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
